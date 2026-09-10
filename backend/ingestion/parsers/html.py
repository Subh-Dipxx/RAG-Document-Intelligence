from __future__ import annotations

from pathlib import Path

from lxml import html as lxml_html

from backend.domain.models import Document, Page, ParsedDocument


class HtmlParser:
    def parse(self, file_path: str) -> ParsedDocument:
        path = Path(file_path)

        if not path.is_file():
            raise FileNotFoundError(file_path)

        raw = path.read_bytes()

        tree = lxml_html.fromstring(raw)

        for element in tree.xpath(
            "//script|//style|//noscript"
        ):
            element.getparent().remove(element)

        lines: list[str] = []

        for element in tree.xpath(
            "//h1|//h2|//h3|//h4|//h5|//h6|"
            "//p|//li|//th|//td|//caption"
        ):
            text = " ".join(
                element.text_content().split()
            )

            if text:
                lines.append(text)

        # Fallback if the document has no recognizable block elements.
        if not lines:
            text = " ".join(tree.text_content().split())
            if text:
                lines.append(text)

        page = Page(
            number=1,
            text="\n".join(lines),
            metadata={
                "parser": "html",
                "page_count": 1,
            },
        )

        document = Document(
            id=path.stem,
            file_name=path.name,
            mime_type="text/html",
            pages=[page],
            metadata={
                "parser": "html",
                "page_count": 1,
            },
        )

        return ParsedDocument(
            document=document,
            pages=[page],
            metadata={
                "parser": "html",
                "page_count": 1,
            },
        )
