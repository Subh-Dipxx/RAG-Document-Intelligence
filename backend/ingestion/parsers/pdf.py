from pathlib import Path

import fitz

from backend.domain.models import Document, Page, ParsedDocument

from typing import Protocol



class DocumentParser(Protocol):
    """Protocol for document parsers that convert files into ParsedDocument."""

    def parse(self, file_path: str) -> ParsedDocument:
        """Parse a file at file_path and return a ParsedDocument.

        Implementations should not perform heavy side effects beyond reading the
        supplied file.
        """
        ...

class PyMuPDFParser:
    """PDF parser using PyMuPDF for text-layer extraction."""

    def parse(self, file_path: str) -> ParsedDocument:
        path = Path(file_path)

        if not path.is_file():
            raise FileNotFoundError(f"Document not found: {file_path}")

        if path.suffix.lower() != ".pdf":
            raise ValueError(f"Unsupported file type: {path.suffix}")

        document_id = path.stem

        pages = []

        with fitz.open(path) as pdf:
            for page_number, pdf_page in enumerate(pdf, start=1):
                text = pdf_page.get_text("text")

                pages.append(
                    Page(
                        number=page_number,
                        text=text,
                        metadata={
                            "parser": "pymupdf",
                        },
                    )
                )

        document = Document(
            id=document_id,
            file_name=path.name,
            mime_type="application/pdf",
            pages=pages,
            metadata={
                "parser": "pymupdf",
                "source_path": str(path),
                "page_count": len(pages),
            },
        )

        return ParsedDocument(
            document=document,
            pages=pages,
            metadata={
                "parser": "pymupdf",
                "page_count": len(pages),
            },
        )
