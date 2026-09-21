from __future__ import annotations

import json
from typing import Any

from google import genai
from google.genai import types

from backend.config import get_settings


class IntentRouter:
    """LLM-based semantic router for normal chat vs grounded RAG."""

    VALID_INTENTS = {
        "CONVERSATIONAL",
        "DOCUMENT_QUERY",
        "OUTSIDE_SCOPE",
    }

    def __init__(self) -> None:
        settings = get_settings()
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model_name = settings.gemini_model

    def classify(
        self,
        message: str,
        history: list[dict[str, str]] | None = None,
        has_document: bool = False,
    ) -> dict[str, Any]:
        history = history or []

        history_text = "\n".join(
            f"{item.get('role', 'user')}: {item.get('content', '')}"
            for item in history[-8:]
            if item.get("content")
        )

        prompt = f"""
You are the semantic intent router for DocGPT.

Document availability:
{has_document}

A document-related request is DOCUMENT_QUERY even when no document is
currently available. The backend will handle the missing-document case
without allowing an answer to be generated.

Determine the intent of the user's latest message using the conversation
context. Do not answer the user.

The assistant has three modes:

CONVERSATIONAL
The user is simply interacting with the assistant naturally.
This includes greetings, thanks, acknowledgements, casual conversation,
follow-ups about the conversation, and questions about the assistant.

DOCUMENT_QUERY
The user is asking for information that should be answered from the
available uploaded-document knowledge.

OUTSIDE_SCOPE
The user is asking for factual information that is not supposed to be
answered from the available workspace knowledge, such as unrelated
outside-world information.

Important:
- Do not classify based on specific keywords alone.
- Use semantic meaning and conversation context.
- A greeting remains CONVERSATIONAL even when a document is uploaded.
- A casual message must never become DOCUMENT_QUERY merely because a
  document exists.
- A DOCUMENT_QUERY requires an actual request for document/workspace
  information.
- Do not answer the user.
- Return JSON only.

Conversation context:
{history_text}

Latest user message:
{message}

Return exactly:
{{
  "intent": "CONVERSATIONAL" | "DOCUMENT_QUERY" | "OUTSIDE_SCOPE",
  "reason": "brief explanation"
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

            raw = (response.text or "").strip()
            result = json.loads(raw)

            intent = result.get("intent")

            if intent not in self.VALID_INTENTS:
                raise ValueError("Invalid intent returned by model")

            return {
                "intent": intent,
                "reason": result.get("reason", ""),
            }

        except Exception:
            # Safe fallback: do not send uncertain messages into RAG.
            return {
                "intent": "OUTSIDE_SCOPE",
                "reason": "Intent classification failed safely.",
            }
