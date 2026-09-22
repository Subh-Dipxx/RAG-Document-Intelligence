from mcp.server.mcpserver import MCPServer

from backend.auth.email_service import send_email as smtp_send_email


mcp = MCPServer(
    name="DocGPT Email",
    version="1.0.0",
)


@mcp.tool()
def send_email(
    to: str,
    subject: str,
    body: str,
) -> str:
    """Send an email using the configured SMTP account."""

    recipient = to.strip()
    email_subject = subject.strip()
    email_body = body.strip()

    if not recipient:
        raise ValueError("Recipient email is required")

    if not email_subject:
        raise ValueError("Email subject is required")

    if not email_body:
        raise ValueError("Email body is required")

    smtp_send_email(
        recipient_email=recipient,
        subject=email_subject,
        body=email_body,
    )

    return "Email sent successfully."


if __name__ == "__main__":
    mcp.run(
        transport="streamable-http",
        host="0.0.0.0",
        port=8000,
    )
