from __future__ import annotations

from pathlib import Path

from backend.domain.models import Document, Page, ParsedDocument


class TextDocumentParser:
    def parse(self, file_path: str) -> ParsedDocument:
        path = Path(file_path)

        if not path.is_file():
            raise FileNotFoundError(file_path)

        raw = path.read_bytes()

        if raw.startswith(b"\xff\xfe") or raw.startswith(b"\xfe\xff"):
            text = raw.decode("utf-16")
        else:
            text = raw.decode("utf-8-sig", errors="replace")

        page = Page(
            number=1,
            text=text,
            metadata={
                "parser": "text",
                "format": path.suffix.lower().lstrip(".") or "text",
            },
        )

        document = Document(
            id=path.stem,
            file_name=path.name,
            mime_type="text/plain",
            pages=[page],
            metadata={
                "parser": "text",
                "page_count": 1,
            },
        )

        return ParsedDocument(
            document=document,
            pages=[page],
            metadata={
                "parser": "text",
                "page_count": 1,
            },
        )
