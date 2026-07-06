import asyncio
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.utils.progress_emitter import progress_emitter

router = APIRouter(prefix="/progress", tags=["Progress"])

@router.get("/{job_id}")
async def stream_progress(job_id: str):
    queue = progress_emitter.register(job_id)

    async def event_generator():
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=60.0)
                except asyncio.TimeoutError:
                    yield "event: error\ndata: {\"stage\": \"Error\", \"message\": \"Timeout\"}\n\n"
                    break

                stage = event.get("stage", "")
                yield f"data: {json.dumps(event)}\n\n"

                if stage in ("Completed", "Error"):
                    break
        finally:
            progress_emitter.unregister(job_id)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
