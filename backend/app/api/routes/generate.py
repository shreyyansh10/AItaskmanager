import uuid
import asyncio
from typing import Optional
from fastapi import APIRouter, Depends, Form, UploadFile, File, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db, async_session
from app.repository.task_repository import TaskRepository
from app.services.prompt_service import PromptService
from app.services.llm_manager import LLMManager
from app.services.task_service import TaskService
from app.utils.text_extraction import extract_text
from app.utils.progress_emitter import progress_emitter
from app.providers.groq_provider import GroqProvider
from app.providers.gemini_provider import GeminiProvider
from app.providers.ollama_provider import OllamaProvider
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/generate", tags=["Generate"])


def _build_service(db: AsyncSession) -> TaskService:
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


async def _run_pipeline(source_text: str, job_id: str):
    """
    Background coroutine: owns its own DB session so it survives after the
    HTTP response has already been sent to the client.
    """
    async with async_session() as db:
        service = _build_service(db)
        try:
            await service.generate_tasks_from_text(source_text, job_id=job_id)
        except Exception as exc:
            # generate_tasks_from_text already emits 'Error' on any exception;
            # log here for server-side visibility.
            logger.error(f"Background pipeline failed for job {job_id}: {exc}")


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def generate_tasks(
    text: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
):
    """
    Accepts text or a file upload, registers a progress queue, fires the
    pipeline as a background task, and returns {job_id} immediately (202).

    The client should:
      1. Receive job_id from this response.
      2. Open GET /progress/{job_id} via EventSource to watch live stages.
      3. On 'Completed', call GET /tasks to fetch results from the database.
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
    progress_emitter.register(job_id)
    asyncio.create_task(_run_pipeline(source_text, job_id))
    return {"job_id": job_id}
