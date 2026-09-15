from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    question: str = Field(min_length=1)
    conversation_id: Optional[str] = None

    user_id: Optional[str] = None
    tenant_id: Optional[str] = None
    corpus_id: Optional[str] = None

    top_k: Optional[int] = Field(
        default=None,
        ge=1,
        le=50,
    )

    filters: Dict[str, Any] = Field(default_factory=dict)


class CitationResponse(BaseModel):
    source: str
    document_id: Optional[str] = None
    version_id: Optional[str] = None
    chunk_id: Optional[str] = None
    page: Optional[int] = None
    excerpt: Optional[str] = None
    is_generated: bool = False


class QueryResponse(BaseModel):
    conversation_id: Optional[str] = None
    answer: str
    citations: List[CitationResponse] = Field(default_factory=list)
    abstained: bool
    confidence: Optional[float] = None
    retrieved_chunks: int
    model: Optional[str] = None