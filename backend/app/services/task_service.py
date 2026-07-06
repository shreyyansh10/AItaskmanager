import logging
from typing import List, Optional
from pydantic import ValidationError

from app.models.task import Task
from app.schemas.task import TaskRead, TaskUpdate, TaskGenerationSchema
from app.repository.task_repository import TaskRepository
from app.services.prompt_service import PromptService
from app.services.llm_manager import LLMManager, AllProvidersFailedError
from app.utils.json_parser import clean_and_parse_json, JSONParsingError
from app.utils.progress_emitter import progress_emitter

logger = logging.getLogger(__name__)

class TaskGenerationError(Exception):
    """Raised when task generation pipeline completely fails after retry."""
    pass

class TaskService:
    """
    TaskService acts as the core orchestration service for the AI Task Manager.
    It coordinates the prompt construction, LLM generation, JSON extraction/validation,
    retry mechanisms, and database persistence layers.
    """

    def __init__(self, prompt_service: PromptService, llm_manager: LLMManager, repository: TaskRepository):
        """
        Initialize TaskService with required dependencies.
        
        Args:
            prompt_service (PromptService): Prompt generation service.
            llm_manager (LLMManager): LLM manager orchestrating providers.
            repository (TaskRepository): Database repository for persistence.
        """
        self.prompt_service = prompt_service
        self.llm_manager = llm_manager
        self.repository = repository

    async def generate_tasks_from_text(self, source_text: str, job_id: Optional[str] = None) -> List[TaskRead]:
        """
        Runs the end-to-end task extraction and validation pipeline.
        
        Steps:
        1. Assembles task extraction prompt from raw source text.
        2. Calls LLMManager to generate raw string output.
        3. Strips markdown blocks and parses raw string into a Python dict.
        4. Validates parsed structure against TaskGenerationSchema.
        5. On parsing/validation failure: Retries the full call once.
        6. On persistent failure: Raises TaskGenerationError.
        7. On success: Maps validated models to ORM and saves via repository.
        
        Args:
            source_text (str): Unstructured notes text to extract tasks from.
            
        Returns:
            List[TaskRead]: A list of created tasks.
            
        Raises:
            TaskGenerationError: If task extraction fails twice.
        """
        async def _emit(stage: str):
            if job_id:
                await progress_emitter.emit(job_id, stage)

        logger.info("TaskService: Starting task generation pipeline")

        try:
            # 1. Compile the prompt
            await _emit("Creating Prompt")
            prompt = self.prompt_service.build_task_extraction_prompt(source_text)
            logger.info("TaskService: Task extraction prompt created")

            attempts = 2
            validated_schema = None

            for attempt in range(1, attempts + 1):
                logger.info(f"TaskService: Attempt {attempt}/{attempts} - Requesting LLM generate tasks")
                try:
                    # 2. Request LLM generation
                    await _emit("Calling Provider")
                    await _emit("Waiting for Response")
                    raw_response = await self.llm_manager.generate(prompt)
                    logger.info(f"TaskService: Attempt {attempt} - Raw text generated successfully")

                    # 3. Clean & Parse JSON
                    await _emit("Parsing JSON")
                    parsed_data = clean_and_parse_json(raw_response)
                    logger.info(f"TaskService: Attempt {attempt} - JSON text parsed successfully")

                    # 4. Validate against target Pydantic schema
                    await _emit("Validating Output")
                    validated_schema = TaskGenerationSchema.model_validate(parsed_data)
                    logger.info(f"TaskService: Attempt {attempt} - Pydantic validation successful")
                    break  # Succeeded, exit retry loop

                except (AllProvidersFailedError, JSONParsingError, ValidationError) as e:
                    logger.warning(
                        f"TaskService: Attempt {attempt} failed due to {e.__class__.__name__}: {str(e)}"
                    )
                    if attempt < attempts:
                        logger.info("TaskService: Retrying LLM extraction pipeline once")
                    else:
                        logger.error("TaskService: Final pipeline attempt failed. Raising TaskGenerationError.")
                        raise TaskGenerationError(f"Task extraction pipeline failed after {attempts} attempts: {str(e)}") from e

            # 5. Persist tasks to the database
            await _emit("Saving Tasks")
            logger.info("TaskService: Mapping validated JSON schemas to SQLAlchemy ORM models")
            tasks_to_create = []
            for task_create in validated_schema.tasks:
                task_create.source_text = source_text
                orm_task = Task(**task_create.model_dump())
                tasks_to_create.append(orm_task)

            logger.info(f"TaskService: Persisting {len(tasks_to_create)} tasks via TaskRepository")
            created_tasks = await self.repository.bulk_create(tasks_to_create)
            logger.info("TaskService: Task extraction and persistence complete")
            await _emit("Completed")
            return created_tasks

        except Exception as e:
            await _emit("Error")
            raise

    # CRUD operations passthroughs
    async def get_task_by_id(self, task_id: int) -> Optional[TaskRead]:
        """Retrieve task by ID from the repository."""
        return await self.repository.get_by_id(task_id)

    async def list_tasks(self, filters: Optional[dict] = None) -> List[TaskRead]:
        """Retrieve a list of tasks from the repository applying optional filters."""
        return await self.repository.list(filters)

    async def update_task(self, task_id: int, data: TaskUpdate) -> Optional[TaskRead]:
        """Update task details in the repository."""
        return await self.repository.update(task_id, data)

    async def delete_task(self, task_id: int) -> bool:
        """Delete task by ID from the repository."""
        return await self.repository.delete(task_id)
