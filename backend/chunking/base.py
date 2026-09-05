from typing import Protocol, List
from domain.models import Document, Chunk


class Chunker(Protocol):
    """Protocol for chunking documents into smaller chunks for indexing/retrieval."""

    def chunk(self, document: Document) -> List[Chunk]:
        """Split a Document into a list of Chunk objects."""
        ...
