from __future__ import annotations

import csv
import io
import zipfile
from pathlib import Path


def _looks_like_text(data: bytes) -> bool:
    if not data:
        return False

    if data.startswith((b"\xef\xbb\xbf", b"\xff\xfe", b"\xfe\xff")):
        return True

    sample = data[:8192]

    if b"\x00" in sample:
        return False

    try:
        sample.decode("utf-8")
        return True
    except UnicodeDecodeError:
        try:
            sample.decode("utf-16")
            return True
        except UnicodeDecodeError:
            return False


def _looks_like_csv(data: bytes) -> bool:
    try:
        text = data.decode("utf-8-sig")
    except UnicodeDecodeError:
        return False

    sample = text[:8192]

    try:
        dialect = csv.Sniffer().sniff(sample)
        return dialect.delimiter in {",", ";", "\t", "|"}
    except csv.Error:
        return False


def detect_file_type(file_path: str, data: bytes) -> str:
    """
    Detect document type primarily from file contents.

    Returns one of:
        pdf, docx, xlsx, pptx, csv, html, text, eml, image, unknown
    """

    path = Path(file_path)
    extension = path.suffix.lower()

    # PDF magic bytes
    if data.startswith(b"%PDF-"):
        return "pdf"

    # Common image signatures
    if data.startswith(b"\xff\xd8\xff"):
        return "image"

    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image"

    if data.startswith(b"GIF87a") or data.startswith(b"GIF89a"):
        return "image"

    if data.startswith(b"BM"):
        return "image"

    if data.startswith(b"RIFF") and len(data) >= 12 and data[8:12] == b"WEBP":
        return "image"

    # Office Open XML files are ZIP containers.
    if data.startswith(b"PK"):
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                names = set(archive.namelist())

                if "word/document.xml" in names:
                    return "docx"

                if "xl/workbook.xml" in names:
                    return "xlsx"

                if "ppt/presentation.xml" in names:
                    return "pptx"
        except zipfile.BadZipFile:
            pass

    # Email
    if b"\nFrom:" in data[:10000] or data.startswith(b"From:"):
        return "eml"

    # HTML
    if _looks_like_text(data):
        try:
            text = data.decode("utf-8-sig", errors="ignore").lstrip().lower()

            html_markers = (
                "<!doctype html",
                "<html",
                "<head",
                "<body",
                "<table",
            )

            if any(marker in text[:4096] for marker in html_markers):
                return "html"
        except Exception:
            pass

    # CSV
    if _looks_like_csv(data):
        return "csv"

    # Plain text / Markdown
    if _looks_like_text(data):
        return "text"

    # Extension fallback only when content is otherwise ambiguous.
    extension_map = {
        ".pdf": "pdf",
        ".docx": "docx",
        ".xlsx": "xlsx",
        ".xls": "xlsx",
        ".pptx": "pptx",
        ".csv": "csv",
        ".html": "html",
        ".htm": "html",
        ".txt": "text",
        ".md": "text",
        ".markdown": "text",
        ".eml": "eml",
        ".jpg": "image",
        ".jpeg": "image",
        ".png": "image",
        ".gif": "image",
        ".bmp": "image",
        ".webp": "image",
    }

    return extension_map.get(extension, "unknown")
