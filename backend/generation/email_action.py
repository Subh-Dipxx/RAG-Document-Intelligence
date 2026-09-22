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
    ) -> dict[str, Any]:
        history = history or []

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

If information is missing, return null.

Conversation:
{history_text}

Latest user message:
{message}

Return JSON only:

{{
  "to": "recipient email or null",
  "subject": "subject or null",
  "body": "email body or null"
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

            return {
                "to": result.get("to"),
                "subject": result.get("subject"),
                "body": result.get("body"),
            }

        except Exception:
            return {
                "to": None,
                "subject": None,
                "body": None,
            }
