# -----------------------------------------------------------------------
# db.py
# Database engine and session management for SQLAlchemy
# -----------------------------------------------------------------------

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from contextlib import contextmanager
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.environ["DATABASE_URL"]

# -----------------------------------------------------------------------

# Create engine
engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)

# Create session factory
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

# -----------------------------------------------------------------------


@contextmanager
def get_session():
    """
    Context manager for database sessions.
    Automatically handles session lifecycle and error handling.

    Usage:
        with get_session() as session:
            user = session.query(User).filter_by(username='test').first()
    """
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        print(f"Database error: {e}")
        raise
    finally:
        session.close()


# -----------------------------------------------------------------------


def get_db():
    """
    Dependency for getting a database session.
    Returns a session that should be closed by the caller.

    Usage:
        session = get_db()
        try:
            # use session
        finally:
            session.close()
    """
    return SessionLocal()
