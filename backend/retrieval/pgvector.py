from __future__ import annotations

from typing import Any, Dict, List, Optional

from backend.domain.models import Chunk, Query
from backend.indexing.embedders.bge import get_bge_embedder
from backend.indexing.vector_stores.pgvector import PgVectorStore


class PgVectorRetriever:
    """Retrieve document chunks using BGE embeddings and pgvector."""

    def __init__(
        self,
        vector_store: Optional[PgVectorStore] = None,
    ) -> None:
        self.embedder = get_bge_embedder()
        self.vector_store = vector_store or PgVectorStore()

    def retrieve(
        self,
        query: Query,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Chunk]:

        effective_filters = dict(filters or {})

        if query.filters:
            effective_filters.update(query.filters)

        query_vectors = self.embedder.embed([query.text])

        if not query_vectors:
            return []

        results = self.vector_store.search(
            vector=query_vectors[0],
            top_k=query.top_k,
            filter=effective_filters,
        )

        chunks: List[Chunk] = []

        for result in results:
            chunks.append(
                Chunk(
                    id=result["id"],
                    document_id=result.get("document_id"),
                    version_id=result.get("version_id"),
                    page_number=result.get("page_number"),
                    text=result["text"],
                    embedding_model=result.get("embedding_model"),
                    metadata={
                        "distance": result.get("distance"),
                        "score": result.get("score"),
                    },
                )
            )

        if not chunks and effective_filters.get("document_id"):
            chunks = self._get_document_chunks_fallback(
                str(effective_filters["document_id"]),
                limit=query.top_k,
            )

        return chunks

    def _get_document_chunks_fallback(
        self,
        document_id: str,
        limit: int = 5,
    ) -> List[Chunk]:
        from sqlalchemy import select
        from backend.database.database import get_engine
        from backend.database.models import ChunkModel

        engine = get_engine()
        query_stmt = (
            select(
                ChunkModel.id,
                ChunkModel.document_id,
                ChunkModel.version_id,
                ChunkModel.page_number,
                ChunkModel.text,
                ChunkModel.embedding_model,
            )
            .where(ChunkModel.document_id == document_id)
            .order_by(ChunkModel.page_number, ChunkModel.id)
            .limit(limit)
        )

        with engine.connect() as connection:
            rows = connection.execute(query_stmt).mappings().all()

        return [
            Chunk(
                id=row["id"],
                document_id=row["document_id"],
                version_id=row["version_id"],
                page_number=row["page_number"],
                text=row["text"],
                embedding_model=row["embedding_model"],
                metadata={"score": 1.0},
            )
            for row in rows
        ]