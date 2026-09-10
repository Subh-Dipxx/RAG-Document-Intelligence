from __future__ import annotations

from backend.ingestion.parsers.csv import CsvParser
from backend.ingestion.parsers.docx import DocxParser
from backend.ingestion.parsers.eml import EmlParser
from backend.ingestion.parsers.html import HtmlParser
from backend.ingestion.parsers.pdf import PyMuPDFParser
from backend.ingestion.parsers.pptx import PptxParser
from backend.ingestion.parsers.text import TextDocumentParser
from backend.ingestion.parsers.xlsx import XlsxParser


def get_parser(file_type: str):
    parsers = {
        "pdf": PyMuPDFParser,
        "docx": DocxParser,
        "xlsx": XlsxParser,
        "pptx": PptxParser,
        "csv": CsvParser,
        "html": HtmlParser,
        "text": TextDocumentParser,
        "eml": EmlParser,
    }

    parser_class = parsers.get(file_type)

    if parser_class is None:
        raise ValueError(
            f"Unsupported document type: {file_type}"
        )

    return parser_class()
