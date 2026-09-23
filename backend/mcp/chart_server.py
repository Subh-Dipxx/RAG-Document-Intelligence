from __future__ import annotations

import json
from typing import Any

from google import genai
from google.genai import types
from mcp.server.mcpserver import MCPServer

from backend.config import get_settings


mcp = MCPServer(
    name="DocGPT Chart",
    version="1.0.0",
)


VALID_CHART_TYPES = {
    "bar",
    "line",
    "pie",
    "scatter",
}


def _validate_chart(chart: dict[str, Any]) -> dict[str, Any]:
    chart_type = chart.get("chart_type")

    if chart_type not in VALID_CHART_TYPES:
        raise ValueError("Unsupported chart type")

    title = chart.get("title") or "Document chart"
    data = chart.get("data")

    if not isinstance(data, list) or not data:
        raise ValueError("Chart data is empty")

    if len(data) > 200:
        data = data[:200]

    if not all(isinstance(row, dict) for row in data):
        raise ValueError("Chart data must contain objects")

    series = chart.get("series") or []

    if not isinstance(series, list):
        raise ValueError("Chart series must be a list")

    for item in series:
        if not isinstance(item, dict) or not item.get("data_key"):
            raise ValueError("Invalid chart series")

    x_key = chart.get("x_key")

    if chart_type in {"bar", "line", "scatter"} and not x_key:
        raise ValueError("x_key is required")

    if chart_type == "pie":
        if not chart.get("name_key") or not chart.get("value_key"):
            raise ValueError(
                "name_key and value_key are required for pie charts"
            )

    return {
        "chart_type": chart_type,
        "title": title,
        "x_key": x_key,
        "name_key": chart.get("name_key"),
        "value_key": chart.get("value_key"),
        "series": series,
        "data": data,
    }


@mcp.tool()
def create_chart(
    question: str,
    document_context: str,
) -> dict[str, Any]:
    """
    Create a validated chart specification from the selected document.

    The supplied document context is the only source of factual data.
    """

    if not question.strip():
        raise ValueError("Chart request is required")

    if not document_context.strip():
        raise ValueError("Document data is unavailable")

    settings = get_settings()
    client = genai.Client(api_key=settings.gemini_api_key)

    prompt = f"""
You are a chart-generation tool inside DocGPT.

The user wants a visualization based ONLY on the supplied document context.

User request:
{question}

Document context:
{document_context}

Rules:
- Use ONLY values present in the document context.
- Never invent, estimate, fabricate, or extrapolate values.
- Select the chart type that best matches the user's requested visualization.
- If the user explicitly requests a chart type, use that type when the
  supplied data supports it.
- Use bar, line, pie, or scatter.
- Return only data that is actually supported by the document.
- Keep the number of rows at or below 200.
- Use stable column-style keys.
- For bar, line, and scatter charts provide x_key and series.
- For pie charts provide name_key and value_key.
- Numeric chart values must remain numeric.
- If the requested chart cannot be created from the document context,
  return:
  {{"error": "INSUFFICIENT_DATA"}}

Return JSON only.

Expected successful structure:
{{
  "chart_type": "bar",
  "title": "Revenue by Month",
  "x_key": "month",
  "name_key": null,
  "value_key": null,
  "series": [
    {{
      "data_key": "revenue",
      "label": "Revenue"
    }}
  ],
  "data": [
    {{
      "month": "January",
      "revenue": 120000
    }}
  ]
}}
"""

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0,
            response_mime_type="application/json",
        ),
    )

    raw = (response.text or "").strip()

    if not raw:
        raise ValueError("Chart generator returned an empty response")

    result = json.loads(raw)

    if result.get("error") == "INSUFFICIENT_DATA":
        return result

    return _validate_chart(result)


if __name__ == "__main__":
    mcp.run(
        transport="streamable-http",
        host="0.0.0.0",
        port=8000,
    )
