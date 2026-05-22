from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
from dotenv import load_dotenv
from db.db import speeches_collection
from db.redis_client import redis_client, SPEECH_QUEUE
from models.speech import SpeechRecord
import shutil
import os

load_dotenv()
app = FastAPI()

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
model = WhisperModel("base")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload-audio")
async def upload_audio(
    file: UploadFile = File(...),
    topic: str = Form(default=None),
):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    segments, _ = model.transcribe(file_path)
    transcript = "".join(segment.text for segment in segments).strip()

    record = SpeechRecord(transcript=transcript, topic=topic)
    result = await speeches_collection.insert_one(
        record.model_dump(exclude={"id"}, by_alias=False)
    )
    doc_id = str(result.inserted_id)
    await redis_client.lpush(SPEECH_QUEUE, doc_id)

    return {
        "message": "Audio uploaded successfully",
        "transcript": transcript,
        "record_id": doc_id,
    }