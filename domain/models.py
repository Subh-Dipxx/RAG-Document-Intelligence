from __future__ import annotations
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime


class Page(BaseModel):
    number: int
    text: str
    images: Optional[List[str]] = None
    metadata: Dict[str, Any] = {}


class Version(BaseModel):
    id: str
    document_id: str
    created_at: Optional[datetime] = None
    metadata: Dict[str, Any] = {}


class Document(BaseModel):
    id: str
    title: Optional[str] = None
    pages: List[Page] = []
    versions: List[Version] = []
    metadata: Dict[str, Any] = {}


class Chunk(BaseModel):
    id: str
    document_id: Optional[str] = None
    version_id: Optional[str] = None
    page_number: Optional[int] = None
    text: str
    start_offset: Optional[int] = None
    end_offset: Optional[int] = None
    tokens: Optional[int] = None
    metadata: Dict[str, Any] = {}


class Query(BaseModel):
    text: str
    top_k: int = 10
    filters: Dict[str, Any] = {}


class Citation(BaseModel):
    source: str
    page: Optional[int] = None
    excerpt: Optional[str] = None


class EvalResult(BaseModel):
    query: Query
    retrieved_ids: List[str] = []
    score: Optional[float] = None
    correct: Optional[bool] = None
    notes: Optional[str] = None


# Helper / domain types used by other interfaces
class OCRWord(BaseModel):
    text: str
    confidence: Optional[float] = None
    bbox: Optional[List[int]] = None


class OCRResult(BaseModel):
    full_text: str
    words: List[OCRWord] = []


class ParsedDocument(BaseModel):
    document: Document
    raw_metadata: Dict[str, Any] = {}


class Answer(BaseModel):
    text: str
    citations: List[Citation] = []
    score: Optional[float] = None
