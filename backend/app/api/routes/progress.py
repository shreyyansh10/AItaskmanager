import asyncio
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.utils.progress_emitter import progress_emitter

router = APIRouter(prefix="/progress", tags=["Progress"])


@router.get("/{job_id}")
async def stream_progress(job_id: str):
    """
    Stream pipeline progress events for a given job_id via Server-Sent Events.

    The queue for this job_id must already exist — it is registered by
    POST /generate before the background task starts, so every emitted event
    lands in the queue before this connection drains it.

    Returns 404 if the job_id is unknown (e.g. already completed and cleaned up,
    or never existed).
    """
    queue = progress_emitter.get(job_id)
    if queue is None:
        raise HTTPException(status_code=404, detail=f"No active job found for job_id: {job_id}")

    async def event_generator():
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=120.0)
                except asyncio.TimeoutError:
                    yield f"data: {json.dumps({'stage': 'Error', 'message': 'Timeout'})}\n\n"
                    break

                stage = event.get("stage", "")
                yield f"data: {json.dumps(event)}\n\n"

                if stage in ("Completed", "Error"):
                    break
        finally:
            progress_emitter.unregister(job_id)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # prevents nginx proxy buffering
        },
    )
