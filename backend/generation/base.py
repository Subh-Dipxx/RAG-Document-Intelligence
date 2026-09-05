from typing import Protocol, List, Optional, Dict, Any
from domain.models import Query, Chunk, Answer


class Generator(Protocol):
    """Protocol for generation components (LLM wrappers) that produce answers from queries and context."""

    def generate(self, query: Query, context: List[Chunk], **kwargs: Any) -> Answer:
        """Generate an Answer for the given Query using the provided contextual Chunks."""
        ...
