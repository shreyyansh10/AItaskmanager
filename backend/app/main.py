from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.database.base import engine, Base
from app.models.task import Task  # Import to register model metadata
from app.utils.text_extraction import UnsupportedFileTypeError
from app.services.task_service import TaskGenerationError
from app.services.llm_manager import AllProvidersFailedError
import logging

setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database and creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized successfully.")
    yield
    await engine.dispose()
    logger.info("Database engine connections disposed.")


app = FastAPI(title="AI Task Manager API", version="0.1.0", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handlers
@app.exception_handler(UnsupportedFileTypeError)
async def unsupported_file_type_handler(request: Request, exc: UnsupportedFileTypeError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.exception_handler(TaskGenerationError)
async def task_generation_error_handler(request: Request, exc: TaskGenerationError):
    return JSONResponse(status_code=500, content={"detail": str(exc)})


@app.exception_handler(AllProvidersFailedError)
async def all_providers_failed_handler(request: Request, exc: AllProvidersFailedError):
    return JSONResponse(status_code=502, content={"detail": str(exc)})


# Routes
from app.api.routes import upload
from app.api.routes import progress
from app.api.routes import generate
from app.api.routes import tasks
from app.api.routes import export

app.include_router(upload.router)
app.include_router(progress.router)
# Export must be registered before tasks to avoid /tasks/export/json being shadowed by /tasks/{task_id}
app.include_router(export.router)
app.include_router(tasks.router)
app.include_router(generate.router)


@app.get("/health")
async def health_check():
    logger.info("Health check endpoint called")
    return {"status": "ok"}
