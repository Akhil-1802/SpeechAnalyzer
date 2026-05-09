from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import shutil
import os

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
async def upload_audio(file: UploadFile = File(...)):

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    segments, info = model.transcribe(file_path)

    transcript = ""

    for segment in segments:
        transcript += segment.text + " "
    print(transcript)
    return {
        "message": "Audio uploaded successfully",
        "transcript": transcript
    }