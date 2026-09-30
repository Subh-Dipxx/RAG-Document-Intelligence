"""add activity logs

Revision ID: a7b8c9d0e1f2
Revises: f2e9f4d953d2
Create Date: 2026-09-30
"""

from alembic import op
import sqlalchemy as sa


revision = "a7b8c9d0e1f2"
down_revision = "f2e9f4d953d2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "activity_logs",
        sa.Column(
            "id",
            sa.String(),
            nullable=False,
        ),
        sa.Column(
            "tenant_id",
            sa.String(),
            nullable=False,
        ),
        sa.Column(
            "actor_id",
            sa.String(),
            nullable=True,
        ),
        sa.Column(
            "actor_username",
            sa.String(),
            nullable=False,
        ),
        sa.Column(
            "activity_type",
            sa.String(),
            nullable=False,
        ),
        sa.Column(
            "message",
            sa.Text(),
            nullable=False,
        ),
        sa.Column(
            "document_id",
            sa.String(),
            nullable=True,
        ),
        sa.Column(
            "document_name",
            sa.String(),
            nullable=True,
        ),
        sa.Column(
            "metadata_json",
            sa.JSON(),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"],
            ["tenants.id"],
            name="fk_activity_logs_tenant_id_tenants",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["actor_id"],
            ["users.id"],
            name="fk_activity_logs_actor_id_users",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_activity_logs_tenant_id",
        "activity_logs",
        ["tenant_id"],
        unique=False,
    )

    op.create_index(
        "ix_activity_logs_actor_id",
        "activity_logs",
        ["actor_id"],
        unique=False,
    )

    op.create_index(
        "ix_activity_logs_activity_type",
        "activity_logs",
        ["activity_type"],
        unique=False,
    )

    op.create_index(
        "ix_activity_logs_document_id",
        "activity_logs",
        ["document_id"],
        unique=False,
    )

    op.create_index(
        "ix_activity_logs_created_at",
        "activity_logs",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_activity_logs_created_at",
        table_name="activity_logs",
    )
    op.drop_index(
        "ix_activity_logs_document_id",
        table_name="activity_logs",
    )
    op.drop_index(
        "ix_activity_logs_activity_type",
        table_name="activity_logs",
    )
    op.drop_index(
        "ix_activity_logs_actor_id",
        table_name="activity_logs",
    )
    op.drop_index(
        "ix_activity_logs_tenant_id",
        table_name="activity_logs",
    )

    op.drop_table("activity_logs")
