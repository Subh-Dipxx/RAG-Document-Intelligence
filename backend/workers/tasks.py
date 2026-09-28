from __future__ import annotations

import os
import tempfile
from typing import Any

from backend.database import crud
from backend.database.database import get_db
from backend.domain.models import Document, Page
from backend.ingestion.parsers.factory import get_parser
from backend.ingestion.parsers.pdf import PyMuPDFParser
from backend.ingestion.cleaners.pdf import PyMuPDFTextCleaner
from backend.ingestion.classifier import classify_document_content
from backend.chunking.factory import ChunkerFactory
from backend.config import get_settings
from backend.indexing.embedders.bge import get_bge_embedder
from backend.indexing.vector_stores.pgvector import PgVectorStore
from backend.storage.minio_client import minio_storage, RAW_DOCUMENTS_BUCKET
from backend.workers.celery_app import DLQBaseTask, celery_app


settings = get_settings()


@celery_app.task(
    bind=True,
    base=DLQBaseTask,
    name="backend.workers.tasks.process_document_task",
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=settings.celery_retry_backoff_max,
    max_retries=settings.celery_max_retries,
)
def process_document_task(
    self,
    document_id: str,
    version_id: str,
) -> dict[str, Any]:
    """
    Step 2 document-processing pipeline:

    MinIO
        -> PyMuPDF PDF parsing
        -> PostgreSQL pages
        -> naive character chunks
        -> PostgreSQL chunks
        -> local BGE embeddings
        -> pgvector
    """

    print(
        f"Processing document {document_id}, "
        f"version {version_id}, "
        f"attempt={self.request.retries + 1}"
    )

    db_generator = get_db()
    db = next(db_generator)

    temp_path: str | None = None

    try:
        # ---------------------------------------------------------
        # 1. Load document/version metadata from PostgreSQL
        # ---------------------------------------------------------
        db_document = crud.get_document(db, document_id)

        if db_document is None:
            raise ValueError(f"Document not found: {document_id}")

        versions = crud.get_versions(db, document_id)
        db_version = next(
            (version for version in versions if version.id == version_id),
            None,
        )

        if db_version is None:
            raise ValueError(
                f"Version not found: document_id={document_id}, "
                f"version_id={version_id}"
            )

        storage_key = db_version.storage_key

        if not storage_key:
            raise ValueError(
                f"Version has no storage key: {version_id}"
            )

        # ---------------------------------------------------------
        # 2. Download source document from MinIO
        # ---------------------------------------------------------
        file_bytes = minio_storage.download_bytes(
            bucket_name=RAW_DOCUMENTS_BUCKET,
            object_name=storage_key,
        )

        if not file_bytes:
            raise ValueError(
                f"Downloaded document is empty: {storage_key}"
            )

        # ---------------------------------------------------------
        # 3. Select parser for document content
        # ---------------------------------------------------------
        original_name = db_document.file_name or "document"
        parser = get_parser(original_name, file_bytes)

        # ---------------------------------------------------------
        # 4. Write temporary source document
        # ---------------------------------------------------------
        suffix = os.path.splitext(original_name)[1]

        if not suffix:
            suffix = ".bin"

        with tempfile.NamedTemporaryFile(
            mode="wb",
            suffix=suffix,
            delete=False,
        ) as temp_file:
            temp_file.write(file_bytes)
            temp_path = temp_file.name

        # ---------------------------------------------------------
        # 5. Parse document content
        # ---------------------------------------------------------
        parsed = parser.parse(temp_path)

        # Preserve PDF cleaning behavior
        if isinstance(parser, PyMuPDFParser):
            cleaner = PyMuPDFTextCleaner()
            pages = [
                cleaner.clean_page(page)
                for page in parsed.pages
            ]
        else:
            pages = parsed.pages

        print(
            f"Parsed document {document_id}: "
            f"parser={parser.__class__.__name__}, "
            f"pages={len(pages)}"
        )

        # ---------------------------------------------------------
        # 5. Persist pages
        # ---------------------------------------------------------
        existing_pages = crud.get_pages_by_version(
            db,
            version_id,
        )

        if existing_pages:
            print(
                f"Pages already exist for version {version_id}; "
                "skipping duplicate page creation."
            )
        else:
            for page in pages:
                crud.create_page(
                    db=db,
                    document_id=document_id,
                    version_id=version_id,
                    page=page,
                )

        # ---------------------------------------------------------
        # Content Classification based on internal text content
        # ---------------------------------------------------------
        full_doc_text = " ".join([getattr(p, "text", "") or "" for p in pages])
        classification = classify_document_content(
            text=full_doc_text,
        )
        existing_metadata = dict(db_document.metadata_json or {})
        existing_metadata.update(classification)
        db_document.metadata_json = existing_metadata
        db.commit()

        # ---------------------------------------------------------
        # 6. Build domain document for chunking
        #
        # The parser's temporary filename is not our DB document ID,
        # therefore explicitly restore the real IDs here.
        # ---------------------------------------------------------
        domain_document = Document(
            id=document_id,
            title=db_document.title,
            file_name=db_document.file_name,
            mime_type=db_document.mime_type,
            file_size=db_document.file_size,
            owner_id=db_document.owner_id,
            tenant_id=db_document.tenant_id,
            corpus_id=db_document.corpus_id,
            folder_id=db_document.folder_id,
            detected_mime_type=db_document.detected_mime_type,
            language=db_document.language,
            content_hash=db_document.content_hash,
            current_version_id=version_id,
            forbid_external=db_document.forbid_external,
            permissions=db_document.permissions or [],
            pages=pages,
            metadata=db_document.metadata_json or {},
        )

        # ---------------------------------------------------------
        # 7. Configured chunking
        #
        # Prefer the corpus-level chunker when the document belongs
        # to a corpus. Fall back to the global CHUNKER_TYPE setting.
        # ---------------------------------------------------------
        settings = get_settings()

        corpus_chunker_type = (
            db_document.corpus.chunker_type
            if db_document.corpus
            else None
        )

        selected_chunker_type = (
            corpus_chunker_type or settings.chunker_type
        )

        chunker = ChunkerFactory.create(selected_chunker_type)
        chunks = chunker.chunk(domain_document)

        print(
            f"Created {len(chunks)} chunk(s) "
            f"for document {document_id}"
        )

        # ---------------------------------------------------------
        # 8. Persist chunks
        # ---------------------------------------------------------
        existing_chunks = crud.get_chunks_by_document(
            db,
            document_id,
        )

        existing_version_chunks = [
            chunk
            for chunk in existing_chunks
            if chunk.version_id == version_id
        ]

        if existing_version_chunks:
            print(
                f"Chunks already exist for version {version_id}; "
                "skipping duplicate chunk creation."
            )
            persisted_chunks = existing_version_chunks
        else:
            for chunk in chunks:
                crud.create_chunk(
                    db=db,
                    chunk=chunk,
                )

            persisted_chunks = crud.get_chunks_by_document(
                db,
                document_id,
            )

            persisted_chunks = [
                chunk
                for chunk in persisted_chunks
                if chunk.version_id == version_id
            ]

        if not persisted_chunks:
            raise RuntimeError(
                f"No chunks persisted for version {version_id}"
            )

        # ---------------------------------------------------------
        # 9. Generate local BGE embeddings
        # ---------------------------------------------------------
        embedder = get_bge_embedder()

        texts = [
            chunk.text
            for chunk in persisted_chunks
            if chunk.text
        ]

        if not texts:
            raise RuntimeError(
                f"No non-empty chunk text for version {version_id}"
            )

        embeddings = embedder.embed(texts)

        if len(embeddings) != len(texts):
            raise RuntimeError(
                "Embedding count does not match chunk count: "
                f"{len(embeddings)} != {len(texts)}"
            )

        # ---------------------------------------------------------
        # 10. Store vectors in PostgreSQL/pgvector
        # ---------------------------------------------------------
        vector_store = PgVectorStore()

        vector_items = []

        embedding_index = 0

        for chunk in persisted_chunks:
            if not chunk.text:
                continue

            vector_items.append(
                {
                    "id": chunk.id,
                    "vector": embeddings[embedding_index],
                    "embedding_id": chunk.id,
                    "embedding_model": embedder.model_name,
                }
            )

            embedding_index += 1

        vector_store.upsert(vector_items)

        print(
            f"Indexed {len(vector_items)} embedding(s) "
            f"for document {document_id}"
        )

        return {
            "status": "completed",
            "document_id": document_id,
            "version_id": version_id,
            "processed_pages": len(pages),
            "created_chunks": len(persisted_chunks),
            "embedded_chunks": len(vector_items),
            "embedding_model": embedder.model_name,
        }

    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError as cleanup_error:
                print(
                    f"Temporary file cleanup warning: "
                    f"{cleanup_error}"
                )

        try:
            db_generator.close()
        except Exception:
            pass


@celery_app.task(
    name="backend.workers.tasks.dead_letter_handler_task",
)
def dead_letter_handler_task(
    task_name: str,
    task_id: str,
    args: list[Any],
    kwargs: dict[str, Any],
    exception: str,
    traceback: str,
) -> dict[str, Any]:
    """Record a permanently failed task."""

    print(
        f"[DLQ RECORDED] "
        f"{task_name}[{task_id}]"
    )

    print(f"Error: {exception}")

    return {
        "dlq_status": "recorded",
        "task_name": task_name,
        "task_id": task_id,
        "exception": exception,
    }


@celery_app.task(
    bind=True,
    base=DLQBaseTask,
    name="backend.workers.tasks.step1_failure_test_task",
    autoretry_for=(RuntimeError,),
    retry_backoff=False,
    max_retries=settings.celery_max_retries,
)
def step1_failure_test_task(self) -> None:
    """Intentional failure task used only to verify retry/DLQ behavior."""

    raise RuntimeError(
        "Intentional Step 1 retry/DLQ verification failure"
    )
