from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from backend.api.schemas.query_schemas import (
    CitationResponse,
    QueryRequest,
    QueryResponse,
)
from backend.auth.dependencies import get_current_user
from backend.database.crud import (
    create_chat_conversation,
    create_chat_message,
    get_chat_conversation,
)
from backend.database.database import get_db
from backend.config import get_settings
from backend.domain.models import Query
from sqlalchemy.orm import Session
from backend.generation.gemini import GeminiGenerator
from backend.retrieval.pgvector import PgVectorRetriever


router = APIRouter(
    prefix="/query",
    tags=["query"],
)


@router.post("", response_model=QueryResponse)
def query_documents(
    payload: QueryRequest,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> QueryResponse:
    settings = get_settings()

    if payload.conversation_id:
        conversation = get_chat_conversation(
            db,
            payload.conversation_id,
            current_user_id,
        )
        if conversation is None:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found",
            )
    else:
        conversation = create_chat_conversation(
            db,
            user_id=current_user_id,
            title=payload.question[:80],
            document_id=payload.filters.get("document_id"),
        )

    create_chat_message(
        db,
        conversation_id=conversation.id,
        role="user",
        content=payload.question,
    )

    top_k = (
        payload.top_k
        if payload.top_k is not None
        else settings.retrieval_top_k
    )

    query = Query(
        text=payload.question,
        user_id=current_user_id,
        tenant_id=payload.tenant_id,
        corpus_id=payload.corpus_id,
        top_k=top_k,
        filters=payload.filters,
    )

    retriever = PgVectorRetriever()

    retrieved_chunks = retriever.retrieve(
        query=query,
        filters=payload.filters,
    )

    filtered_chunks = [
        chunk
        for chunk in retrieved_chunks
        if float(chunk.metadata.get("score", 0.0))
        >= settings.retrieval_min_score
    ]

    if not filtered_chunks:
        response = QueryResponse(
            conversation_id=conversation.id,
            answer=(
                "I could not find sufficient information "
                "in the uploaded documents to answer this question."
            ),
            citations=[],
            abstained=True,
            confidence=0.0,
            retrieved_chunks=len(retrieved_chunks),
            model=settings.gemini_model,
        )

        create_chat_message(
            db,
            conversation_id=conversation.id,
            role="assistant",
            content=response.answer,
            citations=[],
            metadata_json={
                "abstained": response.abstained,
                "confidence": response.confidence,
                "retrieved_chunks": response.retrieved_chunks,
                "model": response.model,
            },
        )

        return response

    generator = GeminiGenerator()

    answer = generator.generate(
        query=query,
        context=filtered_chunks,
    )

    citations = [
        CitationResponse(
            source=citation.source,
            document_id=citation.document_id,
            version_id=citation.version_id,
            chunk_id=citation.chunk_id,
            page=citation.page,
            excerpt=citation.excerpt,
            is_generated=citation.is_generated,
        )
        for citation in answer.citations
    ]

    response = QueryResponse(
        conversation_id=conversation.id,
        answer=answer.text,
        citations=citations,
        abstained=answer.abstained,
        confidence=answer.confidence,
        retrieved_chunks=len(filtered_chunks),
        model=settings.gemini_model,
    )

    create_chat_message(
        db,
        conversation_id=conversation.id,
        role="assistant",
        content=response.answer,
        citations=[citation.model_dump() for citation in response.citations],
        metadata_json={
            "abstained": response.abstained,
            "confidence": response.confidence,
            "retrieved_chunks": response.retrieved_chunks,
            "model": response.model,
        },
    )

    return response

