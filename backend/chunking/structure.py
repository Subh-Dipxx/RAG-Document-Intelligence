from __future__ import annotations

import re
from typing import List
from uuid import uuid4

from backend.config import get_settings
from backend.domain.models import Chunk, Document, StructuralLabel
from backend.chunking.token_counter import get_token_counter


class StructureAwareChunker:
    """
    Structure-aware text chunker.

    The chunker attempts to preserve logical text boundaries such as
    headings and paragraphs while respecting the configured maximum
    chunk size.
    """

    def __init__(
        self,
        chunk_size: int | None = None,
    ) -> None:
        settings = get_settings()

        self.chunk_size = (
            settings.chunk_size
            if chunk_size is None
            else chunk_size
        )

        if self.chunk_size <= 0:
            raise ValueError("chunk_size must be greater than zero")

    def chunk(self, document: Document) -> List[Chunk]:
        chunks: List[Chunk] = []

        for page in document.pages:
            text = page.text or ""

            if not text.strip():
                continue

            sections = self._split_into_sections(text)

            for section in sections:
                chunks.extend(
                    self._chunk_section(
                        document=document,
                        page_number=page.number,
                        section=section,
                    )
                )

        return chunks

    def _split_into_sections(self, text: str) -> List[dict]:
        lines = text.splitlines()

        sections: List[dict] = []
        current_lines: List[str] = []
        current_start = 0
        current_label = StructuralLabel.BODY

        offset = 0

        for line in lines:
            stripped = line.strip()

            if self._is_heading(stripped):
                if current_lines:
                    sections.append(
                        {
                            "text": "\n".join(current_lines).strip(),
                            "start_offset": current_start,
                            "label": current_label,
                        }
                    )

                current_lines = [stripped]
                current_start = offset
                current_label = StructuralLabel.HEADING
            else:
                if not current_lines:
                    current_start = offset

                current_lines.append(line)

            offset += len(line) + 1

        if current_lines:
            sections.append(
                {
                    "text": "\n".join(current_lines).strip(),
                    "start_offset": current_start,
                    "label": current_label,
                }
            )

        return [
            section
            for section in sections
            if section["text"]
        ]

    @staticmethod
    def _is_heading(line: str) -> bool:
        if not line:
            return False

        if len(line) > 120:
            return False

        if re.match(r"^(chapter|section)\s+\d+(\.\d+)*\b", line, re.IGNORECASE):
            return True

        if re.match(r"^\d+(\.\d+)*[\.)]?\s+\S+", line):
            return True

        if line.isupper() and len(line.split()) <= 12:
            return True

        return False

    def _chunk_section(
        self,
        document: Document,
        page_number: int,
        section: dict,
    ) -> List[Chunk]:
        text = section["text"]
        start_offset = section["start_offset"]
        structural_label = section["label"]

        if len(text) <= self.chunk_size:
            return [
                self._build_chunk(
                    document=document,
                    page_number=page_number,
                    text=text,
                    start_offset=start_offset,
                    end_offset=start_offset + len(text),
                    structural_label=structural_label,
                )
            ]

        chunks: List[Chunk] = []

        local_start = 0

        while local_start < len(text):
            local_end = min(
                local_start + self.chunk_size,
                len(text),
            )

            if local_end < len(text):
                boundary = self._find_nearest_boundary(
                    text,
                    local_start,
                    local_end,
                )

                if boundary > local_start:
                    local_end = boundary

            chunk_text = text[local_start:local_end].strip()

            if chunk_text:
                absolute_start = start_offset + local_start
                absolute_end = absolute_start + len(chunk_text)

                chunks.append(
                    self._build_chunk(
                        document=document,
                        page_number=page_number,
                        text=chunk_text,
                        start_offset=absolute_start,
                        end_offset=absolute_end,
                        structural_label=structural_label,
                    )
                )

            if local_end >= len(text):
                break

            local_start = local_end

        return chunks

    @staticmethod
    def _find_nearest_boundary(
        text: str,
        start: int,
        end: int,
    ) -> int:
        window = text[start:end]

        paragraph_boundary = window.rfind("\n\n")

        if paragraph_boundary >= 0:
            return start + paragraph_boundary + 2

        sentence_boundary = max(
            window.rfind(". "),
            window.rfind("? "),
            window.rfind("! "),
        )

        if sentence_boundary >= 0:
            return start + sentence_boundary + 2

        word_boundary = window.rfind(" ")

        if word_boundary >= 0:
            return start + word_boundary + 1

        return end

    @staticmethod
    def _build_chunk(
        document: Document,
        page_number: int,
        text: str,
        start_offset: int,
        end_offset: int,
        structural_label: StructuralLabel,
    ) -> Chunk:
        return Chunk(
            id=str(uuid4()),
            document_id=document.id,
            version_id=document.current_version_id,
            page_number=page_number,
            page_start=page_number,
            page_end=page_number,
            text=text,
            start_offset=start_offset,
            end_offset=end_offset,
            tokens=get_token_counter().count(text),
            structural_label=structural_label,
            metadata={
                "chunker": "structure_aware",
            },
        )
