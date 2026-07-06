from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, func, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base

class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    owner: Mapped[str] = mapped_column(String(100), default="Unassigned", server_default="Unassigned")
    due_date: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    priority: Mapped[str] = mapped_column(String(50), default="Medium", server_default="Medium")  # High/Medium/Low
    status: Mapped[str] = mapped_column(String(50), default="Pending", server_default="Pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now(), server_default=func.now())
    source_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # SHA-256 hex digest of normalised source_text (stripped + lowercased).
    # Used to detect duplicate submissions without re-running the LLM.
    source_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)

    def __repr__(self) -> str:
        return f"<Task id={self.id} title={self.title!r} status={self.status!r}>"
