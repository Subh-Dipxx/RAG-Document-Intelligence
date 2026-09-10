from __future__ import annotations

import csv
from pathlib import Path

from backend.domain.models import Document, Page, ParsedDocument


class CsvParser:
    def parse(self, file_path: str) -> ParsedDocument:
        path = Path(file_path)

        if not path.is_file():
            raise FileNotFoundError(file_path)

        raw = path.read_bytes()

        try:
            text = raw.decode("utf-8-sig")
        except UnicodeDecodeError:
            text = raw.decode("utf-16", errors="replace")

        sample = text[:8192]

        try:
            dialect = csv.Sniffer().sniff(
                sample,
                delimiters=",;\t|",
            )
        except csv.Error:
            dialect = csv.excel

        reader = csv.reader(text.splitlines(), dialect)

        lines = [
            " | ".join(row)
            for row in reader
            if any(cell.strip() for cell in row)
        ]

        page = Page(
            number=1,
            text="\n".join(lines),
            metadata={
                "parser": "csv",
                "page_count": 1,
            },
        )

        document = Document(
            id=path.stem,
            file_name=path.name,
            mime_type="text/csv",
            pages=[page],
            metadata={
                "parser": "csv",
                "page_count": 1,
            },
        )

        return ParsedDocument(
            document=document,
            pages=[page],
            metadata={
                "parser": "csv",
                "page_count": 1,
            },
        )
