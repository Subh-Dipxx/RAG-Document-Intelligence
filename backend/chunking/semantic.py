from __future__ import annotations

import re
from typing import List
from uuid import uuid4

from backend.config import get_settings
from backend.domain.models import Chunk, Document, StructuralLabel


class SemanticChunker:
    """
    Semantic chunker based on adjacent sentence embedding similarity.

    BGE is loaded lazily only when semantic chunking is actually executed.
    """

    def __init__(
        self,
        chunk_size: int | None = None,
        similarity_threshold: float | None = None,
    ) -> None:
        settings = get_settings()

        self.chunk_size = (
            settings.chunk_size
            if chunk_size is None
            else chunk_size
        )

        self.similarity_threshold = (
            settings.semantic_similarity_threshold
            if similarity_threshold is None
            else similarity_threshold
        )

        if self.chunk_size <= 0:
            raise ValueError("chunk_size must be greater than zero")

        if not 0.0 <= self.similarity_threshold <= 1.0:
            raise ValueError(
                "similarity_threshold must be between 0 and 1"
            )

    def chunk(self, document: Document) -> List[Chunk]:
        # Import the ML stack only when semantic chunking is actually used.
        from backend.indexing.embedders.bge import get_bge_embedder

        chunks: List[Chunk] = []
        embedder = get_bge_embedder()

        for page in document.pages:
            text = page.text or ""

            if not text.strip():
                continue

            sentences = self._split_sentences(text)

            if not sentences:
                continue

            sentence_texts = [
                sentence["text"]
                for sentence in sentences
            ]

            # One batched embedding call for the whole page.
            embeddings = embedder.embed(sentence_texts)

            current: List[dict] = []
            current_length = 0

            for index, sentence in enumerate(sentences):
                sentence_text = sentence["text"]

                similarity = None

                if index > 0:
                    similarity = self._cosine_similarity(
                        embeddings[index - 1],
                        embeddings[index],
                    )

                exceeds_size = (
                    bool(current)
                    and current_length + len(sentence_text) + 1
                    > self.chunk_size
                )

                topic_changed = (
                    bool(current)
                    and similarity is not None
                    and similarity < self.similarity_threshold
                )

                if exceeds_size or topic_changed:
                    chunks.append(
                        self._build_chunk(
                            document=document,
                            page_number=page.number,
                            sentences=current,
                        )
                    )

                    current = []
                    current_length = 0

                current.append(sentence)
                current_length += len(sentence_text) + 1

            if current:
                chunks.append(
                    self._build_chunk(
                        document=document,
                        page_number=page.number,
                        sentences=current,
                    )
                )

        return chunks

    @staticmethod
    def _split_sentences(text: str) -> List[dict]:
        """
        Split extracted PDF text into sentence-like units while preserving
        character offsets.
        """
        pattern = re.compile(
            r".+?(?:[.!?](?=\s|$)|\n{2,}|$)",
            re.DOTALL,
        )

        sentences: List[dict] = []

        for match in pattern.finditer(text):
            raw = match.group(0)
            cleaned = raw.strip()

            if not cleaned:
                continue

            leading = len(raw) - len(raw.lstrip())
            start_offset = match.start() + leading
            end_offset = start_offset + len(cleaned)

            sentences.append(
                {
                    "text": cleaned,
                    "start_offset": start_offset,
                    "end_offset": end_offset,
                }
            )

        return sentences

    @staticmethod
    def _cosine_similarity(
        first: List[float],
        second: List[float],
    ) -> float:
        if len(first) != len(second):
            raise ValueError(
                "Embedding dimensions must match for cosine similarity"
            )

        # BGEEmbedder normalizes embeddings, so dot product equals
        # cosine similarity.
        return sum(
            a * b
            for a, b in zip(first, second)
        )

    def _build_chunk(
        self,
        document: Document,
        page_number: int,
        sentences: List[dict],
    ) -> Chunk:
        text = " ".join(
            sentence["text"]
            for sentence in sentences
        ).strip()

        return Chunk(
            id=str(uuid4()),
            document_id=document.id,
            version_id=document.current_version_id,
            page_number=page_number,
            page_start=page_number,
            page_end=page_number,
            text=text,
            start_offset=sentences[0]["start_offset"],
            end_offset=sentences[-1]["end_offset"],
            structural_label=StructuralLabel.BODY,
            metadata={
                "chunker": "semantic",
                "similarity_threshold": self.similarity_threshold,
                "similarity_method": "adjacent_sentence_cosine",
            },
        )
