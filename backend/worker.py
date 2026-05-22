import asyncio
import sys
import os
import json

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
        # strip markdown code fences if present
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

async def main():
    print(f"[worker] listening on queue '{SPEECH_QUEUE}' ...")
    while True:
        # brpop blocks until an item is available (timeout=0 = forever)
        item = await redis_client.brpop(SPEECH_QUEUE, timeout=0)
        if item:
            _, doc_id = item
            try:
                await process(doc_id)
            except Exception as e:
                print(f"[worker] error processing {doc_id}: {e}")


if __name__ == "__main__":
    asyncio.run(main())
