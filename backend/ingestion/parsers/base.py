from __future__ import annotations

from typing import Protocol

from backend.domain.models import ParsedDocument


class DocumentParser(Protocol):
    def parse(self, file_path: str) -> ParsedDocument:
        ...
