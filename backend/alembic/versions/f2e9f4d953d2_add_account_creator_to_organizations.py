"""add account creator to organizations

Revision ID: f2e9f4d953d2
Revises: f2a7b8c9d0e1
Create Date: 2026-09-30

"""

from alembic import op
import sqlalchemy as sa


revision = "f2e9f4d953d2"
down_revision = "f2a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "tenants",
        sa.Column(
            "created_by_user_id",
            sa.String(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_tenants_created_by_user_id",
        "tenants",
        ["created_by_user_id"],
        unique=False,
    )

    op.create_foreign_key(
        "fk_tenants_created_by_user_id_users",
        "tenants",
        "users",
        ["created_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_tenants_created_by_user_id_users",
        "tenants",
        type_="foreignkey",
    )

    op.drop_index(
        "ix_tenants_created_by_user_id",
        table_name="tenants",
    )

    op.drop_column(
        "tenants",
        "created_by_user_id",
    )
