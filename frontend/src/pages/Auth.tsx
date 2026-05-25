import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API_BASE from "../config";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;900&family=Playfair+Display:ital,wght@0,700;1,400&display=swap');
  .grain { position: fixed; inset: 0; pointer-events: none; z-index: 100;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.18; }
  .card-glass { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); backdrop-filter: blur(12px); }
  .text-glow { text-shadow: 0 0 40px rgba(251,191,36,0.4); }
  .btn-primary { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); transition: all 0.3s ease; }
  .btn-primary:hover { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); box-shadow: 0 0 30px rgba(251,191,36,0.5); transform: translateY(-2px); }
  .input-field { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: white; transition: border-color 0.2s; }
  .input-field:focus { outline: none; border-color: rgba(251,191,36,0.5); }
  .input-field::placeholder { color: rgba(255,255,255,0.2); }
`;

export default function Auth() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const url = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login" ? { email, password } : { name, email, password };
      const res = await axios.post(`${API_BASE}${url}`, body);
      login({ name: res.data.name, email: res.data.email, token: res.data.token });
      navigate("/");
    } catch (e: any) {
      setError(e.response?.data?.detail ?? "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen text-white font-['Outfit',sans-serif] flex items-center justify-center px-6"
      style={{ background: "linear-gradient(to bottom, #0d0a1a 0%, #12082a 12%, #1a0a2e 22%, #1f0f20 35%, #1c0c10 50%, #110a05 65%, #0f0c02 78%, #0a0e08 88%, #080d10 100%)", backgroundAttachment: "fixed" }}
    >
      <style>{STYLES}</style>
      <div className="grain" />

      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="card-glass rounded-3xl p-10 w-full max-w-md flex flex-col gap-7"
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center">
            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">SpeechAnalyzer</span>
        </div>

        {/* Title */}
        <div>
          <h1 className="font-['Playfair_Display',serif] text-3xl font-bold text-glow">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {mode === "login" ? "Sign in to continue practicing" : "Start your speech journey"}
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-xl overflow-hidden border border-white/8 p-1 gap-1" style={{ background: "rgba(255,255,255,0.02)" }}>
          {(["login", "register"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === m ? "bg-amber-400 text-black" : "text-white/40 hover:text-white/70"}`}>
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4">
          <AnimatePresence>
            {mode === "register" && (
              <motion.input key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="input-field w-full px-4 py-3 rounded-xl text-sm" placeholder="Full name"
                value={name} onChange={e => setName(e.target.value)} />
            )}
          </AnimatePresence>
          <input className="input-field w-full px-4 py-3 rounded-xl text-sm" placeholder="Email address" type="email"
            value={email} onChange={e => setEmail(e.target.value)} />
          <input className="input-field w-full px-4 py-3 rounded-xl text-sm" placeholder="Password" type="password"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()} />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button onClick={submit} disabled={loading}
          className="btn-primary w-full py-3.5 rounded-xl text-black font-bold text-base tracking-wide disabled:opacity-60 disabled:cursor-not-allowed">
          {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </motion.div>
    </div>
  );
}
