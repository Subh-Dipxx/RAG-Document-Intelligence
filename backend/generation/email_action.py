from __future__ import annotations

import json
from typing import Any

from google import genai
from google.genai import types

from backend.config import get_settings


class EmailActionExtractor:
    """Extract email details already established in conversation."""

    def __init__(self) -> None:
        settings = get_settings()
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model_name = settings.gemini_model

    def extract(
        self,
        message: str,
        history: list[dict[str, str]] | None = None,
        document_context: str | None = None,
    ) -> dict[str, Any]:
        history = history or []
        document_context = document_context or ""

        history_text = "\n".join(
            f"{item.get('role', 'user')}: {item.get('content', '')}"
            for item in history[-12:]
            if item.get("content")
        )

        prompt = f"""
You are the email action extractor for DocGPT.

The user has requested that an email be sent.

Extract ONLY information already established in the conversation.

Never invent an email address, recipient, subject, or email body.

The email may have multiple recipients.

Return every recipient email address that is clearly established
for this email. Preserve all intended recipients and do not add
unrelated email addresses from the conversation.

If the recipient information is missing, return an empty list.

If the subject or body is missing, return null for that field.

Conversation:
{history_text}

Latest user message:
{message}

Active document context:
{document_context}

Use the active document context when it contains recipient names
and their corresponding email addresses. Resolve the requested
recipients from that document context.

Do not invent email addresses.
Do not select unrelated contacts from the document.
Only return recipients that match the user's intended recipients.

Determine whether the user is requesting that the currently selected
document/file be attached to the email.

Set "attach_current_document" to true only when the user's intended
email action includes attaching the currently selected document/file.
Otherwise set it to false.

Do not infer an attachment request merely because a document exists.

Return JSON only:

{{
  "to": ["recipient1@example.com", "recipient2@example.com"],
  "subject": "subject or null",
  "body": "email body or null",
  "attach_current_document": true
}}
"""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0,
                    response_mime_type="application/json",
                ),
            )

            result = json.loads((response.text or "").strip())

            recipients = result.get("to")

            if isinstance(recipients, str):
                recipients = [recipients]

            if not isinstance(recipients, list):
                recipients = []

            recipients = [
                str(email).strip()
                for email in recipients
                if isinstance(email, str) and email.strip()
            ]

            # Preserve order while removing duplicates.
            recipients = list(dict.fromkeys(recipients))

            attach_current_document = result.get("attach_current_document")

            if not isinstance(attach_current_document, bool):
                attach_current_document = False

            return {
                "to": recipients,
                "subject": result.get("subject"),
                "body": result.get("body"),
                "attach_current_document": attach_current_document,
            }

        except Exception:
            return {
                "to": [],
                "subject": None,
                "body": None,
                "attach_current_document": False,
            }
