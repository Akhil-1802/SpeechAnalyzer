from faster_whisper import WhisperModel
from helper.model import generate_response
import asyncio
model = WhisperModel(
    "base",
    device="cpu",          # "cuda" if you have NVIDIA GPU
    compute_type="int8"    # good for CPU
)



segments, info = model.transcribe(
    "/home/akhil/TestYourSpeech/backend/uploads/mropoiw6-4sx2lk.webm",
    beam_size=5
)

print("Language:", info.language)
transcript = ""
for segment in segments:
    transcript += str(segment) + " "



