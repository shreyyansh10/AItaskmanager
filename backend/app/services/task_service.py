import hashlib
import json
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
from app.prompts.action_item_detection_prompt import build_action_item_detection_prompt
from app.schemas.action_items import ActionItemsResponse
from app.services.exceptions import ActionItemDetectionError

logger = logging.getLogger(__name__)


def _compute_source_hash(text: str) -> str:
    """SHA-256 hex digest of normalised source text (stripped + lowercased)."""
    return hashlib.sha256(text.strip().lower().encode("utf-8")).hexdigest()


class TaskGenerationError(Exception):
    """Raised when task generation pipeline completely fails after retry."""
    pass


class TaskService:
    """
    Orchestrates the full task-extraction pipeline:
    hash-check → prompt → LLM → parse → validate → persist.
    """

    def __init__(
        self,
        prompt_service: PromptService,
        llm_manager: LLMManager,
        repository: TaskRepository,
    ):
        self.prompt_service = prompt_service
        self.llm_manager = llm_manager
        self.repository = repository

    async def _detect_action_items(self, source_text: str) -> list[dict]:
        """
        Stage 1 Action Item Detection.
        Constructs detection prompt, requests LLM, parses/validates output,
        and applies retry-once strategy on validation or parser errors.
        """
        logger.info("TaskService: Stage 1 - Detecting action items")
        prompt = build_action_item_detection_prompt(source_text)

        attempts = 2
        for attempt in range(1, attempts + 1):
            logger.info(f"TaskService: Stage 1 Attempt {attempt}/{attempts} — calling LLM")
            try:
                raw_response = await self.llm_manager.generate(prompt)
                parsed_data = clean_and_parse_json(raw_response)
                validated = ActionItemsResponse.model_validate(parsed_data)
                action_items = [item.model_dump() for item in validated.action_items]
                return action_items

            except (AllProvidersFailedError, JSONParsingError, ValidationError) as e:
                logger.warning(
                    f"TaskService: Stage 1 Attempt {attempt} failed "
                    f"({e.__class__.__name__}): {e}"
                )
                if attempt < attempts:
                    logger.info("TaskService: Retrying Stage 1 once")
                else:
                    logger.error("TaskService: Stage 1 attempts exhausted.")
                    raise ActionItemDetectionError(
                        f"Action item detection failed after {attempts} attempts: {e}"
                    ) from e

    def _clean_tasks(self, tasks: list[dict]) -> list[dict]:
        """Run deterministic cleanup on extracted task dicts."""
        from app.utils.task_cleanup import clean_tasks
        return clean_tasks(tasks)

    async def generate_tasks_from_text(
        self, source_text: str, job_id: Optional[str] = None
    ) -> dict:
        """
        Run the end-to-end task extraction pipeline.

        Returns:
            {
                "tasks": List[TaskRead],
                "already_processed": bool
            }

        The Completed SSE message embeds the full task list as JSON so the
        frontend can display only the current generation's output without
        fetching all tasks from the database.
        """
        async def _emit(stage: str, message: str = ""):
            if job_id:
                await progress_emitter.emit(job_id, stage, message)

        logger.info("TaskService: Starting task generation pipeline")
        source_hash = _compute_source_hash(source_text)

        try:
            # ── Deduplication check ──────────────────────────────────────────
            await _emit("Reading File")
            existing = await self.repository.get_by_source_hash(source_hash)
            logger.info(f"TaskService: duplicate check={bool(existing)} hash={source_hash[:12]}…")

            if existing:
                logger.info(
                    f"TaskService: source_hash already processed — "
                    f"returning {len(existing)} cached tasks, skipping LLM."
                )
                payload = json.dumps({
                    "already_processed": True,
                    "tasks": [t.model_dump(mode="json") for t in existing],
                })
                await _emit("Completed", payload)
                return {"tasks": existing, "already_processed": True}

            # ── New source text — run the full pipeline ──────────────────────
            await _emit("Detecting Action Items")
            action_items = await self._detect_action_items(source_text)
            logger.info(f"TaskService: Stage 1 detected {len(action_items)} action items")

            if not action_items:
                logger.info("No action items detected — skipping extraction")
                await _emit("Completed", json.dumps({"already_processed": False, "tasks": []}))
                return {"tasks": [], "already_processed": False}

            filtered_text = "\n".join([item["sentence"] for item in action_items])

            await _emit("Extracting Text")
            await _emit("Creating Prompt")
            prompt = self.prompt_service.build_task_extraction_prompt(filtered_text)

            attempts = 2
            validated_schema = None

            for attempt in range(1, attempts + 1):
                logger.info(f"TaskService: Attempt {attempt}/{attempts} — calling LLM")
                try:
                    await _emit("Calling Provider")
                    await _emit("Waiting for Response")
                    raw_response = await self.llm_manager.generate(prompt)

                    await _emit("Parsing JSON")
                    parsed_data = clean_and_parse_json(raw_response)

                    await _emit("Validating Output")
                    validated_schema = TaskGenerationSchema.model_validate(parsed_data)
                    logger.info(f"TaskService: Attempt {attempt} — validation passed")
                    break

                except (AllProvidersFailedError, JSONParsingError, ValidationError) as e:
                    logger.warning(
                        f"TaskService: Attempt {attempt} failed "
                        f"({e.__class__.__name__}): {e}"
                    )
                    if attempt < attempts:
                        logger.info("TaskService: Retrying pipeline once")
                    else:
                        logger.error("TaskService: All attempts exhausted.")
                        raise TaskGenerationError(
                            f"Task extraction failed after {attempts} attempts: {e}"
                        ) from e

            # ── Cleanup ──────────────────────────────────────────────────────
            await _emit("Cleaning Tasks")
            raw_task_dicts = [
                task_create.model_dump() for task_create in validated_schema.tasks
            ]
            stage2_count = len(raw_task_dicts)
            cleaned_task_dicts = self._clean_tasks(raw_task_dicts)
            logger.info(
                f"TaskService: Stage 1={len(action_items)} action items | "
                f"Stage 2={stage2_count} tasks | "
                f"cleanup removed={stage2_count - len(cleaned_task_dicts)} | "
                f"saving={len(cleaned_task_dicts)}"
            )

            # ── Persist ──────────────────────────────────────────────────────
            await _emit("Saving Tasks")
            tasks_to_create = []
            for data in cleaned_task_dicts:
                data["source_text"] = source_text
                data["source_hash"] = source_hash
                tasks_to_create.append(Task(**data))

            created_tasks = await self.repository.bulk_create(tasks_to_create)
            logger.info(f"TaskService: Pipeline complete — {len(created_tasks)} tasks saved")

            payload = json.dumps({
                "already_processed": False,
                "tasks": [t.model_dump(mode="json") for t in created_tasks],
            })
            await _emit("Completed", payload)
            return {"tasks": created_tasks, "already_processed": False}

        except Exception:
            await _emit("Error")
            raise

    # ── CRUD passthroughs ────────────────────────────────────────────────────

    async def get_task_by_id(self, task_id: int) -> Optional[TaskRead]:
        return await self.repository.get_by_id(task_id)

    async def list_tasks(self, filters: Optional[dict] = None) -> List[TaskRead]:
        return await self.repository.list(filters)

    async def update_task(self, task_id: int, data: TaskUpdate) -> Optional[TaskRead]:
        return await self.repository.update(task_id, data)

    async def delete_task(self, task_id: int) -> bool:
        return await self.repository.delete(task_id)
