from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class ChatConversationResponse(BaseModel):
    id: str
    title: Optional[str] = None
    document_id: Optional[str] = None
    created_at: Any
    updated_at: Any


class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    citations: List[Dict[str, Any]] = []
    metadata: Dict[str, Any] = {}
    created_at: Any


class ChatConversationDetailResponse(BaseModel):
    id: str
    title: Optional[str] = None
    document_id: Optional[str] = None
    created_at: Any
    updated_at: Any
    messages: List[ChatMessageResponse] = []
