from __future__ import annotations

import base64

from fastapi import APIRouter, Depends, HTTPException

from backend.api.schemas.query_schemas import (
    CitationResponse,
    QueryRequest,
    QueryResponse,
)
from backend.auth.dependencies import AuthContext, get_auth_context
from backend.auth.dependencies import require_active_organization_access
from backend.database.crud import (
    create_chat_conversation,
    create_chat_message,
    get_chat_conversation,
    get_document,
    get_versions,
)
from backend.database.database import get_db
from backend.database.activity import log_activity
from backend.config import get_settings
from backend.domain.models import Query
from sqlalchemy.orm import Session
from backend.generation.gemini import GeminiGenerator
from backend.generation.intent_router import IntentRouter
from backend.generation.email_action import EmailActionExtractor
from backend.mcp.client import send_email
from backend.mcp.chart_client import create_chart
from backend.retrieval.pgvector import PgVectorRetriever
from backend.storage.minio_client import minio_storage, RAW_DOCUMENTS_BUCKET


router = APIRouter(
    prefix="/query",
    tags=["query"],
)


@router.post("", response_model=QueryResponse)
def query_documents(
    payload: QueryRequest,
    auth: AuthContext = Depends(get_auth_context),
    _active_org_access: AuthContext = Depends(require_active_organization_access),
    db: Session = Depends(get_db),
) -> QueryResponse:
    settings = get_settings()
    current_user_id = auth.user_id

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

    owned_document = None

    if requested_document_id:
        if auth.tenant_id:
            owned_document = get_document(
                db,
                requested_document_id,
                tenant_id=auth.tenant_id,
            )
        else:
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
    # Persist the conversation and user message before intent-specific
    # branches. Every intent must appear in Chat History.
    # ---------------------------------------------------------
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

        if auth.tenant_id:
            log_activity(
                db,
                tenant_id=auth.tenant_id,
                actor_id=current_user_id,
                activity_type="CHAT_OPENED",
                message=(
                    f"Opened a chat with "
                    f"{owned_document.file_name or owned_document.title or 'this document'}"
                    if owned_document
                    else "Opened a new chat"
                ),
                document_id=(
                    owned_document.id
                    if owned_document
                    else None
                ),
                document_name=(
                    owned_document.file_name or owned_document.title or "Untitled document"
                    if owned_document
                    else None
                ),
            )
            db.commit()

    create_chat_message(
        db,
        conversation_id=conversation.id,
        role="user",
        content=payload.question,
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

    if (
        intent == "DOCUMENT_QUERY"
        and requested_document_id
        and auth.tenant_id
        and owned_document is not None
    ):
        log_activity(
            db,
            tenant_id=auth.tenant_id,
            actor_id=current_user_id,
            activity_type="DOCUMENT_QUERY",
            message=(
                f"Requested data from "
                f"{owned_document.file_name or owned_document.title or 'this document'}"
            ),
            document_id=owned_document.id,
            document_name=(
                owned_document.file_name
                or owned_document.title
                or "Untitled document"
            ),
        )
        db.commit()

    generator = GeminiGenerator()

    # ---------------------------------------------------------
    # Contextual query rewriting:
    # Convert elliptical/follow-up document requests into a
    # precise standalone retrieval query without broadening the
    # requested topic.
    # ---------------------------------------------------------
    contextual_query = payload.question

    if (
        has_document
        and intent in {"DOCUMENT_QUERY", "CHART_REQUEST"}
    ):
        contextual_query = intent_router.rewrite_query(
            message=payload.question,
            history=payload.history,
        )

    # ---------------------------------------------------------
    # Email send action:
    # Extract only email details already established in the
    # conversation, then execute the internal MCP email tool.
    # ---------------------------------------------------------
    if intent == "EMAIL_SEND":
        # ---------------------------------------------------------
        # If an active document exists, retrieve from it so the
        # email action can resolve names -> email addresses from
        # the uploaded document.
        # ---------------------------------------------------------
        document_context = ""

        if has_document:
            history_text = "\n".join(
                f"{item.get('role', 'user')}: {item.get('content', '')}"
                for item in (payload.history or [])[-12:]
                if item.get("content")
            )

            retrieval_text = f"""
Conversation:
{history_text}

Latest user request:
{payload.question}
""".strip()

            email_query = Query(
                text=retrieval_text,
                user_id=current_user_id,
                tenant_id=auth.tenant_id,
                corpus_id=payload.corpus_id,
                top_k=(
                    payload.top_k
                    if payload.top_k is not None
                    else settings.retrieval_top_k
                ),
                filters=payload.filters,
            )

            email_retriever = PgVectorRetriever()

            email_chunks = email_retriever.retrieve(
                query=email_query,
                filters=payload.filters,
            )

            context_parts = []

            for chunk in email_chunks:
                chunk_text = getattr(chunk, "text", None)

                if not chunk_text:
                    chunk_text = getattr(chunk, "content", None)

                if chunk_text:
                    context_parts.append(str(chunk_text))

            document_context = "\n\n---\n\n".join(context_parts)

        email_data = email_action_extractor.extract(
            message=payload.question,
            history=payload.history,
            document_context=document_context,
        )

        recipients = email_data.get("to") or []
        subject = email_data.get("subject")
        body = email_data.get("body")
        attach_current_document = email_data.get(
            "attach_current_document",
            False,
        )

        if not recipients or not subject or not body:
            response = QueryResponse(
                conversation_id=conversation.id,
                answer=(
                    "I can send the email, but I need the recipient, "
                    "subject, and email body to be established in the "
                    "conversation or available in the active document."
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
                metadata_json={"abstained": True, "confidence": 0.0, "retrieved_chunks": 0, "model": response.model},
            )
            return response

        attachments = []

        if attach_current_document:
            if not requested_document_id:
                response = QueryResponse(
                    conversation_id=conversation.id,
                    answer=(
                        "I can send the email, but there is no selected "
                        "document to attach."
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
                    metadata_json={"abstained": True, "confidence": 0.0, "retrieved_chunks": 0, "model": response.model},
                )
                return response

            versions = get_versions(
                db,
                requested_document_id,
            )

            if not versions:
                response = QueryResponse(
                    conversation_id=conversation.id,
                    answer=(
                        "I can send the email, but the selected document "
                        "does not have an available version to attach."
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
                    metadata_json={"abstained": True, "confidence": 0.0, "retrieved_chunks": 0, "model": response.model},
                )
                return response

            current_version = next(
                (
                    version
                    for version in versions
                    if version.id == owned_document.current_version_id
                ),
                None,
            )

            if current_version is None:
                current_version = next(
                    (
                        version
                        for version in versions
                        if version.is_current
                    ),
                    versions[0],
                )

            if not current_version.storage_key:
                response = QueryResponse(
                    conversation_id=conversation.id,
                    answer=(
                        "I can send the email, but the selected "
                        "document file is not available in storage."
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
                    metadata_json={"abstained": True, "confidence": 0.0, "retrieved_chunks": 0, "model": response.model},
                )
                return response

            try:
                file_bytes = minio_storage.download_bytes(
                    bucket_name=RAW_DOCUMENTS_BUCKET,
                    object_name=current_version.storage_key,
                )
            except Exception:
                response = QueryResponse(
                    conversation_id=conversation.id,
                    answer=(
                        "I can send the email, but the selected "
                        "document could not be retrieved from storage."
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
                    metadata_json={"abstained": True, "confidence": 0.0, "retrieved_chunks": 0, "model": response.model},
                )
                return response

            if not file_bytes:
                response = QueryResponse(
                    conversation_id=conversation.id,
                    answer=(
                        "I can send the email, but the selected "
                        "document file is empty."
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
                    metadata_json={"abstained": True, "confidence": 0.0, "retrieved_chunks": 0, "model": response.model},
                )
                return response

            attachments.append(
                {
                    "filename": owned_document.file_name
                    or "document",
                    "content_type": (
                        owned_document.mime_type
                        or "application/octet-stream"
                    ),
                    "content_base64": base64.b64encode(
                        file_bytes
                    ).decode("ascii"),
                }
            )

        try:
            mcp_result = send_email(
                to=recipients,
                subject=subject,
                body=body,
                attachments=attachments,
            )

            response = QueryResponse(
                conversation_id=conversation.id,
                answer="Email sent successfully.",
                citations=[],
                abstained=False,
                confidence=1.0,
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

        except Exception:
            response = QueryResponse(
                conversation_id=conversation.id,
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
            create_chat_message(
                db,
                conversation_id=conversation.id,
                role="assistant",
                content=response.answer,
                citations=[],
                metadata_json={"abstained": True, "confidence": 0.0, "retrieved_chunks": 0, "model": response.model},
            )
            return response

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

        response = QueryResponse(
            conversation_id=conversation.id,
            answer=conversational_answer,
            citations=[],
            abstained=False,
            confidence=None,
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

    # Outside-world factual request:
    # Do not send it into RAG and do not claim it was missing
    # from a document.
    if intent == "OUTSIDE_SCOPE":
        response = QueryResponse(
            conversation_id=conversation.id,
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

    # ---------------------------------------------------------
    # Chart request:
    # Retrieve only from the explicitly selected document, then
    # delegate chart generation to the MCP chart tool.
    # ---------------------------------------------------------
    if intent == "CHART_REQUEST":
        if not has_document:
            response = QueryResponse(
                conversation_id=conversation.id,
                answer=(
                    "Please upload or select a document first so I can "
                    "create a chart from its contents."
                ),
                citations=[],
                abstained=True,
                confidence=0.0,
                retrieved_chunks=0,
                model=settings.gemini_model,
                chart=None,
            )
            create_chat_message(
                db,
                conversation_id=conversation.id,
                role="assistant",
                content=response.answer,
                citations=[],
                metadata_json={"abstained": True, "confidence": 0.0, "retrieved_chunks": 0, "model": response.model, "chart": None},
            )
            return response

        chart_query = Query(
            text=contextual_query,
            user_id=current_user_id,
            tenant_id=auth.tenant_id,
            corpus_id=payload.corpus_id,
            top_k=(
                payload.top_k
                if payload.top_k is not None
                else settings.retrieval_top_k
            ),
            filters=payload.filters,
        )

        chart_retriever = PgVectorRetriever()

        chart_chunks = chart_retriever.retrieve(
            query=chart_query,
            filters=payload.filters,
        )

        context_parts = []

        for chunk in chart_chunks:
            chunk_text = getattr(chunk, "text", None)

            if not chunk_text:
                chunk_text = getattr(chunk, "content", None)

            if chunk_text:
                context_parts.append(str(chunk_text))

        document_context = "\n\n---\n\n".join(context_parts)

        if not document_context.strip():
            response = QueryResponse(
                conversation_id=conversation.id,
                answer=(
                    "I couldn't find enough structured information in the "
                    "selected document to create that chart."
                ),
                citations=[],
                abstained=True,
                confidence=0.0,
                retrieved_chunks=0,
                model=settings.gemini_model,
                chart=None,
            )
            create_chat_message(
                db,
                conversation_id=conversation.id,
                role="assistant",
                content=response.answer,
                citations=[],
                metadata_json={"abstained": True, "confidence": 0.0, "retrieved_chunks": 0, "model": response.model, "chart": None},
            )
            return response

        try:
            chart = create_chart(
                question=contextual_query,
                document_context=document_context,
            )

            if chart.get("error") == "INSUFFICIENT_DATA":
                response = QueryResponse(
                    conversation_id=conversation.id,
                    answer=(
                        "I couldn't find enough information in the selected "
                        "document to create that chart."
                    ),
                    citations=[],
                    abstained=True,
                    confidence=0.0,
                    retrieved_chunks=len(chart_chunks),
                    model=settings.gemini_model,
                    chart=None,
                )
                create_chat_message(
                    db,
                    conversation_id=conversation.id,
                    role="assistant",
                    content=response.answer,
                    citations=[],
                    metadata_json={"abstained": True, "confidence": 0.0, "retrieved_chunks": response.retrieved_chunks, "model": response.model, "chart": None},
                )
                return response

            response = QueryResponse(
                conversation_id=conversation.id,
                answer="Here is the chart based on the selected document.",
                citations=[],
                abstained=False,
                confidence=1.0,
                retrieved_chunks=len(chart_chunks),
                model=settings.gemini_model,
                chart=chart,
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
                    "chart": response.chart,
                },
            )

            return response

        except Exception:
            response = QueryResponse(
                conversation_id=conversation.id,
                answer=(
                    "I couldn't create the chart from the selected "
                    "document."
                ),
                citations=[],
                abstained=True,
                confidence=0.0,
                retrieved_chunks=len(chart_chunks),
                model=settings.gemini_model,
                chart=None,
            )
            create_chat_message(
                db,
                conversation_id=conversation.id,
                role="assistant",
                content=response.answer,
                citations=[],
                metadata_json={"abstained": True, "confidence": 0.0, "retrieved_chunks": response.retrieved_chunks, "model": response.model, "chart": None},
            )
            return response

    # DOCUMENT_QUERY continues into the existing RAG pipeline.

    top_k = (
        payload.top_k
        if payload.top_k is not None
        else settings.retrieval_top_k
    )

    # ---------------------------------------------------------
    # Use the semantically rewritten query for retrieval.
    #
    # Example:
    #   previous: "compare Jan and Feb revenue"
    #   latest:   "explain that properly"
    #
    # becomes:
    #   "Provide a structured explanation of the January and
    #    February revenue comparison."
    # ---------------------------------------------------------
    retrieval_text = contextual_query

    query = Query(
        text=retrieval_text,
        user_id=current_user_id,
        tenant_id=auth.tenant_id,
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

