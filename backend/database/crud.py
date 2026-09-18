from typing import List, Optional

from sqlalchemy.orm import Session

from backend.database.models import (
    AccessGrantModel,
    ChunkModel,
    CitationModel,
    ChatConversationModel,
    ChatMessageModel,
    CorpusModel,
    DeletionAuditModel,
    DocumentModel,
    EvalResultModel,
    FindingModel,
    JobModel,
    PageModel,
    QueryLogModel,
    TableModel,
    TenantModel,
    VersionModel,
    generate_uuid,
    utc_now,
)
from backend.domain.models import (
    AccessGrant,
    Chunk,
    Citation,
    ContentOrigin,
    Corpus,
    Document,
    EvalResult,
    Finding,
    Job,
    Page,
    QueryLog,
    Table,
    Tenant,
    Version,
)


def _enum_value(value, default: str) -> str:
    if value is None:
        return default
    return getattr(value, "value", str(value))


def create_tenant(db: Session, tenant: Tenant) -> TenantModel:
    row = TenantModel(
        id=tenant.id,
        name=tenant.name,
        quota_documents=tenant.quota_documents,
        quota_pages=tenant.quota_pages,
        quota_storage_bytes=tenant.quota_storage_bytes,
        forbid_external=tenant.forbid_external,
        metadata_json=tenant.metadata,
        created_at=tenant.created_at,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def create_corpus(db: Session, corpus: Corpus) -> CorpusModel:
    row = CorpusModel(
        id=corpus.id,
        tenant_id=corpus.tenant_id,
        name=corpus.name,
        forbid_external=corpus.forbid_external,
        chunker_type=corpus.chunker_type,
        embedding_model=corpus.embedding_model,
        embedding_dim=corpus.embedding_dim,
        metadata_json=corpus.metadata,
        created_at=corpus.created_at,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def create_access_grant(db: Session, grant: AccessGrant) -> AccessGrantModel:
    row = AccessGrantModel(
        id=grant.id or generate_uuid(),
        tenant_id=grant.tenant_id,
        corpus_id=grant.corpus_id,
        document_id=grant.document_id,
        principal=grant.principal,
        role=_enum_value(grant.role, "viewer"),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def create_document(db: Session, doc: Document) -> DocumentModel:
    db_doc = DocumentModel(
        id=doc.id,
        title=doc.title,
        file_name=doc.file_name,
        mime_type=doc.mime_type,
        file_size=doc.file_size,
        owner_id=doc.owner_id,
        tenant_id=doc.tenant_id,
        corpus_id=doc.corpus_id,
        folder_id=doc.folder_id,
        detected_mime_type=doc.detected_mime_type,
        language=doc.language,
        content_hash=doc.content_hash,
        near_dup_fingerprint=doc.near_dup_fingerprint,
        current_version_id=doc.current_version_id,
        forbid_external=doc.forbid_external,
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
    return (
        db.query(DocumentModel)
        .order_by(DocumentModel.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def delete_document(
    db: Session, doc_id: str, actor_id: Optional[str] = None, reason: Optional[str] = None
) -> bool:
    """Hard-delete document content. Keep only a deletion audit row (no payload)."""
    doc = get_document(db, doc_id)
    if not doc:
        return False
    audit = DeletionAuditModel(
        id=generate_uuid(),
        tenant_id=doc.tenant_id,
        corpus_id=doc.corpus_id,
        document_id=doc.id,
        actor_id=actor_id,
        reason=reason,
    )
    db.add(audit)
    db.delete(doc)
    db.commit()
    return True


def list_deletion_audits(db: Session, document_id: str) -> List[DeletionAuditModel]:
    return (
        db.query(DeletionAuditModel)
        .filter(DeletionAuditModel.document_id == document_id)
        .all()
    )


def create_version(db: Session, version: Version) -> VersionModel:
    db_version = VersionModel(
        id=version.id,
        document_id=version.document_id,
        version_number=version.version_number,
        storage_key=version.storage_key,
        file_hash=version.file_hash,
        is_current=version.is_current,
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
        thumbnail_storage_key=page.thumbnail_storage_key,
        origin=_enum_value(page.origin, ContentOrigin.EXTRACTED.value),
        is_generated=bool(page.is_generated),
        ocr_confidence=page.ocr_confidence,
        low_confidence=bool(page.low_confidence),
        language=page.language,
        reading_order=page.reading_order or [],
        metadata_json=page.metadata,
    )
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page


def get_pages_by_version(db: Session, version_id: str) -> List[PageModel]:
    return (
        db.query(PageModel)
        .filter(PageModel.version_id == version_id)
        .order_by(PageModel.page_number.asc())
        .all()
    )


def create_chunk(db: Session, chunk: Chunk) -> ChunkModel:
    db_chunk = ChunkModel(
        id=chunk.id,
        document_id=chunk.document_id,
        version_id=chunk.version_id,
        page_number=chunk.page_number,
        page_start=chunk.page_start if chunk.page_start is not None else chunk.page_number,
        page_end=chunk.page_end if chunk.page_end is not None else chunk.page_number,
        text=chunk.text,
        start_offset=chunk.start_offset,
        end_offset=chunk.end_offset,
        tokens=chunk.tokens,
        origin=_enum_value(chunk.origin, "extracted"),
        source_type=_enum_value(chunk.source_type, "text_layer"),
        structural_label=_enum_value(chunk.structural_label, "body"),
        is_generated=bool(chunk.is_generated),
        extraction_confidence=chunk.extraction_confidence,
        section_breadcrumb=chunk.section_breadcrumb,
        contextual_prefix=chunk.contextual_prefix,
        parent_chunk_id=chunk.parent_chunk_id,
        content_hash=chunk.content_hash,
        embedding_id=chunk.embedding_id,
        embedding_model=chunk.embedding_model,
        metadata_json=chunk.metadata,
    )
    db.add(db_chunk)
    db.commit()
    db.refresh(db_chunk)
    return db_chunk


def get_chunks_by_document(db: Session, document_id: str) -> List[ChunkModel]:
    return db.query(ChunkModel).filter(ChunkModel.document_id == document_id).all()


def create_table(db: Session, table: Table) -> TableModel:
    row = TableModel(
        id=table.id,
        document_id=table.document_id,
        version_id=table.version_id,
        page_start=table.page_start,
        page_end=table.page_end,
        caption=table.caption,
        headers=table.headers,
        rows=table.rows,
        serialization=table.serialization,
        storage_key=table.storage_key,
        is_generated=table.is_generated,
        metadata_json=table.metadata,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def create_job(db: Session, job: Job) -> JobModel:
    row = JobModel(
        id=job.id,
        tenant_id=job.tenant_id,
        corpus_id=job.corpus_id,
        document_id=job.document_id,
        version_id=job.version_id,
        state=_enum_value(job.state, "queued"),
        last_committed_page=job.last_committed_page,
        last_committed_chunk=job.last_committed_chunk,
        attempt=job.attempt,
        error=job.error,
        cancel_requested=job.cancel_requested,
        metadata_json=job.metadata,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_job_progress(
    db: Session, job_id: str, last_committed_page: int, last_committed_chunk: Optional[str] = None
) -> Optional[JobModel]:
    row = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not row:
        return None
    row.last_committed_page = last_committed_page
    if last_committed_chunk is not None:
        row.last_committed_chunk = last_committed_chunk
    db.commit()
    db.refresh(row)
    return row


def create_finding(db: Session, finding: Finding) -> FindingModel:
    row = FindingModel(
        id=finding.id,
        document_id=finding.document_id,
        version_id=finding.version_id,
        page=finding.page,
        chunk_id=finding.chunk_id,
        kind=_enum_value(finding.kind, "identifier"),
        label=finding.label,
        start_offset=finding.start_offset,
        end_offset=finding.end_offset,
        redacted=finding.redacted,
        metadata_json=finding.metadata,
        created_at=finding.created_at,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def create_citation(db: Session, citation: Citation) -> CitationModel:
    db_citation = CitationModel(
        source=citation.source,
        document_id=citation.document_id,
        version_id=citation.version_id,
        chunk_id=citation.chunk_id,
        page=citation.page,
        excerpt=citation.excerpt,
        start_offset=citation.start_offset,
        end_offset=citation.end_offset,
        is_generated=bool(citation.is_generated),
    )
    db.add(db_citation)
    db.commit()
    db.refresh(db_citation)
    return db_citation


def list_citations_by_document(db: Session, document_id: str) -> List[CitationModel]:
    return db.query(CitationModel).filter(CitationModel.document_id == document_id).all()


def create_query_log(db: Session, log: QueryLog) -> QueryLogModel:
    row = QueryLogModel(
        id=log.id,
        query_text=log.query.text,
        user_id=log.query.user_id,
        tenant_id=log.query.tenant_id,
        corpus_id=log.query.corpus_id,
        permissions=log.query.permissions,
        filters=log.query.filters,
        retrieved_ids=log.retrieved_ids,
        document_version_ids=log.document_version_ids,
        answer_id=log.answer_id,
        abstained=log.abstained,
        created_at=log.created_at,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def create_eval_result(db: Session, eval_res: EvalResult) -> EvalResultModel:
    db_eval = EvalResultModel(
        id=eval_res.id,
        query_text=eval_res.query.text,
        query_filters=eval_res.query.filters,
        query_permissions=eval_res.query.permissions,
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


def create_chat_conversation(
    db: Session,
    user_id: str,
    title: Optional[str] = None,
    document_id: Optional[str] = None,
) -> "ChatConversationModel":
    row = ChatConversationModel(
        id=generate_uuid(),
        user_id=user_id,
        title=title,
        document_id=document_id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_chat_conversation(
    db: Session,
    conversation_id: str,
    user_id: str,
) -> Optional["ChatConversationModel"]:
    return (
        db.query(ChatConversationModel)
        .filter(
            ChatConversationModel.id == conversation_id,
            ChatConversationModel.user_id == user_id,
        )
        .first()
    )


def list_chat_conversations(
    db: Session,
    user_id: str,
) -> List["ChatConversationModel"]:
    return (
        db.query(ChatConversationModel)
        .filter(ChatConversationModel.user_id == user_id)
        .order_by(ChatConversationModel.updated_at.desc())
        .all()
    )


def create_chat_message(
    db: Session,
    conversation_id: str,
    role: str,
    content: str,
    citations: Optional[list] = None,
    metadata_json: Optional[dict] = None,
) -> "ChatMessageModel":
    row = ChatMessageModel(
        id=generate_uuid(),
        conversation_id=conversation_id,
        role=role,
        content=content,
        citations=citations or [],
        metadata_json=metadata_json or {},
    )
    db.add(row)

    conversation = (
        db.query(ChatConversationModel)
        .filter(ChatConversationModel.id == conversation_id)
        .first()
    )
    if conversation:
        conversation.updated_at = utc_now()

    db.commit()
    db.refresh(row)
    return row


def list_chat_messages(
    db: Session,
    conversation_id: str,
) -> List["ChatMessageModel"]:
    return (
        db.query(ChatMessageModel)
        .filter(ChatMessageModel.conversation_id == conversation_id)
        .order_by(ChatMessageModel.created_at.asc())
        .all()
    )
