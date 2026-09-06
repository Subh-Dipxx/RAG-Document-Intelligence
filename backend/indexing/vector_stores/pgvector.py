from __future__ import annotations

from typing import Any, Dict, List, Optional

from sqlalchemy import select

from backend.database.database import get_engine
from backend.database.models import ChunkModel


class PgVectorStore:
    """PostgreSQL/pgvector implementation of the VectorStore protocol."""

    def __init__(self) -> None:
        self.engine = get_engine()

    def upsert(self, items: List[Dict[str, Any]]) -> None:
        if not items:
            return

        with self.engine.begin() as connection:
            for item in items:
                chunk_id = item["id"]
                vector = item["vector"]

                values = {
                    "embedding": vector,
                }

                if "embedding_id" in item:
                    values["embedding_id"] = item["embedding_id"]

                if "embedding_model" in item:
                    values["embedding_model"] = item["embedding_model"]

                result = connection.execute(
                    ChunkModel.__table__.update()
                    .where(ChunkModel.id == chunk_id)
                    .values(**values)
                )

                if result.rowcount == 0:
                    raise ValueError(
                        f"Chunk not found for vector upsert: {chunk_id}"
                    )

    def search(
        self,
        vector: List[float],
        top_k: int = 10,
        filter: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        if not vector:
            return []

        if top_k <= 0:
            return []

        query = select(
            ChunkModel.id,
            ChunkModel.document_id,
            ChunkModel.version_id,
            ChunkModel.page_number,
            ChunkModel.text,
            ChunkModel.embedding_model,
            ChunkModel.embedding.cosine_distance(vector).label("distance"),
        ).where(
            ChunkModel.embedding.is_not(None)
        )

        if filter:
            if filter.get("document_id") is not None:
                query = query.where(
                    ChunkModel.document_id == filter["document_id"]
                )

            if filter.get("version_id") is not None:
                query = query.where(
                    ChunkModel.version_id == filter["version_id"]
                )

        query = query.order_by("distance").limit(top_k)

        with self.engine.connect() as connection:
            rows = connection.execute(query).mappings().all()

        return [
            {
                "id": row["id"],
                "document_id": row["document_id"],
                "version_id": row["version_id"],
                "page_number": row["page_number"],
                "text": row["text"],
                "embedding_model": row["embedding_model"],
                "distance": float(row["distance"]),
                "score": 1.0 - float(row["distance"]),
            }
            for row in rows
        ]

    def delete(
        self,
        ids: Optional[List[str]] = None,
        filter: Optional[Dict[str, Any]] = None,
    ) -> None:
        if not ids and not filter:
            return

        statement = ChunkModel.__table__.update()

        conditions = []

        if ids:
            conditions.append(ChunkModel.id.in_(ids))

        if filter:
            if filter.get("document_id") is not None:
                conditions.append(
                    ChunkModel.document_id == filter["document_id"]
                )

            if filter.get("version_id") is not None:
                conditions.append(
                    ChunkModel.version_id == filter["version_id"]
                )

        if not conditions:
            return

        statement = statement.where(*conditions).values(
            embedding=None,
            embedding_id=None,
            embedding_model=None,
        )

        with self.engine.begin() as connection:
            connection.execute(statement)
