import os
import smtplib
from email.message import EmailMessage


def send_email(
    recipient_email: str | list[str],
    subject: str,
    body: str,
    attachments: list[dict] | None = None,
) -> None:
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM") or smtp_username

    if not smtp_username or not smtp_password or not smtp_from:
        raise RuntimeError("SMTP configuration is incomplete")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = smtp_from
    recipients = (
        [recipient_email]
        if isinstance(recipient_email, str)
        else [email.strip() for email in recipient_email if email and email.strip()]
    )

    if not recipients:
        raise ValueError("At least one recipient email is required")

    message["To"] = ", ".join(recipients)
    message.set_content(body)

    for attachment in attachments or []:
        filename = attachment.get("filename")
        content_type = attachment.get("content_type") or "application/octet-stream"
        content = attachment.get("content")

        if not filename or not isinstance(content, bytes):
            raise ValueError("Invalid email attachment")

        maintype, subtype = content_type.split("/", 1)

        message.add_attachment(
            content,
            maintype=maintype,
            subtype=subtype,
            filename=filename,
        )

    with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(smtp_username, smtp_password)
        server.send_message(message, to_addrs=recipients)


def send_password_reset_email(
    recipient_email: str | list[str],
    reset_url: str,
) -> None:
    send_email(
        recipient_email=recipient_email,
        subject="Reset your RAG Intelligence Platform password",
        body=f"""Hello,

We received a request to reset your password for RAG Intelligence Platform.

Use the link below to set a new password:

{reset_url}

This link expires in 30 minutes and can only be used once.

If you did not request a password reset, you can safely ignore this email.

Regards,
RAG Intelligence Platform
""",
    )
