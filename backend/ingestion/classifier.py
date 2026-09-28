from __future__ import annotations

import json
import os
import re
from typing import Any, Dict

from google import genai
from google.genai import types

from backend.config import get_settings


def _parse_json_response(raw_text: str) -> Dict[str, Any]:
    text = (raw_text or "").strip()

    # Remove markdown code fences if Gemini returns them.
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return {}

    if not isinstance(data, dict):
        return {}

    return data


def classify_document_content(text: str = "") -> Dict[str, Any]:
    """
    Determine the document's semantic domain from the actual extracted
    document content.

    IMPORTANT:
    - Filename is not used.
    - Title is not used.
    - File extension is not used.
    - No hard-coded category/keyword list is used.
    """

    document_text = (text or "").strip()

    if not document_text:
        return {
            "category": "Unclassified",
            "topics": [],
            "content_snippet": "",
        }

    # Keep a sufficiently large content window for semantic classification.
    content_for_classification = document_text[:20000]

    settings = get_settings()

    client = genai.Client(
        api_key=settings.gemini_api_key
    )

    prompt = f"""
You are the semantic document classification component of a
document intelligence system.

Analyze ONLY the supplied document content.

Your task is to identify the document's primary knowledge domain
or subject area from its meaning, subject matter, concepts,
entities, terminology, and overall context.

IMPORTANT RULES:
1. Do NOT use a filename because none is provided.
2. Do NOT assume a category from file type.
3. Do NOT use a predefined category list.
4. Do NOT use keyword matching or simple word-count rules.
5. Infer the most appropriate domain from the meaning of the content.
6. The category may be any concise, human-readable domain that
   accurately represents the document.
7. If the document genuinely covers multiple areas, choose the
   primary one and put important secondary areas in topics.
8. Return JSON only.

Required JSON format:

{{
  "category": "primary semantic domain",
  "topics": [
    "important topic",
    "important topic"
  ]
}}

DOCUMENT CONTENT:
{content_for_classification}
"""

    fallback_str = os.getenv("GEMINI_FALLBACK_MODELS", "")
    fallbacks = [
        model.strip()
        for model in fallback_str.split(",")
        if model.strip()
    ]

    models_to_try = [settings.gemini_model] + fallbacks

    seen = set()
    models_to_try = [
        model
        for model in models_to_try
        if model and not (
            model in seen or seen.add(model)
        )
    ]

    temperature = float(
        os.getenv("GEMINI_TEMPERATURE", "0.2")
    )

    last_error = None

    for model_name in models_to_try:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=temperature,
                    response_mime_type="application/json",
                ),
            )

            raw_response = (response.text or "").strip()
            result = _parse_json_response(raw_response)

            category = result.get("category")
            topics = result.get("topics")

            if not isinstance(category, str) or not category.strip():
                continue

            if not isinstance(topics, list):
                topics = []

            topics = [
                str(topic).strip()
                for topic in topics
                if str(topic).strip()
            ]

            print(
                f"DOCUMENT_CLASSIFICATION: "
                f"model={model_name} category={category!r} "
                f"topics={topics!r}",
                flush=True,
            )

            return {
                "category": category.strip(),
                "topics": topics[:10],
                "content_snippet": document_text[:300],
            }

        except Exception as exc:
            last_error = exc
            print(
                f"Document classification error with model "
                f"{model_name}: {exc}",
                flush=True,
            )

    print(
        f"Document classification failed: {last_error}",
        flush=True,
    )

    return {
        "category": "Unclassified",
        "topics": [],
        "content_snippet": document_text[:300],
    }
