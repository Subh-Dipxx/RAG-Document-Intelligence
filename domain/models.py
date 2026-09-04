from __future__ import annotations
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Page(BaseModel):
    number: int
    text: str
    images: Optional[List[str]] = None
    image_storage_key: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Version(BaseModel):
    id: str
    document_id: str
    version_number: int = 1
    storage_key: Optional[str] = None
    file_hash: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Document(BaseModel):
    id: str
    title: Optional[str] = None
    file_name: Optional[str] = None
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
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
    text: str
    start_offset: Optional[int] = None
    end_offset: Optional[int] = None
    tokens: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Query(BaseModel):
    text: str
    top_k: int = 10
    user_id: Optional[str] = None
    permissions: List[str] = Field(default_factory=list)
    filters: Dict[str, Any] = Field(default_factory=dict)


class Citation(BaseModel):
    source: str
    version_id: Optional[str] = None
    page: Optional[int] = None
    excerpt: Optional[str] = None
    start_offset: Optional[int] = None
    end_offset: Optional[int] = None


class EvalResult(BaseModel):
    id: Optional[str] = None
    query: Query
    retrieved_ids: List[str] = Field(default_factory=list)
    score: Optional[float] = None
    correct: Optional[bool] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)


class OCRWord(BaseModel):
    text: str
    confidence: Optional[float] = None
    bbox: Optional[List[int]] = None


class OCRResult(BaseModel):
    full_text: str
    words: List[OCRWord] = Field(default_factory=list)


class ParsedDocument(BaseModel):
    document: Document
    raw_metadata: Dict[str, Any] = Field(default_factory=dict)


class Answer(BaseModel):
    text: str
    citations: List[Citation] = Field(default_factory=list)
    score: Optional[float] = None
    is_generated: bool = True

