from typing import Protocol
from domain.models import ParsedDocument


class DocumentParser(Protocol):
    """Protocol for document parsers that convert files into ParsedDocument."""

    def parse(self, file_path: str) -> ParsedDocument:
        """Parse a file at file_path and return a ParsedDocument.

        Implementations should not perform heavy side effects beyond reading the
        supplied file.
        """
        ...
