from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class TaskBase(BaseModel):
    title: str = Field(..., max_length=255, description="Title of the task")
    description: Optional[str] = Field(None, description="Detailed description of the task")
    owner: str = Field("Unassigned", max_length=100, description="Owner of the task")
    due_date: Optional[str] = Field(None, max_length=100, description="Due date of the task")
    priority: str = Field("Medium", max_length=50, description="Priority level (e.g., High, Medium, Low)")
    status: str = Field("Pending", max_length=50, description="Status of the task")
    source_text: Optional[str] = Field(None, description="Source instruction text")

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    owner: Optional[str] = Field(None, max_length=100)
    due_date: Optional[str] = Field(None, max_length=100)
    priority: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, max_length=50)
    source_text: Optional[str] = None

class TaskRead(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TaskGenerationSchema(BaseModel):
    tasks: List[TaskCreate]

class TaskListSchema(BaseModel):
    tasks: List[TaskRead]
