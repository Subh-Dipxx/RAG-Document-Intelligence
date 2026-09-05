"""Safe object-key helpers. Document filenames are untrusted data and must
never be interpolated into storage paths as-is (path traversal / injection).
"""
from __future__ import annotations

import re

_SAFE = re.compile(r"[^A-Za-z0-9._-]+")


def sanitize_filename(name: str | None, fallback: str = "unnamed") -> str:
    raw = (name or "").replace("\\", "/")
    base = raw.split("/")[-1].strip()
    base = base.lstrip(".")
    if not base or base in {".", ".."}:
        return fallback
    cleaned = _SAFE.sub("_", base).strip("._")
    if not cleaned:
        return fallback
    return cleaned[:200]


def object_key(*parts: str) -> str:
    safe = [sanitize_filename(part) for part in parts if part is not None and str(part) != ""]
    if not safe:
        raise ValueError("object_key requires at least one path component")
    return "/".join(safe)