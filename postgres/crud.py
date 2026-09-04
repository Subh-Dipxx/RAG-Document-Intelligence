from typing import List, Optional
from sqlalchemy.orm import Session
from domain.models import Document, Version, Page, Chunk, EvalResult
from postgres.models import (
    DocumentModel,
    VersionModel,
    PageModel,
    ChunkModel,
    EvalResultModel,
)


def create_document(db: Session, doc: Document) -> DocumentModel:
    db_doc = DocumentModel(
        id=doc.id,
        title=doc.title,
        file_name=doc.file_name,
        mime_type=doc.mime_type,
        file_size=doc.file_size,
        permissions=doc.permissions,
        metadata_json=doc.metadata,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc


def get_document(db: Session, doc_id: str) -> Optional[DocumentModel]:
    return db.query(DocumentModel).filter(DocumentModel.id == doc_id).first()


def list_documents(db: Session, skip: int = 0, limit: int = 100) -> List[DocumentModel]:
    return db.query(DocumentModel).offset(skip).limit(limit).all()


def delete_document(db: Session, doc_id: str) -> bool:
    doc = get_document(db, doc_id)
    if not doc:
        return False
    db.delete(doc)
    db.commit()
    return True


def create_version(db: Session, version: Version) -> VersionModel:
    db_version = VersionModel(
        id=version.id,
        document_id=version.document_id,
        version_number=version.version_number,
        storage_key=version.storage_key,
        file_hash=version.file_hash,
        created_at=version.created_at,
        metadata_json=version.metadata,
    )
    db.add(db_version)
    db.commit()
    db.refresh(db_version)
    return db_version


def get_versions(db: Session, document_id: str) -> List[VersionModel]:
    return (
        db.query(VersionModel)
        .filter(VersionModel.document_id == document_id)
        .order_by(VersionModel.version_number.desc())
        .all()
    )


def create_page(db: Session, document_id: str, version_id: str, page: Page) -> PageModel:
    db_page = PageModel(
        document_id=document_id,
        version_id=version_id,
        page_number=page.number,
        text=page.text,
        image_storage_key=page.image_storage_key,
        metadata_json=page.metadata,
    )
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page


def create_chunk(db: Session, chunk: Chunk) -> ChunkModel:
    db_chunk = ChunkModel(
        id=chunk.id,
        document_id=chunk.document_id,
        version_id=chunk.version_id,
        page_number=chunk.page_number,
        text=chunk.text,
        start_offset=chunk.start_offset,
        end_offset=chunk.end_offset,
        tokens=chunk.tokens,
        metadata_json=chunk.metadata,
    )
    db.add(db_chunk)
    db.commit()
    db.refresh(db_chunk)
    return db_chunk


def get_chunks_by_document(db: Session, document_id: str) -> List[ChunkModel]:
    return db.query(ChunkModel).filter(ChunkModel.document_id == document_id).all()


def create_eval_result(db: Session, eval_res: EvalResult) -> EvalResultModel:
    db_eval = EvalResultModel(
        id=eval_res.id,
        query_text=eval_res.query.text,
        query_filters=eval_res.query.filters,
        retrieved_ids=eval_res.retrieved_ids,
        score=eval_res.score,
        correct=eval_res.correct,
        notes=eval_res.notes,
        created_at=eval_res.created_at,
    )
    db.add(db_eval)
    db.commit()
    db.refresh(db_eval)
    return db_eval


def list_eval_results(db: Session, skip: int = 0, limit: int = 100) -> List[EvalResultModel]:
    return db.query(EvalResultModel).offset(skip).limit(limit).all()
