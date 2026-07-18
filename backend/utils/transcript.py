from faster_whisper import WhisperModel
model = WhisperModel("base", device="cpu", compute_type="int8")
def audioTotext(filePath : str) -> str:


    segments, info = model.transcribe(filePath)

    transcript = ""

    for segment in segments:
        transcript += segment.text + " "
    return transcript
