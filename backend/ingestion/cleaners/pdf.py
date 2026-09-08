import re
import unicodedata

from backend.domain.models import Page
from typing import Protocol



class PageCleaner(Protocol):
    def clean_page(self, page: Page) -> Page:
        ...

class PyMuPDFTextCleaner:
    """
    Deterministic text cleaner for text extracted from PDFs.

    The cleaner operates page-by-page so that cleaning does not require
    loading another copy of the document into memory.
    """

    def clean_page(self, page: Page) -> Page:
        cleaned_text = self._normalize_unicode(page.text)
        cleaned_text = self._remove_control_characters(cleaned_text)
        cleaned_text = self._repair_hyphenated_line_breaks(cleaned_text)
        cleaned_text = self._normalize_line_breaks(cleaned_text)
        cleaned_text = self._normalize_whitespace(cleaned_text)
        cleaned_text = cleaned_text.strip()

        metadata = dict(page.metadata)
        metadata["cleaner"] = "pymupdf_text_cleaner"

        return page.model_copy(
            update={
                "text": cleaned_text,
                "metadata": metadata,
            }
        )

    @staticmethod
    def _normalize_unicode(text: str) -> str:
        return unicodedata.normalize("NFKC", text)

    @staticmethod
    def _remove_control_characters(text: str) -> str:
        return "".join(
            char
            for char in text
            if char in "\n\r\t" or not unicodedata.category(char).startswith("C")
        )

    @staticmethod
    def _repair_hyphenated_line_breaks(text: str) -> str:
        # Example:
        #   docu-
        #   ment
        #
        # becomes:
        #   document
        return re.sub(r"(?<=\w)-[ \t]*\n[ \t]*(?=\w)", "", text)

    @staticmethod
    def _normalize_line_breaks(text: str) -> str:
        text = text.replace("\r\n", "\n")
        text = text.replace("\r", "\n")

        # Prevent excessive empty lines while preserving paragraph structure.
        return re.sub(r"\n[ \t]*\n[ \t]*\n+", "\n\n", text)

    @staticmethod
    def _normalize_whitespace(text: str) -> str:
        # Normalize spaces/tabs inside each line without destroying
        # meaningful line boundaries.
        lines = []

        for line in text.split("\n"):
            line = re.sub(r"[ \t]+", " ", line).strip()
            lines.append(line)

        return "\n".join(lines)