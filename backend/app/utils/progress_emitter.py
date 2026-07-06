import asyncio
import logging
from typing import Dict

logger = logging.getLogger(__name__)

class ProgressEmitter:
    """
    In-memory pub/sub mechanism to emit pipeline progress events.
    Utilizes an asyncio.Queue per active job_id to push updates.
    """

    def __init__(self):
        self._queues: Dict[str, asyncio.Queue] = {}

    def register(self, job_id: str) -> asyncio.Queue:
        """Register a new asyncio.Queue for progress tracking of a specific job."""
        queue = asyncio.Queue()
        self._queues[job_id] = queue
        logger.info(f"Registered progress listener for job_id: {job_id}")
        return queue

    async def emit(self, job_id: str, stage: str, message: str = ""):
        """Push a stage update event to the queue associated with the job_id."""
        if job_id in self._queues:
            await self._queues[job_id].put({"stage": stage, "message": message})
            logger.info(f"Progress event emitted for job {job_id}: [{stage}] {message}")

    def unregister(self, job_id: str):
        """Clean up the queue and remove the listener registration for the job_id."""
        if job_id in self._queues:
            del self._queues[job_id]
            logger.info(f"Unregistered progress listener for job_id: {job_id}")

# Singleton emitter instance to be shared across service and api layers
progress_emitter = ProgressEmitter()
