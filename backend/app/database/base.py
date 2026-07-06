from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL

# Create async engine for SQLite (using aiosqlite driver)
engine = create_async_engine(DATABASE_URL, echo=True)

class Base(DeclarativeBase):
    pass
