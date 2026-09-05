from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ContentOrigin(str, Enum):
    EXTRACTED = "extracted"
    GENERATED = "generated"


class SourceType(str, Enum):
    TEXT_LAYER = "text_layer"
    OCR = "ocr"
    GENERATED_DESCRIPTION = "generated_description"
    TABLE_SERIALIZATION = "table_serialization"


class StructuralLabel(str, Enum):
    HEADING = "heading"
    BODY = "body"
    TABLE = "table"
    CAPTION = "caption"
    FOOTNOTE = "footnote"
    LIST = "list"


class Role(str, Enum):
    OWNER = "owner"
    EDITOR = "editor"
    VIEWER = "viewer"


class JobState(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    PAUSED = "paused"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"
    DEAD_LETTER = "dead_letter"


class FindingKind(str, Enum):
    IDENTIFIER = "identifier"
    CONTACT = "contact"
    FINANCIAL = "financial"
    HEALTH = "health"
    INJECTION = "injection"


class Tenant(BaseModel):
    id: str
    name: str
    quota_documents: Optional[int] = None
    quota_pages: Optional[int] = None
    quota_storage_bytes: Optional[int] = None
    forbid_external: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=utc_now)


class Corpus(BaseModel):
    id: str
    tenant_id: str
    name: str
    forbid_external: bool = False
    embedding_model: Optional[str] = None
    embedding_dim: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=utc_now)


class AccessGrant(BaseModel):
    id: Optional[str] = None
    tenant_id: str
    corpus_id: Optional[str] = None
    document_id: Optional[str] = None
    principal: str
    role: Role = Role.VIEWER


class Page(BaseModel):
    number: int
    text: str
    images: Optional[List[str]] = None
    image_storage_key: Optional[str] = None
    thumbnail_storage_key: Optional[str] = None
    origin: ContentOrigin = ContentOrigin.EXTRACTED
    is_generated: bool = False
    ocr_confidence: Optional[float] = None
    low_confidence: bool = False
    language: Optional[str] = None
    reading_order: Optional[List[int]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Version(BaseModel):
    id: str
    document_id: str
    version_number: int = 1
    storage_key: Optional[str] = None
    file_hash: Optional[str] = None
    is_current: bool = True
    created_at: datetime = Field(default_factory=utc_now)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Document(BaseModel):
    id: str
    title: Optional[str] = None
    file_name: Optional[str] = None
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    owner_id: Optional[str] = None
    tenant_id: Optional[str] = None
    corpus_id: Optional[str] = None
    folder_id: Optional[str] = None
    detected_mime_type: Optional[str] = None
    language: Optional[str] = None
    content_hash: Optional[str] = None
    near_dup_fingerprint: Optional[str] = None
    current_version_id: Optional[str] = None
    forbid_external: bool = False
    permissions: List[str] = Field(default_factory=list)
    pages: List[Page] = Field(default_factory=list)
    versions: List[Version] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Chunk(BaseModel):
    id: str
    document_id: Optional[str] = None
    version_id: Optional[str] = None
    page_number: Optional[int] = None
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    text: str
    start_offset: Optional[int] = None
    end_offset: Optional[int] = None
    tokens: Optional[int] = None
    origin: ContentOrigin = ContentOrigin.EXTRACTED
    source_type: SourceType = SourceType.TEXT_LAYER
    structural_label: StructuralLabel = StructuralLabel.BODY
    is_generated: bool = False
    extraction_confidence: Optional[float] = None
    section_breadcrumb: Optional[str] = None
    contextual_prefix: Optional[str] = None
    parent_chunk_id: Optional[str] = None
    content_hash: Optional[str] = None
    embedding_id: Optional[str] = None
    embedding_model: Optional[str] = None

class Table(BaseModel):
    id: str
    document_id: str
    version_id: Optional[str] = None
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    caption: Optional[str] = None
    headers: List[str] = Field(default_factory=list)
    rows: List[List[Any]] = Field(default_factory=list)
    serialization: Optional[str] = None
    storage_key: Optional[str] = None
    is_generated: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Job(BaseModel):
    id: str
    tenant_id: Optional[str] = None
    corpus_id: Optional[str] = None
    document_id: Optional[str] = None
    version_id: Optional[str] = None
    state: JobState = JobState.QUEUED
    last_committed_page: int = 0
    last_committed_chunk: Optional[str] = None
    attempt: int = 0
    error: Optional[str] = None
    cancel_requested: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class Finding(BaseModel):
    id: str
    document_id: str
    version_id: Optional[str] = None
    page: Optional[int] = None
    chunk_id: Optional[str] = None
    kind: FindingKind = FindingKind.IDENTIFIER
    label: str
    start_offset: Optional[int] = None
    end_offset: Optional[int] = None
    redacted: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=utc_now)


class Query(BaseModel):
    text: str
    user_id: Optional[str] = None
    tenant_id: Optional[str] = None
    corpus_id: Optional[str] = None
    top_k: int = 10
    permissions: List[str] = Field(default_factory=list)
    filters: Dict[str, Any] = Field(default_factory=dict)


class Citation(BaseModel):
    source: str
    document_id: Optional[str] = None
    version_id: Optional[str] = None
    chunk_id: Optional[str] = None
    page: Optional[int] = None
    excerpt: Optional[str] = None
    start_offset: Optional[int] = None
    end_offset: Optional[int] = None
    is_generated: bool = False


class QueryLog(BaseModel):
    id: str
    query: Query
    retrieved_ids: List[str] = Field(default_factory=list)
    document_version_ids: List[str] = Field(default_factory=list)
    answer_id: Optional[str] = None
    abstained: bool = False
    created_at: datetime = Field(default_factory=utc_now)


class EvalResult(BaseModel):
    id: str
    query: Query
    retrieved_ids: List[str] = Field(default_factory=list)
    score: Optional[float] = None
    correct: Optional[bool] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)


class DeletionAudit(BaseModel):
    id: str
    tenant_id: Optional[str] = None
    corpus_id: Optional[str] = None
    document_id: str
    actor_id: Optional[str] = None
    reason: Optional[str] = None
    deleted_at: datetime = Field(default_factory=utc_now)


class OCRWord(BaseModel):
    text: str
    confidence: Optional[float] = None
    bbox: Optional[List[float]] = None


class OCRResult(BaseModel):
    full_text: str
    words: List[OCRWord] = Field(default_factory=list)
    confidence: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ParsedDocument(BaseModel):
    document: Document
    pages: List[Page] = Field(default_factory=list)
    tables: List[Table] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Answer(BaseModel):
    text: str
    citations: List[Citation] = Field(default_factory=list)
    is_generated: bool = True
    abstained: bool = False
    confidence: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)    
