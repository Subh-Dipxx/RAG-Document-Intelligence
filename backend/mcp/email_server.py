import base64

from mcp.server.mcpserver import MCPServer

from backend.auth.email_service import send_email as smtp_send_email


mcp = MCPServer(
    name="DocGPT Email",
    version="1.0.0",
)


@mcp.tool()
def send_email(
    to: list[str],
    subject: str,
    body: str,
    attachments: list[dict] | None = None,
) -> str:
    """Send an email using the configured SMTP account."""

    recipients = [
        email.strip()
        for email in to
        if isinstance(email, str) and email.strip()
    ]
    email_subject = subject.strip()
    email_body = body.strip()

    if not recipients:
        raise ValueError("At least one recipient email is required")

    if not email_subject:
        raise ValueError("Email subject is required")

    if not email_body:
        raise ValueError("Email body is required")

    decoded_attachments = []

    for attachment in attachments or []:
        filename = attachment.get("filename")
        content_type = (
            attachment.get("content_type")
            or "application/octet-stream"
        )
        content_base64 = attachment.get("content_base64")

        if not filename or not content_base64:
            raise ValueError("Invalid email attachment")

        try:
            content = base64.b64decode(
                content_base64,
                validate=True,
            )
        except Exception as exc:
            raise ValueError("Invalid attachment encoding") from exc

        decoded_attachments.append(
            {
                "filename": filename,
                "content_type": content_type,
                "content": content,
            }
        )

    smtp_send_email(
        recipient_email=recipients,
        subject=email_subject,
        body=email_body,
        attachments=decoded_attachments,
    )

    return "Email sent successfully."


if __name__ == "__main__":
    mcp.run(
        transport="streamable-http",
        host="0.0.0.0",
        port=8000,
    )
