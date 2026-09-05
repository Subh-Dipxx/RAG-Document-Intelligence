from typing import Protocol, List, Optional, Dict, Any


class LexicalIndex(Protocol):
    """Protocol for a lexical search/index backend (e.g., OpenSearch)."""

    def upsert(self, docs: List[Dict[str, Any]]) -> None:
        """Index or update a list of document-like dicts. Each dict should contain at least an 'id' and 'text' key."""
        ...

    def search(self, query: str, top_k: int = 10, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Perform a lexical search and return a list of matches with scores and metadata."""
        ...

    def delete(self, ids: Optional[List[str]] = None, filters: Optional[Dict[str, Any]] = None) -> None:
        """Delete documents from the lexical index by ids or filters."""
        ...
