import os
import smtplib
from email.message import EmailMessage


def send_email(
    recipient_email: str,
    subject: str,
    body: str,
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
    message["To"] = recipient_email
    message.set_content(body)

    with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(smtp_username, smtp_password)
        server.send_message(message)


def send_password_reset_email(
    recipient_email: str,
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
