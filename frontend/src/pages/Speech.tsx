import { useRef, useState } from "react";
import axios from "axios";
import { generateUniqueId } from "../utils/helper";

function App() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [recording, setRecording] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const formData = new FormData();

        formData.append("file", audioBlob, `${generateUniqueId()}.webm`);

        await axios.post(
          "http://127.0.0.1:8000/upload-audio",
          formData
        );

        console.log("Audio uploaded");
      };

      mediaRecorder.start();

      setRecording(true);

    } catch (error) {
      console.error(error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div>
      <h1>AI Speech Analyzer</h1>

      {!recording ? (
        <button onClick={startRecording}>
          Start Recording
        </button>
      ) : (
        <button onClick={stopRecording}>
          Stop Recording
        </button>
      )}
    </div>
  );
}

export default App;