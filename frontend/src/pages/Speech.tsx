import { useRef, useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { generateUniqueId } from "../utils/helper";
import { useParams, useNavigate } from "react-router-dom";

const MAX_SECONDS = 300;
const DEFAULT_SECONDS = 60;

function Speech() {
  const {topic } = useParams();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const navigate = useNavigate();
  const [totalSeconds, setTotalSeconds] = useState(DEFAULT_SECONDS);
  const [remaining, setRemaining] = useState(DEFAULT_SECONDS);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const addTime = () => {
    if (!recording && totalSeconds < MAX_SECONDS) {
      const next = Math.min(totalSeconds + 10, MAX_SECONDS);
      setTotalSeconds(next);
      setRemaining(next);
    }
  };

  const stopAndUpload = async (chunks: Blob[]) => {
    setRecording(false);
    setLoading(true);
    const audioBlob = new Blob(chunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("file", audioBlob, `${generateUniqueId()}.webm`);
    formData.append("topic", topic ?? "general");
    try {
      const res = await axios.post("http://127.0.0.1:8000/upload-audio", formData);
      navigate(`/result/${res.data.record_id}`, {
        state: { transcript: res.data.transcript, topic: topic ?? "general" },
      });
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);

      mediaRecorder.start();
      setRecording(true);
      setRemaining(totalSeconds);

      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            mediaRecorder.stop();
            stream.getTracks().forEach((t) => t.stop());
            // upload after onstop fires — handled via onstop below
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      mediaRecorder.onstop = () => stopAndUpload(audioChunksRef.current);
    } catch (err) {
      console.error(err);
    }
  };

  const stopEarly = () => {
    clearInterval(intervalRef.current!);
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
  };

  // cleanup on unmount
  useEffect(() => () => clearInterval(intervalRef.current!), []);

  const progress = remaining / totalSeconds;
  const circumference = 2 * Math.PI * 90;

  return (
    <div
      className="min-h-screen text-white font-['Outfit',sans-serif] overflow-x-hidden flex flex-col"
      style={{
        background:
          "linear-gradient(to bottom, #0d0a1a 0%, #12082a 12%, #1a0a2e 22%, #1f0f20 35%, #1c0c10 50%, #110a05 65%, #0f0c02 78%, #0a0e08 88%, #080d10 100%)",
        backgroundAttachment: "fixed",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;900&family=Playfair+Display:ital,wght@0,700;1,400&display=swap');
        .grain { position: fixed; inset: 0; pointer-events: none; z-index: 100;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.18; }
        .glow-amber { box-shadow: 0 0 40px rgba(251,191,36,0.25), 0 0 80px rgba(251,191,36,0.08); }
        .text-glow { text-shadow: 0 0 40px rgba(251,191,36,0.4); }
        .btn-primary { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); transition: all 0.3s ease; }
        .btn-primary:hover { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); box-shadow: 0 0 30px rgba(251,191,36,0.5); transform: translateY(-2px); }
        .card-glass { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); backdrop-filter: blur(12px); }
        .divider { background: linear-gradient(to right, transparent, rgba(251,191,36,0.35), transparent); }
        @keyframes ripple { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.6);opacity:0} }
        .ripple { animation: ripple 1.4s ease-out infinite; }
        .ripple2 { animation: ripple 1.4s ease-out 0.5s infinite; }
      `}</style>

      <div className="grain" />

      {/* Navbar */}
      <motion.nav
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between px-8 py-5 border-b border-white/5"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center">
            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">SpeechAnalyzer</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/50 font-medium">
          <a href="/" className="hover:text-amber-400 transition-colors">Home</a>
          <a href="#" className="text-amber-400">Speech</a>
        </div>
      </motion.nav>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 gap-10">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/20 bg-amber-400/5 text-amber-400 text-xs font-medium tracking-widest uppercase"
        >
          <span className={`w-1.5 h-1.5 rounded-full bg-amber-400 ${recording ? "animate-pulse" : ""}`} />
          {recording ? "Recording…" : "Speech Practice"}
        </motion.div>

        {/* Timer ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative flex items-center justify-center"
        >
          {/* Ripple rings when recording */}
          {recording && (
            <>
              <div className="ripple absolute w-52 h-52 rounded-full border border-amber-400/30" />
              <div className="ripple2 absolute w-52 h-52 rounded-full border border-amber-400/20" />
            </>
          )}

          <svg width="220" height="220" className="-rotate-90">
            {/* Track */}
            <circle cx="110" cy="110" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            {/* Progress */}
            <circle
              cx="110" cy="110" r="90"
              fill="none"
              stroke={remaining <= 10 ? "#ef4444" : "#f59e0b"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
            />
          </svg>

          {/* Time text */}
          <div className="absolute flex flex-col items-center gap-1">
            <span
              className="font-['Outfit'] font-bold text-glow"
              style={{ fontSize: "3.5rem", lineHeight: 1, color: remaining <= 10 ? "#ef4444" : "#fff" }}
            >
              {fmt(remaining)}
            </span>
            <span className="text-white/30 text-xs tracking-widest uppercase">
              {recording ? "remaining" : "duration"}
            </span>
          </div>
        </motion.div>

        {/* +10s button */}
        {!recording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="flex items-center gap-4"
          >
            <button
              onClick={addTime}
              disabled={totalSeconds >= MAX_SECONDS}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-amber-400/25 bg-amber-400/5 text-amber-400 text-sm font-semibold hover:bg-amber-400/15 hover:border-amber-400/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              +10s
            </button>
            <span className="text-white/25 text-xs">
              max {fmt(MAX_SECONDS)}
            </span>
          </motion.div>
        )}

        {/* Start / Stop button */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {!recording ? (
            <button
              onClick={startRecording}
              className="btn-primary glow-amber px-12 py-4 rounded-2xl text-black font-bold text-lg tracking-wide flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
              Start Recording
            </button>
          ) : (
            <button
              onClick={stopEarly}
              className="px-12 py-4 rounded-2xl border border-red-500/40 bg-red-500/10 text-red-400 font-bold text-lg tracking-wide hover:bg-red-500/20 transition-all flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Stop Early
            </button>
          )}
        </motion.div>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-white/40 text-sm">
            <svg className="w-4 h-4 animate-spin text-amber-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Uploading & transcribing…
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Speech;
