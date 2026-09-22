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
    get_document,
)
from backend.database.database import get_db
from backend.config import get_settings
from backend.domain.models import Query
from sqlalchemy.orm import Session
from backend.generation.gemini import GeminiGenerator
from backend.generation.intent_router import IntentRouter
from backend.generation.email_action import EmailActionExtractor
from backend.mcp.client import send_email
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

    # ---------------------------------------------------------
    # Validate document ownership before intent routing/retrieval.
    # The client may provide a document_id, but ownership is always
    # determined by the authenticated JWT user.
    # ---------------------------------------------------------
    requested_document_id = (
        payload.filters.get("document_id")
        if payload.filters
        else None
    )

    if requested_document_id:
        owned_document = get_document(
            db,
            requested_document_id,
            owner_id=current_user_id,
        )
        if owned_document is None:
            raise HTTPException(
                status_code=404,
                detail="Document not found",
            )

    # ---------------------------------------------------------
    # Semantic intent routing happens BEFORE RAG retrieval.
    # ---------------------------------------------------------
    intent_router = IntentRouter()
    email_action_extractor = EmailActionExtractor()

    has_document = bool(
        payload.filters
        and payload.filters.get("document_id")
    )

    intent_result = intent_router.classify(
        message=payload.question,
        history=payload.history,
        has_document=has_document,
    )

    intent = intent_result["intent"]

    generator = GeminiGenerator()

    # ---------------------------------------------------------
    # Email send action:
    # Extract only email details already established in the
    # conversation, then execute the internal MCP email tool.
    # ---------------------------------------------------------
    if intent == "EMAIL_SEND":
        email_data = email_action_extractor.extract(
            message=payload.question,
            history=payload.history,
        )

        recipient = email_data.get("to")
        subject = email_data.get("subject")
        body = email_data.get("body")

        if not recipient or not subject or not body:
            return QueryResponse(
                answer=(
                    "I can send the email, but I need the recipient, "
                    "subject, and email body to be established in the conversation first."
                ),
                citations=[],
                abstained=True,
                confidence=0.0,
                retrieved_chunks=0,
                model=settings.gemini_model,
            )

        try:
            mcp_result = send_email(
                to=recipient,
                subject=subject,
                body=body,
            )

            return QueryResponse(
                answer="Email sent successfully.",
                citations=[],
                abstained=False,
                confidence=1.0,
                retrieved_chunks=0,
                model=settings.gemini_model,
            )

        except Exception:
            return QueryResponse(
                answer=(
                    "I couldn't send the email because the email service "
                    "encountered an error. Please try again."
                ),
                citations=[],
                abstained=True,
                confidence=0.0,
                retrieved_chunks=0,
                model=settings.gemini_model,
            )

    # ---------------------------------------------------------
    # A document query cannot be answered without a document.
    # Do this BEFORE retrieval and BEFORE the document-grounded
    # Gemini generator is called.
    # ---------------------------------------------------------
    if intent == "DOCUMENT_QUERY" and not has_document:
        return QueryResponse(
            answer=(
                "Please upload a document first so I can answer "
                "that from its contents."
            ),
            citations=[],
            abstained=True,
            confidence=0.0,
            retrieved_chunks=0,
            model=settings.gemini_model,
        )

    # Normal conversation:
    # Never run retrieval and never mention documents.
    if intent == "CONVERSATIONAL":
        conversational_answer = generator.generate_conversational(
            message=payload.question,
            history=payload.history,
        )

        return QueryResponse(
            answer=conversational_answer,
            citations=[],
            abstained=False,
            confidence=None,
            retrieved_chunks=0,
            model=settings.gemini_model,
        )

    # Outside-world factual request:
    # Do not send it into RAG and do not claim it was missing
    # from a document.
    if intent == "OUTSIDE_SCOPE":
        return QueryResponse(
            answer=(
                "I can help with conversation and information "
                "available in this workspace, but I don't provide "
                "outside-world factual information."
            ),
            citations=[],
            abstained=True,
            confidence=0.0,
            retrieved_chunks=0,
            model=settings.gemini_model,
        )

    # DOCUMENT_QUERY continues into the existing RAG pipeline.

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

    # Retrieval score is not the final groundedness decision.
    # If retrieval returned candidates below the threshold, still pass
    # them to Gemini so it can determine whether they answer the question.
    generation_chunks = retrieved_chunks

    if not generation_chunks:
        response = QueryResponse(
            conversation_id=conversation.id,
            answer=(
                "I could not find sufficient information "
                "in the uploaded documents to answer this question."
            ),
            citations=[],
            abstained=True,
            confidence=0.0,
            retrieved_chunks=0,
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

    answer = generator.generate(
        query=query,
        context=generation_chunks,
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

