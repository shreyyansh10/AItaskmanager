from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.task import Task
from app.schemas.task import TaskRead, TaskUpdate
import logging

logger = logging.getLogger(__name__)


class TaskRepository:
    """
    Task Repository for database CRUD operations.

    Convention:
    - Inputs: Methods that write/create new entities (`create`, `bulk_create`) accept ORM Task instances.
    - Outputs: All methods return Pydantic models (TaskRead) or lists of them.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, task: Task) -> TaskRead:
        """Add a new task to the session, commit, and return a Pydantic schema."""
        self.db.add(task)
        await self.db.commit()
        await self.db.refresh(task)
        return TaskRead.model_validate(task)

    async def get_by_id(self, task_id: int) -> Optional[TaskRead]:
        """Fetch a task by ID and return its Pydantic schema representation."""
        result = await self.db.execute(select(Task).where(Task.id == task_id))
        task = result.scalar_one_or_none()
        if task is None:
            return None
        return TaskRead.model_validate(task)

    async def list(self, filters: Optional[dict] = None) -> List[TaskRead]:
        """Query tasks applying optional filters (status, priority, owner)."""
        stmt = select(Task)
        if filters:
            if filters.get("status") is not None:
                stmt = stmt.where(Task.status == filters["status"])
            if filters.get("priority") is not None:
                stmt = stmt.where(Task.priority == filters["priority"])
            if filters.get("owner") is not None:
                stmt = stmt.where(Task.owner == filters["owner"])
        result = await self.db.execute(stmt)
        tasks = result.scalars().all()
        return [TaskRead.model_validate(t) for t in tasks]

    async def update(self, task_id: int, data: TaskUpdate) -> Optional[TaskRead]:
        """Fetch a task, apply updates, commit, and return the updated schema."""
        result = await self.db.execute(select(Task).where(Task.id == task_id))
        task = result.scalar_one_or_none()
        if task is None:
            return None
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(task, key, val)
        await self.db.commit()
        await self.db.refresh(task)
        return TaskRead.model_validate(task)

    async def delete(self, task_id: int) -> bool:
        """Delete a task by ID. Returns True if deleted, False if not found."""
        result = await self.db.execute(select(Task).where(Task.id == task_id))
        task = result.scalar_one_or_none()
        if task is None:
            return False
        await self.db.delete(task)
        await self.db.commit()
        return True

    async def get_by_source_hash(self, source_hash: str) -> List[TaskRead]:
        """Return all tasks previously created from a source text with this hash."""
        result = await self.db.execute(
            select(Task).where(Task.source_hash == source_hash).order_by(Task.id)
        )
        tasks = result.scalars().all()
        return [TaskRead.model_validate(t) for t in tasks]

    async def bulk_create(self, tasks: List[Task]) -> List[TaskRead]:
        """Insert tasks in bulk, skipping any whose (title, owner, source_hash)
        combination already exists in the database.
        Logs a warning for each skipped duplicate rather than silently inserting.
        """
        if not tasks:
            return []

        # Collect source_hash values present in this batch to scope the DB query.
        hashes = {t.source_hash for t in tasks if t.source_hash}
        existing_keys: set = set()
        if hashes:
            rows = await self.db.execute(
                select(Task.title, Task.owner, Task.source_hash).where(
                    Task.source_hash.in_(hashes)
                )
            )
            existing_keys = {(r.title, r.owner, r.source_hash) for r in rows}

        to_insert: List[Task] = []
        for t in tasks:
            key = (t.title, t.owner, t.source_hash)
            if key in existing_keys:
                logger.warning(
                    f"TaskRepository: skipping duplicate — "
                    f"title={t.title!r} owner={t.owner!r} hash={t.source_hash!r}"
                )
            else:
                to_insert.append(t)
                existing_keys.add(key)  # guard against duplicates within the same batch

        if not to_insert:
            return []

        self.db.add_all(to_insert)
        await self.db.commit()
        for t in to_insert:
            await self.db.refresh(t)
        return [TaskRead.model_validate(t) for t in to_insert]
