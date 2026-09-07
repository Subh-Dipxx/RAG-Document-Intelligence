from __future__ import annotations

from typing import Any, Dict, List, Optional

from backend.domain.models import Chunk, Query
from backend.indexing.embedders.bge import get_bge_embedder
from backend.indexing.vector_stores.pgvector import PgVectorStore


class PgVectorRetriever:
    """Retrieve document chunks using BGE embeddings and pgvector."""

    def __init__(
        self,
        vector_store: Optional[PgVectorStore] = None,
    ) -> None:
        self.embedder = get_bge_embedder()
        self.vector_store = vector_store or PgVectorStore()

    def retrieve(
        self,
        query: Query,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Chunk]:

        effective_filters = dict(filters or {})

        if query.filters:
            effective_filters.update(query.filters)

        query_vectors = self.embedder.embed([query.text])

        if not query_vectors:
            return []

        results = self.vector_store.search(
            vector=query_vectors[0],
            top_k=query.top_k,
            filter=effective_filters,
        )

        chunks: List[Chunk] = []

        for result in results:
            chunks.append(
                Chunk(
                    id=result["id"],
                    document_id=result.get("document_id"),
                    version_id=result.get("version_id"),
                    page_number=result.get("page_number"),
                    text=result["text"],
                    embedding_model=result.get("embedding_model"),
                    metadata={
                        "distance": result.get("distance"),
                        "score": result.get("score"),
                    },
                )
            )

        return chunks