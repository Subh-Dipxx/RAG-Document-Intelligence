from __future__ import annotations

import json
import os

from backend.mcp.client import MCPClient


def create_chart(
    question: str,
    document_context: str,
) -> dict:
    server_url = os.getenv(
        "MCP_CHART_SERVER_URL",
        "http://mcp-chart:8000/mcp",
    )

    result = MCPClient(server_url=server_url).call_tool(
        "create_chart",
        {
            "question": question,
            "document_context": document_context,
        },
    )

    for content in getattr(result, "content", []) or []:
        text = getattr(content, "text", None)

        if text:
            return json.loads(text)

    raise ValueError("MCP chart server returned no chart result")
