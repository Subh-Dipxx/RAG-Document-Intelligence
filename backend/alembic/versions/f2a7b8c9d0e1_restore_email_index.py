"""Restore non-unique index on user email.

Revision ID: f2a7b8c9d0e1
Revises: e9f1a2b3c4d5
"""

from alembic import op

revision = "f2a7b8c9d0e1"
down_revision = "e9f1a2b3c4d5"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(
        "ix_users_email",
        "users",
        ["email"],
        unique=False,
    )


def downgrade():
    op.drop_index(
        "ix_users_email",
        table_name="users",
    )
