"""Allow multiple user accounts to share an email address.

Revision ID: e9f1a2b3c4d5
Revises: e4f6a1b2c3d4
"""

from alembic import op


revision = "e9f1a2b3c4d5"
down_revision = "e4f6a1b2c3d4"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_index("ix_users_email", table_name="users")


def downgrade():
    op.create_index(
        "ix_users_email",
        "users",
        ["email"],
        unique=True,
    )
