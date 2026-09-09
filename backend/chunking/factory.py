from __future__ import annotations

from backend.chunking.base import Chunker
from backend.chunking.naive import NaiveCharacterChunker
from backend.chunking.structure import StructureAwareChunker
from backend.chunking.semantic import SemanticChunker
from backend.config import get_settings


class ChunkerFactory:
    """Create the configured chunker implementation."""

    @staticmethod
    def create(chunker_type: str | None = None) -> Chunker:
        settings = get_settings()

        selected_type = (
            settings.chunker_type
            if chunker_type is None
            else chunker_type
        ).strip().lower()

        if selected_type == "naive":
            return NaiveCharacterChunker()

        if selected_type == "structure_aware":
            return StructureAwareChunker()

        if selected_type == "semantic":
            return SemanticChunker()

        raise ValueError(
            f"Unsupported chunker type: {selected_type}. "
            "Supported values: naive, structure_aware, semantic."
        )
