from __future__ import annotations

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import declarative_base, sessionmaker

from config import get_settings

Base = declarative_base()

_engine = None
_SessionLocal = None
DATABASE_URL = None


def get_engine():
    global _engine, _SessionLocal, DATABASE_URL

    if _engine is None:
        settings = get_settings()
        DATABASE_URL = settings.database_url

        if DATABASE_URL.startswith("sqlite"):
            _engine = create_engine(
                DATABASE_URL,
                connect_args={"check_same_thread": False},
            )
        else:
            _engine = create_engine(
                DATABASE_URL,
                pool_pre_ping=True,
            )

        _SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=_engine,
        )

    return _engine


class _EngineProxy:
    def __getattr__(self, item):
        return getattr(get_engine(), item)


engine = _EngineProxy()


def get_db():
    get_engine()

    db = _SessionLocal()

    try:
        yield db
    finally:
        db.close()


def init_db():
    """Import all SQLAlchemy models and create missing tables."""

    import db.models  # noqa: F401

    db_engine = get_engine()

    Base.metadata.create_all(bind=db_engine)

    inspector = inspect(db_engine)
    tables = inspector.get_table_names()

    if not tables:
        raise RuntimeError(
            "Database initialization completed but no tables were created"
        )

    return tables