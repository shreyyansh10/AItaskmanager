import json
from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.repository.task_repository import TaskRepository
from app.services.prompt_service import PromptService
from app.services.llm_manager import LLMManager
from app.services.task_service import TaskService
from app.providers.groq_provider import GroqProvider
from app.providers.gemini_provider import GeminiProvider
from app.providers.ollama_provider import OllamaProvider
from app.core.config import settings

router = APIRouter(prefix="/tasks", tags=["Export"])


def get_task_service(db: AsyncSession = Depends(get_db)) -> TaskService:
    providers = []
    if settings.GROQ_API_KEY:
        providers.append(GroqProvider(api_key=settings.GROQ_API_KEY))
    if settings.GEMINI_API_KEY:
        providers.append(GeminiProvider(api_key=settings.GEMINI_API_KEY))
    if settings.OLLAMA_BASE_URL and settings.OLLAMA_MODEL_NAME:
        providers.append(
            OllamaProvider(
                base_url=settings.OLLAMA_BASE_URL,
                model_name=settings.OLLAMA_MODEL_NAME,
            )
        )
    return TaskService(
        prompt_service=PromptService(),
        llm_manager=LLMManager(providers=providers),
        repository=TaskRepository(db),
    )


@router.get("/export/json")
async def export_tasks_json(service: TaskService = Depends(get_task_service)):
    tasks = await service.list_tasks()
    content = json.dumps([t.model_dump(mode="json") for t in tasks], indent=2)
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=tasks.json"},
    )
