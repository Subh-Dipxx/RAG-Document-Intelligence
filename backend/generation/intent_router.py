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

    def rewrite_query(
        self,
        message: str,
        history: list[dict[str, str]] | None = None,
    ) -> str:
        """
        Rewrite a follow-up user message into a standalone document query.

        The rewrite preserves the active conversational subject and explicit
        constraints while avoiding unrelated context from older turns.
        """
        history = history or []

        recent_history = history[-6:]

        history_text = "\n".join(
            f"{item.get('role', 'user')}: {item.get('content', '')}"
            for item in recent_history
            if item.get("content")
        )

        if not history_text:
            return message.strip()

        prompt = f"""
You are the contextual query-rewriting component of DocGPT.

Rewrite the user's latest message into ONE standalone query that can be
sent to a document retriever.

Your job is NOT to answer the question.

Rules:
- Use the previous conversation only to resolve references, omissions,
  abbreviations, pronouns, or follow-up instructions.
- Preserve the exact subject established by the conversation.
- Preserve named entities, dates, months, metrics, categories, comparisons,
  filters, and output constraints that are still relevant.
- If the latest message is a refinement of the previous request, combine
  the refinement with the established subject.
- Do NOT introduce a new topic, entity, date, metric, or assumption.
- Do NOT broaden a focused request into a request about the whole document.
- If the latest message is already self-contained, return it essentially
  unchanged.
- For chart follow-ups, preserve the requested chart scope and data
  dimensions.
- Preserve any explicit chart type or output format requested in the
  latest user message, such as bar chart, line chart, pie chart, or
  another supported visualization type.
- The latest user instruction takes precedence over the previous
  chart context.
- If the previous chart was a bar chart and the user says "convert it
  to a line chart" or "change it to a line chart", the rewritten query
  MUST explicitly retain "line chart".
- Never silently preserve the previous chart type when the latest user
  message explicitly requests a different chart type.
- When the latest message changes only the chart type, preserve the
  existing comparison entities, dates, metrics, filters, and data scope.
- If [CHART_CONTEXT] is present, use it to preserve the previous chart
  subject and data scope, but do not let it override an explicit
  instruction in the latest user message.
- Return only the rewritten retrieval query, with no explanation,
  quotation marks, or labels.

Conversation:
{history_text}

Latest user message:
{message}
""".strip()

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0,
                ),
            )

            rewritten = (response.text or "").strip()

            if rewritten:
                return rewritten

        except Exception as err:
            print(
                f"Contextual query rewrite failed: {err}",
                flush=True,
            )

        return message.strip()

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
as a chart or data visualization, or to modify/regenerate an existing
chart.

The intended OUTPUT TYPE is critical:
- If the user wants a visual chart, graph, plot, or visualization,
  classify as CHART_REQUEST.
- A request for a table, tabular format, rows and columns, a data table,
  or structured tabular information is NOT CHART_REQUEST. Classify it
  as DOCUMENT_QUERY.
- A request to explain, clarify, interpret, define, summarize, or
  elaborate on information previously shown in a chart is
  DOCUMENT_QUERY.
- A previous chart or [CHART_CONTEXT] does not by itself make a
  follow-up a CHART_REQUEST.
- Only requests whose intended output is a chart or visualization
  should be classified as CHART_REQUEST.

Determine this from the semantic meaning and conversation context,
not from specific keywords.

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
- A follow-up asking to explain, clarify, interpret, define, summarize,
  or elaborate on a previous chart is DOCUMENT_QUERY, not CHART_REQUEST.
- A previous chart or [CHART_CONTEXT] does not by itself make a
  follow-up a CHART_REQUEST.
- Only requests to create, render, show, change, convert, plot,
  visualize, or regenerate a chart should be CHART_REQUEST.
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

