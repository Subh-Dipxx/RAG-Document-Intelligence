from __future__ import annotations

import asyncio
import os

from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client


class MCPClient:
    """Client for the internal MCP server."""

    def __init__(self, server_url: str | None = None) -> None:
        self.server_url = server_url or os.getenv(
            "MCP_SERVER_URL",
            "http://mcp-email:8000/mcp",
        )

    async def _call_tool_async(
        self,
        tool_name: str,
        arguments: dict,
    ):
        async with streamable_http_client(
            self.server_url
        ) as streams:
            read_stream, write_stream = streams

            async with ClientSession(
                read_stream,
                write_stream,
            ) as session:
                await session.initialize()

                return await session.call_tool(
                    tool_name,
                    arguments=arguments,
                )

    def call_tool(
        self,
        tool_name: str,
        arguments: dict,
    ):
        return asyncio.run(
            self._call_tool_async(
                tool_name,
                arguments,
            )
        )


def send_email(
    to: list[str],
    subject: str,
    body: str,
    attachments: list[dict] | None = None,
):
    return MCPClient().call_tool(
        "send_email",
        {
            "to": to,
            "subject": subject,
            "body": body,
            "attachments": attachments or [],
        },
    )
