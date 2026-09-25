import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.api.controllers.access_requests import (
    AccessRequestCreate,
    approve_access_request,
    create_access_request,
)
from backend.api.controllers.documents import delete_document
from backend.auth.dependencies import AuthContext
from backend.database.database import Base
from backend.database.models import (
    AccessGrantModel,
    DocumentModel,
    TenantMembershipModel,
    TenantModel,
    UserModel,
)
from backend.domain.models import Role


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


def seed(db):
    tenant_a = TenantModel(id="tenant-a", name="Organization A")
    tenant_b = TenantModel(id="tenant-b", name="Organization B")

    admin = UserModel(
        id="admin-a",
        username="admin_a",
        email="admin_a@test.local",
        password_hash="test",
    )
    member = UserModel(
        id="member-a",
        username="member_a",
        email="member_a@test.local",
        password_hash="test",
    )
    member2 = UserModel(
        id="member2-a",
        username="member2_a",
        email="member2_a@test.local",
        password_hash="test",
    )
    outsider = UserModel(
        id="outsider-b",
        username="outsider_b",
        email="outsider_b@test.local",
        password_hash="test",
    )

    db.add_all([tenant_a, tenant_b, admin, member, member2, outsider])
    db.flush()

    db.add_all([
        TenantMembershipModel(
            id="membership-admin-a",
            tenant_id="tenant-a",
            user_id="admin-a",
            role="admin",
        ),
        TenantMembershipModel(
            id="membership-member-a",
            tenant_id="tenant-a",
            user_id="member-a",
            role="member",
        ),
        TenantMembershipModel(
            id="membership-member2-a",
            tenant_id="tenant-a",
            user_id="member2-a",
            role="member",
        ),
        TenantMembershipModel(
            id="membership-outsider-b",
            tenant_id="tenant-b",
            user_id="outsider-b",
            role="member",
        ),
    ])

    doc_a = DocumentModel(
        id="doc-a",
        title="Organization A Document",
        file_name="a.pdf",
        mime_type="application/pdf",
        owner_id="admin-a",
        tenant_id="tenant-a",
        permissions=[],
    )

    doc_b = DocumentModel(
        id="doc-b",
        title="Organization B Document",
        file_name="b.pdf",
        mime_type="application/pdf",
        owner_id="outsider-b",
        tenant_id="tenant-b",
        permissions=[],
    )

    stale_doc = DocumentModel(
        id="stale-doc",
        title="Stale Grant Document",
        file_name="stale.pdf",
        mime_type="application/pdf",
        owner_id="admin-a",
        tenant_id="tenant-a",
        permissions=[],
    )

    valid_doc = DocumentModel(
        id="valid-doc",
        title="Valid Grant Document",
        file_name="valid.pdf",
        mime_type="application/pdf",
        owner_id="admin-a",
        tenant_id="tenant-a",
        permissions=[],
    )

    db.add_all([doc_a, doc_b, stale_doc, valid_doc])
    db.commit()

    return tenant_a, tenant_b, admin, member, member2, outsider, doc_a, doc_b, stale_doc, valid_doc


def auth(user_id, tenant_id, role="member"):
    return AuthContext(
        user_id=user_id,
        tenant_id=tenant_id,
        role=role,
        account_type="organization",
    )


def test_member_can_request_and_non_member_cannot(db):
    (
        tenant_a,
        tenant_b,
        admin,
        member,
        member2,
        outsider,
        doc_a,
        doc_b,
        stale_doc,
        valid_doc,
    ) = seed(db)

    request = create_access_request(
        AccessRequestCreate(document_id=doc_a.id),
        db,
        auth(member.id, tenant_a.id, "member"),
    )

    assert request.status == "pending"
    assert request.requester_id == member.id

    with pytest.raises(HTTPException) as exc:
        create_access_request(
            AccessRequestCreate(document_id=doc_a.id),
            db,
            auth(outsider.id, tenant_a.id, "member"),
        )

    assert exc.value.status_code == 403


