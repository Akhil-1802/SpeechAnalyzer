import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const SUMMARY_API = 'https://en.wikipedia.org/api/rest_v1/page/random/summary'

interface Topic{
        title: string | null
        description: string | null
        intro: string
        sections: string[]
        url: string
        thumbnail: string | null
        wordCount: number
}
// Strip wiki markup/HTML tags from section text
function stripMarkup(text = '') {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, '$2')
    .replace(/={2,}[^=]+=*={2,}/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function Home() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [loading, setLoading] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const fetchRandomTopic = async () => {
    setLoading(true)
    setRevealed(false)
    setTopic(null)
    try {
      // Step 1: get a random page title + thumbnail + short description
      const summaryRes = await fetch(SUMMARY_API)
      const summary = await summaryRes.json()
      const title = summary.title

      // Step 2: fetch full page sections via the MW action API
      const sectionsRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true&titles=${encodeURIComponent(title)}&format=json&origin=*`
      )
      const sectionsData = await sectionsRes.json()
      const pages = sectionsData.query?.pages || {}
      const page = Object.values(pages)[0] as { extract?: string } | undefined
      const fullText = page?.extract || (summary as { extract?: string }).extract || ''

      // Split into paragraphs, filter blanks, take enough for ~600+ words
      const paragraphs = fullText
        .split('\n')
        .map((p : string) => stripMarkup(p))
        .filter((p:string) => p.length > 60)

      // Build sections: intro = first 3 paragraphs, then chunk rest into named sections
      const intro = paragraphs.slice(0, 3).join('\n\n')
      const rest = paragraphs.slice(3)

      // Group remaining paragraphs into pseudo-sections of 3 each
      const sections = []
      for (let i = 0; i < rest.length && sections.length < 4; i += 3) {
        const chunk = rest.slice(i, i + 3).join('\n\n')
        if (chunk.trim()) sections.push(chunk)
      }

      setTopic({
        title: summary.title,
        description: summary.description || '',
        intro,
        sections,
        url: summary.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
        thumbnail: summary.thumbnail?.source || null,
        wordCount: fullText.split(/\s+/).filter(Boolean).length,
      })
      setRevealed(true)
    } catch (e) {
      setTopic({
        title: 'Error', description: '', intro: 'Failed to fetch topic. Please try again.',
        sections: [], url: '#', thumbnail: null, wordCount: 0,
      })
      setRevealed(true)
    }
    setLoading(false)
  }

  const handleClick = (mode: 'speech' | 'typing') => {
    navigate(`/${mode}/${topic?.title}`)
  }

  return (
    <div className="min-h-screen text-white font-['Outfit',sans-serif] overflow-x-hidden" style={{background: 'linear-gradient(to bottom, #0d0a1a 0%, #12082a 12%, #1a0a2e 22%, #1f0f20 35%, #1c0c10 50%, #110a05 65%, #0f0c02 78%, #0a0e08 88%, #080d10 100%)', backgroundAttachment: 'fixed'}}>
      {/* Import fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;900&family=Playfair+Display:ital,wght@0,700;1,400&display=swap');

        .grain {
          position: fixed; inset: 0; pointer-events: none; z-index: 100;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.18;
        }
        .glow-amber { box-shadow: 0 0 40px rgba(251,191,36,0.25), 0 0 80px rgba(251,191,36,0.08); }
        .glow-violet { box-shadow: 0 0 40px rgba(167,139,250,0.2), 0 0 80px rgba(167,139,250,0.07); }
        .text-glow { text-shadow: 0 0 40px rgba(251,191,36,0.4); }
        .btn-primary {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          transition: all 0.3s ease;
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          box-shadow: 0 0 30px rgba(251,191,36,0.5);
          transform: translateY(-2px);
        }
        .card-glass {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(12px);
        }
        .divider { background: linear-gradient(to right, transparent, rgba(251,191,36,0.35), transparent); }
        .loading-dot { animation: pulse 1.2s ease-in-out infinite; }
        .loading-dot:nth-child(2) { animation-delay: 0.2s; }
        .loading-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
        .shine { position: relative; overflow: hidden; }
        .shine::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%);
          transform: translateX(-100%); transition: transform 0.6s ease;
        }
        .shine:hover::after { transform: translateX(100%); }
      `}</style>

      <div className="grain" />

      {/* ─── SECTION 1 — NAVBAR + HERO ─── */}
      <section className="relative min-h-screen flex flex-col">
        {/* Navbar */}
        <motion.nav
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex items-center justify-between px-8 py-5 border-b border-white/5"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center">
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd"/>
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight">SpeechAnalyzer</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/50 font-medium">
            <a href="#" className="hover:text-amber-400 transition-colors">Explore</a>
            <a href="#" className="hover:text-amber-400 transition-colors">Practice</a>
            {user ? (
              <>
                <button onClick={() => navigate('/history')} className="hover:text-amber-400 transition-colors">History</button>
                <span className="text-white/30 text-xs">Hi, {user.name.split(' ')[0]}</span>
                <button onClick={() => { logout(); navigate('/'); }}
                  className="px-4 py-2 rounded-full border border-white/10 hover:border-red-400/50 hover:text-red-400 transition-all text-white/70 text-xs">
                  Sign out
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/auth')}
                className="px-4 py-2 rounded-full border border-white/10 hover:border-amber-400/50 hover:text-white transition-all text-white/70">
                Sign in
              </button>
            )}
          </div>
        </motion.nav>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/20 bg-amber-400/5 text-amber-400 text-xs font-medium tracking-widest uppercase"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            AI-Powered Practice
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8, ease: 'easeOut' }}
            className="font-['Playfair_Display',serif] text-6xl md:text-8xl font-bold leading-none text-glow"
          >
            Speech<br />
            <span className="italic text-amber-400">Analyzer</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="max-w-xl text-white/50 text-lg leading-relaxed font-light"
          >
            Sharpen your voice and vocabulary with real-world topics. Generate any subject at random, 
            then practice speaking or typing to build fluency and confidence.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex gap-6 text-sm text-white/30"
          >
            {['10K+ Topics', 'Speech Practice', 'Typing Drills'].map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-amber-400/50" />{item}
              </span>
            ))}
          </motion.div>
        </div>

        {/* scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="pb-8 flex justify-center"
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}
            className="w-6 h-10 rounded-full border border-white/10 flex items-start justify-center pt-2">
            <div className="w-1 h-2 rounded-full bg-amber-400/60" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── SECTION 2 — RANDOM TOPIC BUTTON ─── */}
      <section className="relative py-28 flex flex-col items-center gap-10 px-6">
        <div className="divider h-px w-full max-w-2xl mb-4" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold mb-3 tracking-tight">Discover Your Next Topic</h2>
          <p className="text-white/40 text-base max-w-md mx-auto">
            Hit the button and let the universe pick your practice material — sourced live from Wikipedia.
          </p>
        </motion.div>

        <motion.button
          onClick={fetchRandomTopic}
          disabled={loading}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.04 }}
          className="btn-primary shine relative px-10 py-5 rounded-2xl text-black font-bold text-lg tracking-wide glow-amber disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <span className="flex gap-1">
                <span className="loading-dot w-2 h-2 rounded-full bg-black/60 inline-block" />
                <span className="loading-dot w-2 h-2 rounded-full bg-black/60 inline-block" />
                <span className="loading-dot w-2 h-2 rounded-full bg-black/60 inline-block" />
              </span>
              Fetching topic…
            </span>
          ) : (
            <span className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Generate Random Topic
            </span>
          )}
        </motion.button>

        {!revealed && !loading && (
          <p className="text-white/20 text-sm italic">No topic generated yet — press the button above!</p>
        )}
      </section>

      {/* ─── SECTION 3 — TOPIC CONTENT ─── */}
      <AnimatePresence>
        {revealed && topic && (
          <motion.section
            key={topic.title}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="px-6 pb-16 flex justify-center"
          >
            <div className="card-glass rounded-3xl max-w-3xl w-full p-8 md:p-12 flex flex-col gap-8">

              {/* Thumbnail */}
              {topic.thumbnail && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-full h-64 rounded-xl overflow-hidden"
                >
                  <img src={topic.thumbnail} alt={topic.title!} className="w-full h-full object-cover" />
                </motion.div>
              )}

              {/* Header */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-amber-400 text-xs font-semibold tracking-widest uppercase">Wikipedia · Random</span>
                  {topic.wordCount > 0 && (
                    <span className="text-white/30 text-xs px-3 py-1 rounded-full border border-white/10">
                      ~{topic.wordCount.toLocaleString()} words in full article
                    </span>
                  )}
                </div>
                <h3 className="font-['Playfair_Display',serif] text-3xl md:text-4xl font-bold leading-tight">
                  {topic.title}
                </h3>
                {topic.description && (
                  <p className="text-white/40 text-sm italic">{topic.description}</p>
                )}
              </div>

              <div className="divider h-px w-full" />

              {/* Intro paragraphs */}
              {topic.intro && (
                <div className="flex flex-col gap-4">
                  <h4 className="text-amber-400/70 text-xs font-semibold tracking-widest uppercase">Overview</h4>
                  {topic.intro.split('\n\n').map((para, i) => (
                    <p key={i} className="text-white/75 text-base leading-8 font-light tracking-wide">
                      {para}
                    </p>
                  ))}
                </div>
              )}

              {/* Extended sections */}
              {topic.sections.map((section, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 * (idx + 1) }}
                  className="flex flex-col gap-4"
                >
                  <div className="divider h-px w-full opacity-50" />
                  <h4 className="text-amber-400/70 text-xs font-semibold tracking-widest uppercase">
                    {['Background', 'Details', 'Context', 'Further Information'][idx] || `Section ${idx + 1}`}
                  </h4>
                  {section.split('\n\n').map((para, j) => (
                    <p key={j} className="text-white/65 text-base leading-8 font-light tracking-wide">
                      {para}
                    </p>
                  ))}
                </motion.div>
              ))}

              {/* Read more link */}
              <div className="divider h-px w-full opacity-40" />
              <a
                href={topic.url}
                target="_blank"
                rel="noopener noreferrer"
                className="self-start text-amber-400 text-sm font-medium hover:underline flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity"
              >
                Read the full article on Wikipedia
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ─── SECTION 4 — PRACTICE BUTTONS + FOOTER ─── */}
      <AnimatePresence>
        {revealed && topic && (
          <motion.section
            key="practice"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="px-6 pb-32 flex flex-col items-center gap-10"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Ready to Practice?</h2>
              <p className="text-white/40 text-sm max-w-sm mx-auto">Choose your mode — speak it aloud or type it out. Both build real fluency.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
              {/* Speech Button */}
              <motion.button
              onClick={() => handleClick('speech')}
                whileHover={{ scale: 1.04, y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="shine flex-1 flex flex-col items-center gap-3 px-8 py-8 rounded-2xl border border-amber-400/25 bg-amber-400/5 hover:bg-amber-400/10 hover:border-amber-400/50 transition-all group glow-amber"
              >
                <div className="w-14 h-14 rounded-xl bg-amber-400/15 flex items-center justify-center group-hover:bg-amber-400/25 transition-colors">
                  <svg className="w-7 h-7 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-white text-base">Practice Your Speech</div>
                  <div className="text-white/40 text-xs mt-1">Read aloud & get analyzed</div>
                </div>
              </motion.button>

              {/* Typing Button */}
              <motion.button
                onClick={() => handleClick('typing')}
                whileHover={{ scale: 1.04, y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="shine flex-1 flex flex-col items-center gap-3 px-8 py-8 rounded-2xl border border-violet-400/25 bg-violet-400/5 hover:bg-violet-400/10 hover:border-violet-400/50 transition-all group glow-violet"
              >
                <div className="w-14 h-14 rounded-xl bg-violet-400/15 flex items-center justify-center group-hover:bg-violet-400/25 transition-colors">
                  <svg className="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-white text-base">Practice Your Typing</div>
                  <div className="text-white/40 text-xs mt-1">Type the passage with speed</div>
                </div>
              </motion.button>
            </div>

            {/* Footer */}
            <div className="divider h-px w-full max-w-2xl mt-8" />
            <footer className="flex flex-col md:flex-row items-center justify-between gap-4 w-full max-w-2xl text-white/25 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-amber-400 flex items-center justify-center">
                  <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span>SpeechAnalyzer © 2025</span>
              </div>
              <div className="flex gap-6">
                <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
                <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
                <a href="#" className="hover:text-white/60 transition-colors">Contact</a>
              </div>
            </footer>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Home