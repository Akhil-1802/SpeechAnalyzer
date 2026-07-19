from faster_whisper import WhisperModel

model = None

def audioTotext(filePath: str):
    global model

    if model is None:
        model = WhisperModel("tiny.en", device="cpu", compute_type="int8")

    segments, info = model.transcribe(filePath)

    transcript = ""
    for segment in segments:
        transcript += segment.text + " "

    return transcript
