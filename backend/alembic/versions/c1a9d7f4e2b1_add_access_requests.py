"""add access requests

Revision ID: c1a9d7f4e2b1
Revises: 83eeb2dcf65b
"""

from alembic import op
import sqlalchemy as sa


revision = "c1a9d7f4e2b1"
down_revision = "83eeb2dcf65b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "access_requests",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("tenant_id", sa.String(), nullable=False),
        sa.Column("document_id", sa.String(), nullable=False),
        sa.Column("requester_id", sa.String(), nullable=False),
        sa.Column("requested_role", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
        sa.Column("resolved_by", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(
            ["tenant_id"],
            ["tenants.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["document_id"],
            ["documents.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["requester_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["resolved_by"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_access_requests_tenant",
        "access_requests",
        ["tenant_id"],
        unique=False,
    )
    op.create_index(
        "ix_access_requests_document",
        "access_requests",
        ["document_id"],
        unique=False,
    )
    op.create_index(
        "ix_access_requests_requester",
        "access_requests",
        ["requester_id"],
        unique=False,
    )
    op.create_index(
        "ix_access_requests_status",
        "access_requests",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_access_requests_status", table_name="access_requests")
    op.drop_index("ix_access_requests_requester", table_name="access_requests")
    op.drop_index("ix_access_requests_document", table_name="access_requests")
    op.drop_index("ix_access_requests_tenant", table_name="access_requests")
    op.drop_table("access_requests")
