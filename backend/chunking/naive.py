from __future__ import annotations

from typing import List
from uuid import uuid4

from config import get_settings
from domain.models import Chunk, Document


class NaiveCharacterChunker:
    """Simple fixed-size character chunker with configurable overlap."""

    def __init__(
        self,
        chunk_size: int | None = None,
        chunk_overlap: int | None = None,
    ) -> None:
        settings = get_settings()

        self.chunk_size = (
            settings.chunk_size
            if chunk_size is None
            else chunk_size
        )
        self.chunk_overlap = (
            settings.chunk_overlap
            if chunk_overlap is None
            else chunk_overlap
        )

        if self.chunk_size <= 0:
            raise ValueError("chunk_size must be greater than zero")

        if self.chunk_overlap < 0:
            raise ValueError("chunk_overlap cannot be negative")

        if self.chunk_overlap >= self.chunk_size:
            raise ValueError(
                "chunk_overlap must be smaller than chunk_size"
            )

    def chunk(self, document: Document) -> List[Chunk]:
        """Split document page text into fixed-size character chunks."""

        chunks: List[Chunk] = []

        step = self.chunk_size - self.chunk_overlap

        for page in document.pages:
            text = page.text or ""

            if not text:
                continue

            start = 0

            while start < len(text):
                end = min(start + self.chunk_size, len(text))

                chunks.append(
                    Chunk(
                        id=str(uuid4()),
                        document_id=document.id,
                        version_id=document.current_version_id,
                        page_number=page.number,
                        page_start=page.number,
                        page_end=page.number,
                        text=text[start:end],
                        start_offset=start,
                        end_offset=end,
                    )
                )

                if end >= len(text):
                    break

                start += step

        return chunks
