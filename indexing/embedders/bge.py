from __future__ import annotations

from typing import List, Sequence

from sentence_transformers import SentenceTransformer

from config import get_settings


class BGEEmbedder:
    """Local Sentence Transformers embedder."""

    def __init__(self, model_name: str | None = None) -> None:
        settings = get_settings()
        self.model_name = (
            settings.embedding_model
            if model_name is None
            else model_name
        )
        self.model = SentenceTransformer(self.model_name)

    def embed(self, texts: Sequence[str]) -> List[List[float]]:
        if not texts:
            return []

        embeddings = self.model.encode(
            list(texts),
            normalize_embeddings=True,
        )

        return embeddings.tolist()
