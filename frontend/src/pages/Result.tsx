import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

interface Result {
  transcript: string;
  score: number;
  summary: string;
  feedback: string;
  topic: string;
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;900&family=Playfair+Display:ital,wght@0,700;1,400&display=swap');
  .grain { position: fixed; inset: 0; pointer-events: none; z-index: 100;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.18; }
  .card-glass { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); backdrop-filter: blur(12px); }
  .divider { background: linear-gradient(to right, transparent, rgba(251,191,36,0.35), transparent); }
  .text-glow { text-shadow: 0 0 40px rgba(251,191,36,0.4); }
  .glow-amber { box-shadow: 0 0 40px rgba(251,191,36,0.2), 0 0 80px rgba(251,191,36,0.07); }
  .btn-primary { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); transition: all 0.3s ease; }
  .btn-primary:hover { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); box-shadow: 0 0 30px rgba(251,191,36,0.5); transform: translateY(-2px); }
  @keyframes spin-slow { to { transform: rotate(360deg); } }
  .spin-slow { animation: spin-slow 2s linear infinite; }
  @keyframes score-fill { from { stroke-dashoffset: 283; } }
`;

function ScoreRing({ score }: { score: number }) {
  const r = 45;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 10) * circ;
  const color = score >= 7 ? "#22c55e" : score >= 4 ? "#f59e0b" : "#ef4444";
  const label = score >= 7 ? "Great" : score >= 4 ? "Fair" : "Needs Work";

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="120" height="120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s ease-out", animation: "score-fill 1.2s ease-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center" style={{ marginTop: "32px" }}>
        <span className="font-bold text-3xl" style={{ color }}>{score}</span>
        <span className="text-white/30 text-xs">/10</span>
      </div>
      <span className="text-xs font-semibold tracking-widest uppercase" style={{ color }}>{label}</span>
    </div>
  );
}

function AnalysisCard({ icon, label, children, delay = 0 }: { icon: React.ReactNode; label: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="card-glass rounded-2xl p-6 flex flex-col gap-3"
    >
      <div className="flex items-center gap-2">
        <span className="text-amber-400">{icon}</span>
        <span className="text-amber-400 text-xs font-semibold tracking-widest uppercase">{label}</span>
      </div>
      <div className="divider h-px w-full opacity-60" />
      {children}
    </motion.div>
  );
}

export default function Result() {
  const { record_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { transcript: initialTranscript, topic } = (location.state ?? {}) as { transcript?: string; topic?: string };

  const [result, setResult] = useState<Result | null>(null);
  const [dots, setDots] = useState(".");

  // Animate waiting dots
  useEffect(() => {
    if (result) return;
    const t = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 500);
    return () => clearInterval(t);
  }, [result]);

  // Poll backend every 3s until worker is done
  useEffect(() => {
    if (!record_id) return;
    const poll = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/result/${record_id}`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        if (res.data.ready) {
          setResult(res.data);
        }
      } catch { /* keep polling */ }
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [record_id]);

  const scoreColor = result
    ? result.score >= 7 ? "#22c55e" : result.score >= 4 ? "#f59e0b" : "#ef4444"
    : "#f59e0b";

  return (
    <div
      className="min-h-screen text-white font-['Outfit',sans-serif] overflow-x-hidden"
      style={{
        background: "linear-gradient(to bottom, #0d0a1a 0%, #12082a 12%, #1a0a2e 22%, #1f0f20 35%, #1c0c10 50%, #110a05 65%, #0f0c02 78%, #0a0e08 88%, #080d10 100%)",
        backgroundAttachment: "fixed",
      }}
    >
      <style>{STYLES}</style>
      <div className="grain" />

      {/* Navbar */}
      <motion.nav
        initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}
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
        <button onClick={() => navigate("/")} className="text-sm text-white/40 hover:text-amber-400 transition-colors">
          ← Back to Home
        </button>
      </motion.nav>

      <div className="max-w-3xl mx-auto px-6 py-14 flex flex-col gap-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/20 bg-amber-400/5 text-amber-400 text-xs font-medium tracking-widest uppercase w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Speech Analysis
          </div>
          <h1 className="font-['Playfair_Display',serif] text-4xl font-bold text-glow leading-tight">
            {topic ?? "Your Speech"}
          </h1>
        </motion.div>

        {/* Transcript — shown immediately */}
        {initialTranscript && (
          <AnalysisCard delay={0.2} label="Your Transcript" icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }>
            <p className="text-white/70 text-base leading-8 font-light">{initialTranscript}</p>
          </AnalysisCard>
        )}

        {/* Waiting state */}
        <AnimatePresence>
          {!result && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="card-glass rounded-2xl p-8 flex flex-col items-center gap-5"
            >
              <svg className="w-10 h-10 spin-slow text-amber-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <div className="text-center">
                <p className="text-white/70 font-medium">Analyzing your speech{dots}</p>
                <p className="text-white/30 text-sm mt-1">Our AI is reviewing your transcript</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">

              {/* Score + Summary row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="card-glass rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-8 glow-amber"
              >
                <div className="relative flex flex-col items-center">
                  <ScoreRing score={result.score} />
                </div>
                <div className="flex flex-col gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-xs font-semibold tracking-widest uppercase">Overall Score</span>
                  </div>
                  <div className="divider h-px w-full opacity-60" />
                  <p className="text-white/70 text-sm leading-7 font-light">{result.summary}</p>
                </div>
              </motion.div>

              {/* Feedback */}
              <AnalysisCard delay={0.2} label="Detailed Feedback" icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              }>
                <div className="flex flex-col gap-3">
                  {result.feedback.split(/\n+/).filter(Boolean).map((line, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: scoreColor }} />
                      <p className="text-white/70 text-sm leading-7 font-light">{line.replace(/^[-•*]\s*/, "")}</p>
                    </div>
                  ))}
                </div>
              </AnalysisCard>

              {/* Try again */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="flex justify-center pt-2"
              >
                <button
                  onClick={() => navigate(-1)}
                  className="btn-primary px-10 py-3.5 rounded-2xl text-black font-bold text-base tracking-wide flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  Try Again
                </button>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
