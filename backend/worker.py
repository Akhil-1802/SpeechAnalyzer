import asyncio
import sys
import os
import json
from aiohttp import web

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from bson import ObjectId
from db.db import speeches_collection
from helper.model import generate_response


async def process(doc: dict):
    doc_id = str(doc["_id"])
    print(f"[worker] processing doc_id={doc_id} | topic={doc.get('topic')}", flush=True)

    raw = await generate_response(doc.get("topic"), doc.get("transcript"))
    print(f"[worker] raw response: {raw[:200]}", flush=True)

    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start == -1 or end == 0:
        print(f"[worker] no JSON found in response, storing raw feedback", flush=True)
        await speeches_collection.update_one(
            {"_id": doc["_id"]},
            {"$set": {"score": 1, "summary": "Could not parse AI response", "feedback": raw}},
        )
        return

    try:
        result = json.loads(raw[start:end])
    except json.JSONDecodeError as e:
        print(f"[worker] JSON parse error: {e}", flush=True)
        await speeches_collection.update_one(
            {"_id": doc["_id"]},
            {"$set": {"score": 1, "summary": "Could not parse AI response", "feedback": raw}},
        )
        return
    score = result.get("score", 1)
    # Ensure score is never None or -1 (reserved values)
    if score is None or score < 0:
        score = 1

    await speeches_collection.update_one(
        {"_id": doc["_id"]},
        {"$set": {
            "score": score,
            "summary": result.get("summary", ""),
            "feedback": result.get("feedback", ""),
            "content_sufficiency": result.get("content_sufficiency", ""),
        }},
    )
    print(f"[worker] done — score={score} for doc_id={doc_id}", flush=True)


async def poll_loop():
    print("[worker] poll loop started", flush=True)
    while True:
        try:
            doc = await speeches_collection.find_one({
                "transcript": {"$exists": True, "$ne": ""},
                "score": None,
            })

            if doc:
                # Claim it atomically
                res = await speeches_collection.update_one(
                    {"_id": doc["_id"], "score": None},
                    {"$set": {"score": -1}},
                )
                if res.modified_count == 1:
                    try:
                        await process(doc)
                    except Exception as e:
                        print(f"[worker] error: {e}", flush=True)
                        await speeches_collection.update_one(
                            {"_id": doc["_id"], "score": -1},
                            {"$set": {"score": None}},
                        )
            else:
                print("[worker] heartbeat — no pending docs", flush=True)
                await asyncio.sleep(5)

        except Exception as e:
            print(f"[worker] poll error: {e}", flush=True)
            await asyncio.sleep(5)


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
    await asyncio.gather(poll_loop(), run_http())


if __name__ == "__main__":
    asyncio.run(main())
