import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Form, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.repository.task_repository import TaskRepository
from app.services.prompt_service import PromptService
from app.services.llm_manager import LLMManager
from app.services.task_service import TaskService
from app.utils.text_extraction import extract_text
from app.providers.groq_provider import GroqProvider
from app.providers.gemini_provider import GeminiProvider
from app.providers.ollama_provider import OllamaProvider
from app.core.config import settings

router = APIRouter(prefix="/generate", tags=["Generate"])


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


@router.post("", status_code=status.HTTP_201_CREATED)
async def generate_tasks(
    text: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
    service: TaskService = Depends(get_task_service),
):
    """
    Accept either a form field 'text' or a multipart file upload.
    Generates a job_id for SSE progress tracking via GET /progress/{job_id}.
    Runs the full pipeline and returns job_id + created tasks on completion.
    """
    if file is not None:
        source_text = await extract_text(file)
    elif text is not None:
        source_text = text
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide 'text' form field or a file upload.",
        )

    job_id = str(uuid.uuid4())
    tasks = await service.generate_tasks_from_text(source_text, job_id=job_id)
    return {"job_id": job_id, "tasks": tasks}
