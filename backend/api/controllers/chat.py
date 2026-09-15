from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.api.schemas.chat_schemas import (
    ChatConversationDetailResponse,
    ChatConversationResponse,
    ChatMessageResponse,
)
from backend.auth.dependencies import get_current_user
from backend.database.crud import (
    get_chat_conversation,
    list_chat_conversations,
    list_chat_messages,
)
from backend.database.database import get_db


router = APIRouter(
    prefix="/chat",
    tags=["chat"],
)


@router.get("", response_model=list[ChatConversationResponse])
def get_conversations(
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ChatConversationResponse]:
    conversations = list_chat_conversations(db, current_user_id)

    return [
        ChatConversationResponse(
            id=conversation.id,
            title=conversation.title,
            document_id=conversation.document_id,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
        )
        for conversation in conversations
    ]


@router.get(
    "/{conversation_id}",
    response_model=ChatConversationDetailResponse,
)
def get_conversation(
    conversation_id: str,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChatConversationDetailResponse:
    conversation = get_chat_conversation(
        db,
        conversation_id,
        current_user_id,
    )

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    messages = list_chat_messages(db, conversation.id)

    return ChatConversationDetailResponse(
        id=conversation.id,
        title=conversation.title,
        document_id=conversation.document_id,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[
            ChatMessageResponse(
                id=message.id,
                role=message.role,
                content=message.content,
                citations=message.citations or [],
                metadata=message.metadata_json or {},
                created_at=message.created_at,
            )
            for message in messages
        ],
    )
