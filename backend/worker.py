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
        print(f"[worker] doc {doc_id} not found in MongoDB", flush=True)
        return

    print(f"[worker] processing doc_id={doc_id} | topic={doc.get('topic')}", flush=True)

    raw = await generate_response(doc.get("topic"), doc.get("transcript"))

    try:
        cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        result = json.loads(cleaned)
    except json.JSONDecodeError:
        print(f"[worker] could not parse JSON response: {raw}", flush=True)
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
    print(f"[worker] saved score={result.get('score')} for doc_id={doc_id}", flush=True)


async def queue_loop():
    print("[worker] checking Redis connection...", flush=True)
    try:
        await redis_client.ping()
        print("[worker] Redis connected OK", flush=True)
    except Exception as e:
        print(f"[worker] Redis FAILED: {e} | REDIS_URL={os.getenv('REDIS_URL', 'NOT SET')}", flush=True)
        return

    print(f"[worker] listening on '{SPEECH_QUEUE}' ...", flush=True)
    while True:
        try:
            item = await redis_client.brpop(SPEECH_QUEUE, timeout=5)
            if item:
                _, doc_id = item
                print(f"[worker] picked up doc_id={doc_id}", flush=True)
                await process(doc_id)
            else:
                print("[worker] heartbeat — queue empty", flush=True)
        except Exception as e:
            print(f"[worker] queue error: {e} — retrying in 3s", flush=True)
            await asyncio.sleep(3)


async def health(request):
    return web.Response(text="ok")


async def run_http():
    port = int(os.getenv("PORT", 10000))
    app = web.Application()
    app.router.add_get("/", health)
    app.router.add_get("/health", health)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    print(f"[worker] HTTP server on 0.0.0.0:{port}", flush=True)
    await asyncio.Event().wait()


async def main():
    print("[worker] starting...", flush=True)
    await asyncio.gather(
        queue_loop(),
        run_http(),
    )


if __name__ == "__main__":
    asyncio.run(main())
