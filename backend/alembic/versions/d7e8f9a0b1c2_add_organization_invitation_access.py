"""add organization invitation access control

Revision ID: d7e8f9a0b1c2
Revises: c1a9d7f4e2b1
"""

from alembic import op


revision = "d7e8f9a0b1c2"
down_revision = "c1a9d7f4e2b1"
branch_labels = None
depends_on = None


def upgrade():
    # Organization memberships need an explicit document-access state.
    op.execute(
        """
        ALTER TABLE tenant_memberships
        ADD COLUMN IF NOT EXISTS access_status VARCHAR NOT NULL DEFAULT 'pending'
        """
    )

    # Existing organization admins retain access.
    op.execute(
        """
        UPDATE tenant_memberships
        SET access_status = 'active'
        WHERE role = 'admin'
        """
    )

    # Existing members must accept a new admin invitation before
    # receiving organization document access.
    op.execute(
        """
        UPDATE tenant_memberships
        SET access_status = 'pending'
        WHERE role = 'member'
        """
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS organization_invitations (
            id VARCHAR PRIMARY KEY,
            tenant_id VARCHAR NOT NULL
                REFERENCES tenants(id) ON DELETE CASCADE,
            invitee_user_id VARCHAR NOT NULL
                REFERENCES users(id) ON DELETE CASCADE,
            invited_by_user_id VARCHAR NOT NULL
                REFERENCES users(id) ON DELETE CASCADE,
            status VARCHAR NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            responded_at TIMESTAMP WITHOUT TIME ZONE NULL
        )
        """
    )

    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_org_invitations_invitee
        ON organization_invitations(invitee_user_id)
        """
    )

    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_org_invitations_tenant
        ON organization_invitations(tenant_id)
        """
    )

    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_org_invitations_status
        ON organization_invitations(status)
        """
    )

    op.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS uq_org_invitation_pending
        ON organization_invitations(tenant_id, invitee_user_id)
        WHERE status = 'pending'
        """
    )


def downgrade():
    op.execute(
        """
        DROP INDEX IF EXISTS uq_org_invitation_pending
        """
    )

    op.execute(
        """
        DROP INDEX IF EXISTS ix_org_invitations_status
        """
    )

    op.execute(
        """
        DROP INDEX IF EXISTS ix_org_invitations_tenant
        """
    )

    op.execute(
        """
        DROP INDEX IF EXISTS ix_org_invitations_invitee
        """
    )

    op.execute(
        """
        DROP TABLE IF EXISTS organization_invitations
        """
    )

    op.execute(
        """
        ALTER TABLE tenant_memberships
        DROP COLUMN IF EXISTS access_status
        """
    )
