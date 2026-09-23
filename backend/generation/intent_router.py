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
        "EMAIL_SEND",
        "CHART_REQUEST",
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

EMAIL_SEND
The user is asking the assistant to send an email that has been
drafted, discussed, or otherwise established in the conversation.
This includes natural confirmations or follow-up instructions such as
asking to send, submit, deliver, or proceed with an email.
Determine this from the semantic meaning and conversation context,
not from specific keywords.

CHART_REQUEST
The user is asking the assistant to create, show, visualize, plot,
graph, or otherwise represent information from the available document
as a chart or data visualization.
Determine this from the semantic meaning and conversation context,
not from specific keywords. The request should be treated as a chart
request when the intended output is a visual representation of data
from the document.

DOCUMENT_QUERY
The user is asking for information that should be answered from the
available uploaded-document knowledge.

OUTSIDE_SCOPE
The user is asking for factual information that is not supposed to be
answered from the available workspace knowledge, such as unrelated
outside-world information.

Important:
- Do not classify based on specific keywords or exact phrases alone.
- Determine the semantic intent from the complete conversational context.
- Use the recent conversation history to resolve incomplete, elliptical,
  abbreviated, or follow-up user messages.
- The latest user message does not need to explicitly mention a document.
- If the latest message is a follow-up to a previous document-related
  request, interpret it in the context of that previous request.
- If the latest message asks for additional information, explanation,
  elaboration, clarification, or details about something previously
  established as document-related, classify it as DOCUMENT_QUERY.
- If the latest message is ambiguous in isolation, use the preceding
  user and assistant messages and the current document availability to
  determine its intended meaning.
- Do not classify a message as DOCUMENT_QUERY merely because a document
  exists.
- A greeting, acknowledgement, thanks, or ordinary social conversation
  remains CONVERSATIONAL unless the surrounding context clearly makes it
  a document-related request.
- A request about the assistant itself remains CONVERSATIONAL.
- If the user is asking to actually send an email that has been
  drafted or established in the conversation, classify it as
  EMAIL_SEND.
- A request to draft or compose an email without asking to send it
  remains CONVERSATIONAL.
- A request for unrelated outside-world factual information is
  OUTSIDE_SCOPE.
- When a document is active, an ambiguous information-seeking request such as asking for details, explanation, elaboration, clarification, summary, or more information should be interpreted as referring to the active document and classified as DOCUMENT_QUERY.
- Do not classify an ambiguous information-seeking request as CONVERSATIONAL merely because there is no previous conversation history.
- Keep clearly social messages, greetings, acknowledgements, thanks, and questions about the assistant as CONVERSATIONAL even when a document is active.
- Do not answer the user.
- Return JSON only.

Conversation context:
{history_text}

Latest user message:
{message}

Return exactly:
{{
  "intent": "CONVERSATIONAL" | "DOCUMENT_QUERY" | "EMAIL_SEND" | "CHART_REQUEST" | "OUTSIDE_SCOPE",
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