def test_cross_organization_document_request_is_denied(db):
    (
        tenant_a,
        tenant_b,
        admin,
        member,
        member2,
        outsider,
        doc_a,
        doc_b,
        stale_doc,
        valid_doc,
    ) = seed(db)

    with pytest.raises(HTTPException) as exc:
        create_access_request(
            AccessRequestCreate(document_id=doc_a.id),
            db,
            auth(outsider.id, tenant_b.id, "member"),
        )

    assert exc.value.status_code == 404


def test_admin_cannot_approve_removed_member(db):
    (
        tenant_a,
        tenant_b,
        admin,
        member,
        member2,
        outsider,
        doc_a,
        doc_b,
        stale_doc,
        valid_doc,
    ) = seed(db)

    request = create_access_request(
        AccessRequestCreate(document_id=doc_a.id),
        db,
        auth(member2.id, tenant_a.id, "member"),
    )

    db.query(TenantMembershipModel).filter(
        TenantMembershipModel.tenant_id == tenant_a.id,
        TenantMembershipModel.user_id == member2.id,
    ).delete(synchronize_session=False)
    db.commit()

    with pytest.raises(HTTPException) as exc:
        approve_access_request(
            request.id,
            db,
            auth(admin.id, tenant_a.id, "admin"),
        )

    assert exc.value.status_code == 409

    grant = db.query(AccessGrantModel).filter(
        AccessGrantModel.tenant_id == tenant_a.id,
        AccessGrantModel.document_id == doc_a.id,
        AccessGrantModel.principal == member2.id,
        AccessGrantModel.role == Role.DELETE.value,
    ).first()

    assert grant is None


def test_member_can_delete_with_grant_while_membership_exists(db):
    (
        tenant_a,
        tenant_b,
        admin,
        member,
        member2,
        outsider,
        doc_a,
        doc_b,
        stale_doc,
        valid_doc,
    ) = seed(db)

    db.add(
        AccessGrantModel(
            tenant_id=tenant_a.id,
            document_id=valid_doc.id,
            principal=member.id,
            role=Role.DELETE.value,
        )
    )
    db.commit()

    result = delete_document(
        valid_doc.id,
        db,
        auth(member.id, tenant_a.id, "member"),
    )

    assert result is None
    assert db.query(DocumentModel).filter(
        DocumentModel.id == valid_doc.id
    ).first() is None


def test_removed_member_cannot_use_old_delete_grant(db):
    (
        tenant_a,
        tenant_b,
        admin,
        member,
        member2,
        outsider,
        doc_a,
        doc_b,
        stale_doc,
        valid_doc,
    ) = seed(db)

    db.add(
        AccessGrantModel(
            tenant_id=tenant_a.id,
            document_id=stale_doc.id,
            principal=member.id,
            role=Role.DELETE.value,
        )
    )
    db.commit()

    db.query(TenantMembershipModel).filter(
        TenantMembershipModel.tenant_id == tenant_a.id,
        TenantMembershipModel.user_id == member.id,
    ).delete(synchronize_session=False)
    db.commit()

    with pytest.raises(HTTPException) as exc:
        delete_document(
            stale_doc.id,
            db,
            auth(member.id, tenant_a.id, "member"),
        )

    assert exc.value.status_code == 403
    assert db.query(DocumentModel).filter(
        DocumentModel.id == stale_doc.id
    ).first() is not None


def test_cross_organization_delete_is_denied(db):
    (
        tenant_a,
        tenant_b,
        admin,
        member,
        member2,
        outsider,
        doc_a,
        doc_b,
        stale_doc,
        valid_doc,
    ) = seed(db)

    with pytest.raises(HTTPException) as exc:
        delete_document(
            doc_a.id,
            db,
            auth(outsider.id, tenant_b.id, "member"),
        )

    assert exc.value.status_code == 403
    assert db.query(DocumentModel).filter(
        DocumentModel.id == doc_a.id
    ).first() is not None
