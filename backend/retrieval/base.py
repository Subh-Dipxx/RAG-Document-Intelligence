from typing import Protocol, List, Optional, Dict, Any
from domain.models import Query, Chunk


class Retriever(Protocol):
    """Protocol for retrieval components that return relevant chunks for a query."""

    def retrieve(self, query: Query, filters: Optional[Dict[str, Any]] = None) -> List[Chunk]:
        """Retrieve a list of Chunks relevant to the provided Query."""
        ...
