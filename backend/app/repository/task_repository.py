from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.task import Task
from app.schemas.task import TaskRead, TaskUpdate

class TaskRepository:
    """
    Task Repository for database CRUD operations.

    Convention:
    - Inputs: Methods that write/create new entities (`create`, `bulk_create`) accept ORM Task instances ("ORM objects in").
      Methods that retrieve, update, or delete accept primitive IDs and schema payloads.
    - Outputs: All database query/manipulation methods return Pydantic models (such as `TaskRead`) or lists of them ("Pydantic out").
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, task: Task) -> TaskRead:
        """Add a new task (ORM object) to the session, commit, and return a Pydantic schema."""
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
        """Query tasks applying optional filters (e.g., status, priority, owner)."""
        stmt = select(Task)
        if filters:
            if "status" in filters and filters["status"] is not None:
                stmt = stmt.where(Task.status == filters["status"])
            if "priority" in filters and filters["priority"] is not None:
                stmt = stmt.where(Task.priority == filters["priority"])
            if "owner" in filters and filters["owner"] is not None:
                stmt = stmt.where(Task.owner == filters["owner"])
        
        result = await self.db.execute(stmt)
        tasks = result.scalars().all()
        return [TaskRead.model_validate(t) for t in tasks]

    async def update(self, task_id: int, data: TaskUpdate) -> Optional[TaskRead]:
        """Fetch a task, apply updates from Pydantic schema, commit, and return the updated Pydantic schema."""
        result = await self.db.execute(select(Task).where(Task.id == task_id))
        task = result.scalar_one_or_none()
        if task is None:
            return None
        
        # Dump update data (excluding fields not explicitly set)
        update_dict = data.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(task, key, val)
            
        await self.db.commit()
        await self.db.refresh(task)
        return TaskRead.model_validate(task)

    async def delete(self, task_id: int) -> bool:
        """Fetch a task, delete it, commit, and return True if deletion succeeded."""
        result = await self.db.execute(select(Task).where(Task.id == task_id))
        task = result.scalar_one_or_none()
        if task is None:
            return False
            
        await self.db.delete(task)
        await self.db.commit()
        return True

    async def bulk_create(self, tasks: List[Task]) -> List[TaskRead]:
        """Insert multiple tasks (ORM objects) in bulk, commit, and return list of Pydantic schemas."""
        self.db.add_all(tasks)
        await self.db.commit()
        # Refresh to populate IDs and timestamps
        for t in tasks:
            await self.db.refresh(t)
        return [TaskRead.model_validate(t) for t in tasks]
