import redis.asyncio as aioredis
from dotenv import load_dotenv
import os

load_dotenv()

redis_client = aioredis.from_url(
    os.getenv("REDIS_URL", "redis://localhost:6379"),
    decode_responses=True,
)

SPEECH_QUEUE = "speech:doc_ids"
