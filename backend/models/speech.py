from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Optional
from datetime import datetime


class SpeechRecord(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: Optional[str] = None
    topic: Optional[str] = None
    transcript: str
    score: Optional[float] = None
    summary: Optional[str] = None
    feedback: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
