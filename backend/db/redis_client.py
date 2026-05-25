import redis.asyncio as aioredis
from dotenv import load_dotenv
import os

load_dotenv()

redis_client = aioredis.from_url(
    os.getenv("REDIS_URL", "redis://localhost:6379"),
    decode_responses=True,
    socket_keepalive=True,
    health_check_interval=10,
)

SPEECH_QUEUE = "speech:doc_ids"
