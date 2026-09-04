from typing import Protocol, Sequence, List


class Embedder(Protocol):
    """Protocol for embedding text into vectors.

    Implementations should accept a sequence of texts and return a list of
    vectors (list[float]) in the same order.
    """

    def embed(self, texts: Sequence[str]) -> List[List[float]]:
        ...
