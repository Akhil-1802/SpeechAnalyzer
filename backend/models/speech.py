from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Optional


class SpeechRecord(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    topic: Optional[str] = None
    transcript: str
    score: Optional[float] = None
    summary: Optional[str] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
