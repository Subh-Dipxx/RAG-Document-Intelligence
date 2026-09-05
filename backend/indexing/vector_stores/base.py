from typing import Protocol, List, Optional, Dict, Any
from domain.models import Chunk


class VectorStore(Protocol):
    """Protocol for a vector store backend.

    Basic operations: upsert vectors, search by vector/query, and delete by id or filter.
    """

    def upsert(self, items: List[Dict[str, Any]]) -> None:
        """Upsert a batch of items. Each item is expected to include an 'id' and 'vector' key plus optional metadata."""
        ...

    def search(self, vector: List[float], top_k: int = 10, filter: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Search the store for nearest neighbors to the provided vector."""
        ...

    def delete(self, ids: Optional[List[str]] = None, filter: Optional[Dict[str, Any]] = None) -> None:
        """Delete vectors by a list of ids or by a metadata filter."""
        ...
