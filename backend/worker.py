import asyncio
import sys
import os
import json
from aiohttp import web

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from bson import ObjectId
from db.redis_client import redis_client, SPEECH_QUEUE
from db.db import speeches_collection
from helper.model import generate_response


async def process(doc_id: str):
    doc = await speeches_collection.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        print(f"[worker] doc {doc_id} not found in MongoDB")
        return

    print(f"[worker] processing doc_id={doc_id} | topic={doc.get('topic')}")

    raw = await generate_response(doc.get("topic"), doc.get("transcript"))

    try:
        cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        result = json.loads(cleaned)
    except json.JSONDecodeError:
        print(f"[worker] could not parse JSON response: {raw}")
        return

    await speeches_collection.update_one(
        {"_id": ObjectId(doc_id)},
        {"$set": {
            "score": result.get("score"),
            "summary": result.get("summary"),
            "feedback": result.get("feedback"),
            "content_sufficiency": result.get("content_sufficiency"),
        }},
    )
    print(f"[worker] saved score={result.get('score')} for doc_id={doc_id}")


async def queue_loop():
    print("[worker] checking Redis connection...")
    try:
        await redis_client.ping()
        print("[worker] Redis connected OK")
    except Exception as e:
        print(f"[worker] Redis connection FAILED: {e}")
        print(f"[worker] REDIS_URL={os.getenv('REDIS_URL', 'NOT SET')}")
        return

    print(f"[worker] listening on queue '{SPEECH_QUEUE}' ...")
    while True:
        try:
            item = await redis_client.brpop(SPEECH_QUEUE, timeout=5)
            if item:
                _, doc_id = item
                print(f"[worker] picked up doc_id={doc_id}")
                try:
                    await process(doc_id)
                except Exception as e:
                    print(f"[worker] error processing {doc_id}: {e}")
            else:
                print("[worker] heartbeat — queue empty, waiting...")
        except Exception as e:
            print(f"[worker] queue error: {e} — reconnecting in 3s")
            await asyncio.sleep(3)


async def health(request):
    return web.Response(text="ok")


async def main():
    print("[worker] starting up...")
    asyncio.create_task(queue_loop())

    app = web.Application()
    app.router.add_get("/", health)
    app.router.add_get("/health", health)

    port = int(os.getenv("PORT", 8001))
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    print(f"[worker] health server on 0.0.0.0:{port}")

    await asyncio.Event().wait()


if __name__ == "__main__":
    asyncio.run(main())
