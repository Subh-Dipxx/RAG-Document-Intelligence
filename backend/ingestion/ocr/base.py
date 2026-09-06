from typing import Protocol, Any
from backend.domain.models import OCRResult


class OCREngine(Protocol):
    """Protocol for OCR engines that extract text and per-word confidence."""

    def extract(self, image: Any) -> OCRResult:
        """Extract text and per-word confidence information from an image."""
        ...
