from pydantic import BaseModel, Field
from typing import Optional


class User(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    email: str
    password: str

    class Config:
        populate_by_name = True


class UserOut(BaseModel):
    id: str
    name: str
    email: str
