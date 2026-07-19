from faster_whisper import WhisperModel
import os
model = None

def audioTotext(filePath: str):
    global model

    if model is None:
        model = WhisperModel("tiny.en", device="cpu", compute_type="int8")

    segments, info = model.transcribe(filePath)

    print("Language:", info.language)
    print("Probability:", info.language_probability)

    transcript = ""
    print("File size:", os.path.getsize(filePath))
    for segment in segments:
        print(segment.start, segment.end, repr(segment.text))
        transcript += segment.text + " "

    print("Final transcript:", repr(transcript))

    return transcript