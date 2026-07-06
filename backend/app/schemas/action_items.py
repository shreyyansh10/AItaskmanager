from pydantic import BaseModel
from typing import List

class ActionItem(BaseModel):
    sentence: str
    reason: str

class ActionItemsResponse(BaseModel):
    action_items: List[ActionItem]
