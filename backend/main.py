from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from bson import ObjectId
from pydantic import BaseModel
from db.db import speeches_collection, users_collection
from models.speech import SpeechRecord
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from auth import hash_password, verify_password, create_token, get_current_user
import asyncio, shutil, os
from utils.transcript import audioTotext
from helper.model import generate_response

load_dotenv()
app = FastAPI()

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/")
@app.head("/")
async def root():
    return {"status": "ok"}


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterBody(BaseModel):
    name: str
    email: str
    password: str

class LoginBody(BaseModel):
    email: str
    password: str

@app.get("/health")
def healthcheck(request:Request):
    return {"status":"ok"}
@app.post("/auth/register", status_code=201)
@limiter.limit("5/minute")
async def register(request: Request, body: RegisterBody):
    if await users_collection.find_one({"email": body.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    result = await users_collection.insert_one({
        "name": body.name,
        "email": body.email,
        "password": hash_password(body.password),
    })
    token = create_token(str(result.inserted_id))
    return {"token": token, "name": body.name, "email": body.email}


@app.post("/auth/login")
@limiter.limit("10/minute")
async def login(request: Request, body: LoginBody):
    user = await users_collection.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(str(user["_id"]))
    return {"token": token, "name": user["name"], "email": user["email"]}


# ── Audio upload ──────────────────────────────────────────────────────────────

async def delete_after_delay(path: str, delay: int = 300):
    await asyncio.sleep(delay)
    try:
        os.remove(path)
    except FileNotFoundError:
        pass


@app.post("/upload-audio")
@limiter.limit("5/minute")
async def upload_audio(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    topic: str = Form(default=None),
    current_user: dict = Depends(get_current_user),
):

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)


    background_tasks.add_task(delete_after_delay, file_path)

    transcript = audioTotext(file_path)
    result = await generate_response(topic, transcript)

    record = SpeechRecord(
        transcript=transcript,
        topic=topic,
        user_id=current_user["id"],
        score=result["score"],
        summary=result["summary"],
        feedback=result["feedback"],
    )


    final_result = await speeches_collection.insert_one(
        record.model_dump(exclude={"id"}, by_alias=False)
    )


    return {
        "message": "Audio uploaded successfully",
        "record_id": str(final_result.inserted_id),
    }


# ── Result polling ────────────────────────────────────────────────────────────

@app.get("/result/{record_id}")
@limiter.limit("30/minute")
async def get_result(request: Request, record_id: str, current_user: dict = Depends(get_current_user)):
    doc = await speeches_collection.find_one({"_id": ObjectId(record_id)})
    if not doc:
        print(f"[result] doc {record_id} not found")
        return {"ready": False}
    score = doc.get("score")
    print(f"[result] doc {record_id} score={score}")
    if score is None or score == -1:
        return {"ready": False}
    return {
        "ready": True,
        "transcript": doc.get("transcript"),
        "score": score,
        "summary": doc.get("summary"),
        "feedback": doc.get("feedback"),
        "topic": doc.get("topic"),
    }


# ── History ───────────────────────────────────────────────────────────────────

@app.get("/history")
@limiter.limit("10/minute")
async def get_history(request: Request, current_user: dict = Depends(get_current_user)):
    cursor = speeches_collection.find(
        {"user_id": current_user["id"], "score": {"$ne": None}},
        {"transcript": 1, "topic": 1, "score": 1, "summary": 1, "feedback": 1, "created_at": 1}
    ).sort("created_at", -1)
    docs = await cursor.to_list(length=50)
    return [
        {
            "id": str(d["_id"]),
            "topic": d.get("topic"),
            "score": d.get("score"),
            "summary": d.get("summary"),
            "feedback": d.get("feedback"),
            "transcript": d.get("transcript"),
            "created_at": d.get("created_at").isoformat() if d.get("created_at") else None,
        }
        for d in docs
    ]
