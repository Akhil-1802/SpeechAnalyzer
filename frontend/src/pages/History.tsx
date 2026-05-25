import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API_BASE from "../config";

interface SpeechEntry {
  id: string;
  topic: string;
  score: number;
  summary: string;
  feedback: string;
  transcript: string;
  created_at: string;
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;900&family=Playfair+Display:ital,wght@0,700;1,400&display=swap');
  .grain { position: fixed; inset: 0; pointer-events: none; z-index: 100;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.18; }
  .card-glass { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); backdrop-filter: blur(12px); }
  .divider { background: linear-gradient(to right, transparent, rgba(251,191,36,0.35), transparent); }
  .text-glow { text-shadow: 0 0 40px rgba(251,191,36,0.4); }
  .btn-primary { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); transition: all 0.3s ease; }
  .btn-primary:hover { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); box-shadow: 0 0 30px rgba(251,191,36,0.5); transform: translateY(-2px); }
`;

function scoreColor(s: number) {
  return s >= 7 ? "#22c55e" : s >= 4 ? "#f59e0b" : "#ef4444";
}
function scoreLabel(s: number) {
  return s >= 7 ? "Great" : s >= 4 ? "Fair" : "Needs Work";
}

function MiniRing({ score }: { score: number }) {
  const r = 22, circ = 2 * Math.PI * r;
  const color = scoreColor(score);
  return (
    <div className="relative flex items-center justify-center w-14 h-14 flex-shrink-0">
      <svg width="56" height="56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ - (score / 10) * circ}
          style={{ transition: "stroke-dashoffset 1s ease-out" }} />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

export default function History() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [speeches, setSpeeches] = useState<SpeechEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    axios.get(`${API_BASE}/history`, {
      headers: { Authorization: `Bearer ${user?.token}` },
    }).then(r => setSpeeches(r.data)).finally(() => setLoading(false));
  }, []);

  const avgScore = speeches.length
    ? (speeches.reduce((a, s) => a + s.score, 0) / speeches.length).toFixed(1)
    : null;

  return (
    <div
      className="min-h-screen text-white font-['Outfit',sans-serif] overflow-x-hidden"
      style={{ background: "linear-gradient(to bottom, #0d0a1a 0%, #12082a 12%, #1a0a2e 22%, #1f0f20 35%, #1c0c10 50%, #110a05 65%, #0f0c02 78%, #0a0e08 88%, #080d10 100%)", backgroundAttachment: "fixed" }}
    >
      <style>{STYLES}</style>
      <div className="grain" />

      {/* Navbar */}
      <motion.nav initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}
        className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center">
            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">SpeechAnalyzer</span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <button onClick={() => navigate("/")} className="text-white/40 hover:text-amber-400 transition-colors">Home</button>
          <span className="text-amber-400 font-medium">History</span>
          <button onClick={() => { logout(); navigate("/auth"); }}
            className="px-4 py-1.5 rounded-full border border-white/10 text-white/50 hover:border-red-400/50 hover:text-red-400 transition-all text-xs">
            Sign out
          </button>
        </div>
      </motion.nav>

      <div className="max-w-3xl mx-auto px-6 py-14 flex flex-col gap-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/20 bg-amber-400/5 text-amber-400 text-xs font-medium tracking-widest uppercase w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Past Speeches
          </div>
          <h1 className="font-['Playfair_Display',serif] text-4xl font-bold text-glow">Your Progress</h1>
          <p className="text-white/40 text-sm">Every session recorded — track how you improve over time.</p>
        </motion.div>

        {/* Stats bar */}
        {speeches.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="card-glass rounded-2xl p-6 flex gap-8">
            {[
              { label: "Total Sessions", value: speeches.length },
              { label: "Average Score", value: `${avgScore}/10` },
              { label: "Best Score", value: `${Math.max(...speeches.map(s => s.score))}/10` },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-amber-400">{stat.value}</span>
                <span className="text-white/30 text-xs tracking-wide">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center gap-3 text-white/30 text-sm">
            <svg className="w-4 h-4 animate-spin text-amber-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading your history…
          </div>
        ) : speeches.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-glass rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
            <svg className="w-12 h-12 text-white/10" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            <p className="text-white/30 text-sm">No speeches yet. Start practicing!</p>
            <button onClick={() => navigate("/")} className="btn-primary px-6 py-2.5 rounded-xl text-black font-semibold text-sm mt-2">
              Go Practice
            </button>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-4">
            {speeches.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                className="card-glass rounded-2xl overflow-hidden">
                {/* Row */}
                <button className="w-full p-5 flex items-center gap-5 text-left hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                  <MiniRing score={s.score} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-sm truncate">{s.topic ?? "Untitled"}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${scoreColor(s.score)}20`, color: scoreColor(s.score) }}>
                        {scoreLabel(s.score)}
                      </span>
                    </div>
                    <p className="text-white/35 text-xs mt-1 truncate">{s.summary}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-white/20 text-xs">
                      {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <svg className={`w-4 h-4 text-white/20 transition-transform ${expanded === s.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded */}
                <AnimatePresence>
                  {expanded === s.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }} className="overflow-hidden">
                      <div className="px-5 pb-6 flex flex-col gap-5 border-t border-white/5 pt-5">
                        {/* Transcript */}
                        <div className="flex flex-col gap-2">
                          <span className="text-amber-400 text-xs font-semibold tracking-widest uppercase">Transcript</span>
                          <p className="text-white/60 text-sm leading-7 font-light">{s.transcript}</p>
                        </div>
                        <div className="divider h-px w-full opacity-50" />
                        {/* Feedback */}
                        <div className="flex flex-col gap-2">
                          <span className="text-amber-400 text-xs font-semibold tracking-widest uppercase">Feedback</span>
                          <div className="flex flex-col gap-2">
                            {s.feedback?.split(/\n+/).filter(Boolean).map((line, j) => (
                              <div key={j} className="flex gap-3 items-start">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: scoreColor(s.score) }} />
                                <p className="text-white/60 text-sm leading-6 font-light">{line.replace(/^[-•*]\s*/, "")}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
