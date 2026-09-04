from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class DocumentCreate(BaseModel):
    title: Optional[str] = None
    permissions: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class VersionResponse(BaseModel):
    id: str
    document_id: str
    version_number: int
    storage_key: Optional[str] = None
    file_hash: Optional[str] = None
    created_at: datetime
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        from_attributes = True


class DocumentResponse(BaseModel):
    id: str
    title: Optional[str] = None
    file_name: Optional[str] = None
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    permissions: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any] = Field(default_factory=dict)
    versions: List[VersionResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class JobStatusResponse(BaseModel):
    task_id: str
    status: str
    result: Optional[Any] = None


class EvalResultCreate(BaseModel):
    query_text: str
    query_filters: Dict[str, Any] = Field(default_factory=dict)
    retrieved_ids: List[str] = Field(default_factory=list)
    score: Optional[float] = None
    correct: Optional[bool] = None
    notes: Optional[str] = None


class EvalResultResponse(BaseModel):
    id: str
    query_text: str
    query_filters: Dict[str, Any] = Field(default_factory=dict)
    retrieved_ids: List[str] = Field(default_factory=list)
    score: Optional[float] = None
    correct: Optional[bool] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
