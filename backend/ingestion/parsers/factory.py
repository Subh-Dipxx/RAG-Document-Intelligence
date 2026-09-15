from __future__ import annotations

import mimetypes
from pathlib import Path

from backend.ingestion.parsers.csv import CsvParser
from backend.ingestion.parsers.docx import DocxParser
from backend.ingestion.parsers.eml import EmlParser
from backend.ingestion.parsers.html import HtmlParser
from backend.ingestion.parsers.pdf import PyMuPDFParser
from backend.ingestion.parsers.pptx import PptxParser
from backend.ingestion.parsers.text import TextDocumentParser
from backend.ingestion.parsers.xlsx import XlsxParser

# Standard MIME type mappings
MIME_MAP = {
    "application/pdf": PyMuPDFParser,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": DocxParser,
    "application/msword": DocxParser,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": XlsxParser,
    "application/vnd.ms-excel": XlsxParser,
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": PptxParser,
    "application/vnd.ms-powerpoint": PptxParser,
    "text/csv": CsvParser,
    "text/html": HtmlParser,
    "application/xhtml+xml": HtmlParser,
    "message/rfc822": EmlParser,
    "text/plain": TextDocumentParser,
    "text/markdown": TextDocumentParser,
    "application/json": TextDocumentParser,
}

# Extension mappings (without dot)
EXTENSION_MAP = {
    "pdf": PyMuPDFParser,
    "docx": DocxParser,
    "doc": DocxParser,
    "xlsx": XlsxParser,
    "xls": XlsxParser,
    "pptx": PptxParser,
    "ppt": PptxParser,
    "csv": CsvParser,
    "html": HtmlParser,
    "htm": HtmlParser,
    "eml": EmlParser,
    "txt": TextDocumentParser,
    "text": TextDocumentParser,
    "md": TextDocumentParser,
    "markdown": TextDocumentParser,
    "json": TextDocumentParser,
    "log": TextDocumentParser,
}


def get_parser(filename_or_type: str, data: bytes | None = None):
    """
    Dynamically select parser class by file name, extension, MIME type, or content fallback.
    """
    key = filename_or_type.strip().lower()

    # 1. Direct type key (e.g., "pdf", "docx")
    if key in EXTENSION_MAP:
        return EXTENSION_MAP[key]()

    # 2. Standard library MIME lookup
    mime_type, _ = mimetypes.guess_type(filename_or_type)
    if mime_type and mime_type in MIME_MAP:
        return MIME_MAP[mime_type]()

    # 3. Path extension check
    ext = Path(filename_or_type).suffix.lstrip(".").lower()
    if ext in EXTENSION_MAP:
        return EXTENSION_MAP[ext]()

    # 4. Content headers fallback if bytes provided
    if data:
        if data.startswith(b"%PDF-"):
            return PyMuPDFParser()
        if data.startswith(b"PK"):
            if b"word/" in data[:4096]:
                return DocxParser()
            if b"xl/" in data[:4096]:
                return XlsxParser()
            if b"ppt/" in data[:4096]:
                return PptxParser()
        try:
            data[:1024].decode("utf-8")
            return TextDocumentParser()
        except UnicodeDecodeError:
            pass

    raise ValueError(f"Unsupported document format or unrecognized file type: '{filename_or_type}'")

