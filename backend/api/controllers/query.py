from __future__ import annotations

from fastapi import APIRouter

from backend.api.schemas.query_schemas import (
    CitationResponse,
    QueryRequest,
    QueryResponse,
)
from backend.config import get_settings
from backend.domain.models import Query
from backend.generation.gemini import GeminiGenerator
from backend.retrieval.pgvector import PgVectorRetriever


router = APIRouter(
    prefix="/query",
    tags=["query"],
)


@router.post("", response_model=QueryResponse)
def query_documents(payload: QueryRequest) -> QueryResponse:
    settings = get_settings()

    top_k = (
        payload.top_k
        if payload.top_k is not None
        else settings.retrieval_top_k
    )

    query = Query(
        text=payload.question,
        user_id=payload.user_id,
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
        return QueryResponse(
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

    return QueryResponse(
        answer=answer.text,
        citations=citations,
        abstained=answer.abstained,
        confidence=answer.confidence,
        retrieved_chunks=len(filtered_chunks),
        model=settings.gemini_model,
    )