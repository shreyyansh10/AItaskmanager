from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.database.base import engine, Base
from app.models.task import Task  # Import to register model metadata
import logging

# Setup standard logging
setup_logging()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    # Since this is a simple single-table SQLite database, we auto-create the tables on startup.
    # No Alembic migration setup is needed for this simple scaffolding.
    logger.info("Initializing database and creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized successfully.")
    yield
    # Shutdown: dispose of connection pool
    await engine.dispose()
    logger.info("Database engine connections disposed.")

app = FastAPI(title="AI Task Manager API", version="0.1.0", lifespan=lifespan)

# CORS Middleware config
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.routes import upload

@app.get("/health")
async def health_check():
    logger.info("Health check endpoint called")
    return {"status": "ok"}

# Register routes
app.include_router(upload.router)
