"""allow users to belong to multiple organizations

Revision ID: e4f6a1b2c3d4
Revises: d7e8f9a0b1c2
"""

from alembic import op


revision = "e4f6a1b2c3d4"
down_revision = "d7e8f9a0b1c2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint(
        "uq_tenant_membership_user",
        "tenant_memberships",
        type_="unique",
    )
    op.create_unique_constraint(
        "uq_tenant_membership_user_tenant",
        "tenant_memberships",
        ["user_id", "tenant_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_tenant_membership_user_tenant",
        "tenant_memberships",
        type_="unique",
    )
    op.create_unique_constraint(
        "uq_tenant_membership_user",
        "tenant_memberships",
        ["user_id"],
    )
