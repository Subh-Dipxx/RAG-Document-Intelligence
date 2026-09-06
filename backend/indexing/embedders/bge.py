from __future__ import annotations

from typing import List, Sequence

from sentence_transformers import SentenceTransformer

from backend.config import get_settings


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


_embedder: BGEEmbedder | None = None


def get_bge_embedder() -> BGEEmbedder:
    """
    Return the BGE embedder cached for the current worker process.

    Celery uses separate processes for prefork workers, so each
    worker process gets its own model instance instead of loading
    the model for every document-processing task.
    """
    global _embedder

    if _embedder is None:
        _embedder = BGEEmbedder()

    return _embedder