from __future__ import annotations

from email import policy
from email.parser import BytesParser
from pathlib import Path

from backend.domain.models import Document, Page, ParsedDocument


class EmlParser:
    def parse(self, file_path: str) -> ParsedDocument:
        path = Path(file_path)

        if not path.is_file():
            raise FileNotFoundError(file_path)

        with path.open("rb") as file:
            message = BytesParser(policy=policy.default).parse(file)

        lines: list[str] = []

        if message["subject"]:
            lines.append(f"Subject: {message['subject']}")

        if message["from"]:
            lines.append(f"From: {message['from']}")

        if message["to"]:
            lines.append(f"To: {message['to']}")

        if message["date"]:
            lines.append(f"Date: {message['date']}")

        lines.append("")

        if message.is_multipart():
            for part in message.walk():
                content_type = part.get_content_type()

                if content_type == "text/plain":
                    try:
                        content = part.get_content()
                    except Exception:
                        payload = part.get_payload(decode=True) or b""
                        content = payload.decode(
                            "utf-8",
                            errors="replace",
                        )

                    if content.strip():
                        lines.append(content.strip())

        else:
            try:
                content = message.get_content()
            except Exception:
                payload = message.get_payload(decode=True) or b""
                content = payload.decode(
                    "utf-8",
                    errors="replace",
                )

            if content.strip():
                lines.append(content.strip())

        page = Page(
            number=1,
            text="\n".join(lines),
            metadata={
                "parser": "eml",
                "page_count": 1,
            },
        )

        document = Document(
            id=path.stem,
            file_name=path.name,
            mime_type="message/rfc822",
            pages=[page],
            metadata={
                "parser": "eml",
                "page_count": 1,
                "has_attachments": bool(message.iter_attachments()),
            },
        )

        return ParsedDocument(
            document=document,
            pages=[page],
            metadata={
                "parser": "eml",
                "page_count": 1,
            },
        )
