from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
load_dotenv()
MONGO_URL = os.getenv("MONGODB_URI")

client = AsyncIOMotorClient(MONGO_URL)

database = client["Speech"]

speeches_collection = database["speeches"]
