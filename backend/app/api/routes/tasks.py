from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.repository.task_repository import TaskRepository
from app.services.prompt_service import PromptService
from app.services.llm_manager import LLMManager
from app.services.task_service import TaskService
from app.schemas.task import TaskRead, TaskUpdate
from app.providers.groq_provider import GroqProvider
from app.providers.gemini_provider import GeminiProvider
from app.providers.ollama_provider import OllamaProvider
from app.core.config import settings

router = APIRouter(prefix="/tasks", tags=["Tasks"])


def get_task_service(db: AsyncSession = Depends(get_db)) -> TaskService:
    providers = []
    if settings.GROQ_API_KEY:
        providers.append(GroqProvider(api_key=settings.GROQ_API_KEY))
    if settings.GEMINI_API_KEY:
        providers.append(GeminiProvider(api_key=settings.GEMINI_API_KEY))
    providers.append(OllamaProvider(base_url=settings.OLLAMA_BASE_URL))
    return TaskService(
        prompt_service=PromptService(),
        llm_manager=LLMManager(providers=providers),
        repository=TaskRepository(db),
    )


@router.get("", response_model=List[TaskRead])
async def list_tasks(
    owner: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    service: TaskService = Depends(get_task_service),
):
    filters = {"owner": owner, "priority": priority, "status": status}
    return await service.list_tasks(filters)


@router.put("/{task_id}", response_model=TaskRead)
async def update_task(
    task_id: int,
    data: TaskUpdate,
    service: TaskService = Depends(get_task_service),
):
    task = await service.update_task(task_id, data)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Task {task_id} not found.")
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    service: TaskService = Depends(get_task_service),
):
    deleted = await service.delete_task(task_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Task {task_id} not found.")
