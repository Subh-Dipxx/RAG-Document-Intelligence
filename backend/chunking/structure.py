from __future__ import annotations

import re
from typing import List
from uuid import uuid4

from backend.chunking.token_counter import get_token_counter
from backend.config import get_settings
from backend.domain.models import Chunk, Document, StructuralLabel


class StructureAwareChunker:
    """
    Structure-aware chunker that preserves logical question blocks.

    Special handling:
    - Question N blocks remain together with their answer choices.
    - Practice Example N blocks remain together with their answer choices.
    - Normal headings/paragraphs are still handled structurally.
    - Oversized logical units are split by paragraph/sentence/word boundaries.
    """

    QUESTION_RE = re.compile(
        r"^(?:question|practice\s+example)\s+\d+\b",
        re.IGNORECASE,
    )

    ANSWER_RE = re.compile(
        r"^[A-Za-z]\s*:\s*",
        re.IGNORECASE,
    )

    def __init__(self, chunk_size: int | None = None) -> None:
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

            units = self._split_into_logical_units(text)

            for unit in units:
                unit_text = unit["text"].strip()

                if not unit_text:
                    continue

                if self._token_count(unit_text) <= self.chunk_size:
                    chunks.append(
                        self._build_chunk(
                            document=document,
                            page_number=page.number,
                            text=unit_text,
                            start_offset=unit["start_offset"],
                            end_offset=unit["end_offset"],
                            structural_label=unit["label"],
                        )
                    )
                else:
                    chunks.extend(
                        self._split_oversized_unit(
                            document=document,
                            page_number=page.number,
                            text=unit_text,
                            start_offset=unit["start_offset"],
                            structural_label=unit["label"],
                        )
                    )

        return chunks

    def _split_into_logical_units(self, text: str) -> List[dict]:
        """
        Split page text into logical units while keeping question blocks intact.

        A question starts at:
            Question 1
            Practice Example 1

        and continues until the next question/example or a genuine document
        heading. Answer choices never start a new unit.
        """
        lines = text.splitlines()

        units: List[dict] = []
        current_lines: List[str] = []
        current_start = 0
        current_label = StructuralLabel.BODY
        offset = 0

        in_question = False

        for line in lines:
            stripped = line.strip()

            is_question = self._is_question_start(stripped)
            is_heading = self._is_heading(stripped)

            if is_question:
                if current_lines:
                    units.append(
                        {
                            "text": "\n".join(current_lines).strip(),
                            "start_offset": current_start,
                            "end_offset": offset,
                            "label": current_label,
                        }
                    )

                current_lines = [line]
                current_start = offset
                current_label = StructuralLabel.BODY
                in_question = True

            elif is_heading and not in_question:
                if current_lines:
                    units.append(
                        {
                            "text": "\n".join(current_lines).strip(),
                            "start_offset": current_start,
                            "end_offset": offset,
                            "label": current_label,
                        }
                    )

                current_lines = [stripped]
                current_start = offset
                current_label = StructuralLabel.HEADING

            else:
                current_lines.append(line)

                # A genuine heading after a question starts a new unit.
                # Answer choices do not, so they remain inside the question.
                if in_question and is_heading:
                    in_question = False

            offset += len(line) + 1

        if current_lines:
            units.append(
                {
                    "text": "\n".join(current_lines).strip(),
                    "start_offset": current_start,
                    "end_offset": offset,
                    "label": current_label,
                }
            )

        return [unit for unit in units if unit["text"]]

    def _split_oversized_unit(
        self,
        document: Document,
        page_number: int,
        text: str,
        start_offset: int,
        structural_label: StructuralLabel,
    ) -> List[Chunk]:
        """
        Split an oversized logical unit without destroying answer blocks.
        """
        chunks: List[Chunk] = []

        local_start = 0

        while local_start < len(text):
            local_end = min(
                local_start + self.chunk_size,
                len(text),
            )

            if local_end < len(text):
                boundary = self._find_safe_boundary(
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
    def _is_question_start(line: str) -> bool:
        return bool(StructureAwareChunker.QUESTION_RE.match(line))

    @staticmethod
    def _is_heading(line: str) -> bool:
        stripped = line.strip()

        if not stripped:
            return False

        # Question/example labels are handled separately.
        if StructureAwareChunker._is_question_start(stripped):
            return False

        # Answer choices are never headings.
        if StructureAwareChunker.ANSWER_RE.match(stripped):
            return False

        # Chapter / section headings.
        if re.match(
            r"^(chapter|section)\s+\d+[\s:.\-]",
            stripped,
            re.IGNORECASE,
        ):
            return True

        # Numbered headings such as:
        # 1 Introduction
        # 2.1 Background
        if re.match(
            r"^\d+(?:\.\d+)*[\s.)\-]+[A-Za-z]",
            stripped,
        ):
            return True

        # Uppercase headings containing actual words.
        words = re.findall(r"[A-Za-z]{2,}", stripped)

        if stripped.isupper() and len(words) >= 1:
            return True

        return False

    @staticmethod
    def _find_safe_boundary(text: str, start: int, end: int) -> int:
        window = text[start:end]

        # Prefer blank-line boundaries.
        paragraph_boundary = window.rfind("\n\n")
        if paragraph_boundary >= 0:
            return start + paragraph_boundary + 2

        # Then sentence boundaries.
        sentence_boundary = max(
            window.rfind(". "),
            window.rfind("? "),
            window.rfind("! "),
        )

        if sentence_boundary >= 0:
            return start + sentence_boundary + 2

        # Finally word boundary.
        word_boundary = window.rfind(" ")
        if word_boundary >= 0:
            return start + word_boundary + 1

        return end

    @staticmethod
    def _token_count(text: str) -> int:
        return get_token_counter().count(text)

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
