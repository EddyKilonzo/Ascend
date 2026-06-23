'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const MESSAGES = [
  { role: 'maya', text: "You've been most productive on Tuesdays and Thursdays. Want me to protect those blocks for deep work?" },
  { role: 'user', text: "Yes, and also block mornings until 10am for focus." },
  { role: 'maya', text: "Done. I've blocked 8–10am as Focus Hours, Mon–Fri. Notifications silenced, calendar cleared. Your streak continues." },
  { role: 'user', text: "What's my completion rate looking like?" },
  { role: 'maya', text: "83% this week — up from 71% last week. You're trending toward your best month ever. Keep going." },
]

function Waveform({ active }: { active: boolean }) {
  const bars = [2, 5, 9, 13, 10, 16, 12, 8, 14, 11, 7, 5, 3]
  return (
    <div className="flex items-center gap-[2px]" style={{ height: 20 }}>
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{ width: 2.5, background: active ? '#428475' : 'var(--border)' }}
          animate={active ? { height: [h, h * 2, h, h * 0.6, h] } : { height: 3 }}
          transition={{ duration: 1.2, repeat: active ? Infinity : 0, delay: i * 0.06, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

const CAPABILITIES = [
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    title: 'Pattern Recognition',
    desc: 'Learns your peak hours, energy cycles, and behavior patterns over time.',
  },
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>,
    title: 'Proactive Planning',
    desc: 'Automatically restructures your day when priorities shift.',
  },
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
    title: 'Progress Intelligence',
    desc: 'Tracks what works, surfaces insights, predicts your next breakthrough.',
  },
  {
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>,
    title: 'Natural Conversation',
    desc: 'Talk to Maya like a coach — ask anything, get personalized answers instantly.',
  },
]

export default function MayaSection() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [visibleCount, setVisibleCount] = useState(0)
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    if (!inView) return
    let i = 0
    const next = () => {
      if (i >= MESSAGES.length) return
      setVisibleCount(++i)
      setSpeaking(MESSAGES[i - 1].role === 'maya')
      const timeout = setTimeout(() => setSpeaking(false), 1800)
      if (i < MESSAGES.length) setTimeout(next, 1600 + i * 180)
      return timeout
    }
    const t = setTimeout(next, 600)
    return () => clearTimeout(t)
  }, [inView])

  return (
    <section ref={ref} id="maya" className="py-28 px-6 md:px-10 lg:px-16 relative overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
      {/* Hex texture */}
      <div className="absolute inset-0 pointer-events-none hex-bg" style={{ opacity: 0.35 }} aria-hidden />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 70% 50%, rgba(66,132,117,0.06) 0%, transparent 70%)' }} />
      <div className="max-w-[1200px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: copy */}
          <motion.div initial={{ opacity: 0, x: -40 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8, ease: EASE }}>
            <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] mb-4 px-3 py-1.5 rounded-full" style={{ color: 'var(--primary)', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              Meet Maya
            </span>
            <h2 className="text-[clamp(32px,4vw,52px)] font-bold tracking-[-0.03em] leading-[1.08] mb-5" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
              Your AI coach that<br /><span className="text-gradient-teal">never clocks out.</span>
            </h2>
            <p className="text-[16.5px] leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
              Maya is the world's most advanced personal AI coach. She understands context, remembers your history, and helps you make smarter decisions about your time and energy every single day.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {CAPABILITIES.map(({ icon, title, desc }, i) => (
                <motion.div key={title}
                  initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.08, ease: EASE }}
                  className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: 'rgba(66,132,117,0.08)', color: '#428475' }}>{icon}</div>
                  <p className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text)' }}>{title}</p>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-faint)' }}>{desc}</p>
                </motion.div>
              ))}
            </div>
            <motion.a href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #428475, #1A312C)', boxShadow: '0 4px 20px rgba(66,132,117,0.3)' }}
              whileHover={{ scale: 1.03, boxShadow: '0 8px 32px rgba(66,132,117,0.45)' }} whileTap={{ scale: 0.97 }}
            >
              Try Maya Free
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </motion.a>
          </motion.div>

          {/* Right: chat window */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}>
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset' }}>
              <div className="flex items-center gap-3 px-5 py-4" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #428475, #1A312C)' }}>M</div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#2D8C5A]" style={{ border: '2px solid var(--bg-secondary)' }} />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Maya</p>
                  <div className="flex items-center gap-1.5">
                    <Waveform active={speaking} />
                    <span className="text-[11px]" style={{ color: 'var(--primary)' }}>{speaking ? 'Speaking...' : 'AI Coach · Online'}</span>
                  </div>
                </div>
                <span className="pill pill-green text-[10px]">Live</span>
              </div>

              <div className="p-5 flex flex-col gap-3 overflow-hidden" style={{ minHeight: 340 }}>
                <AnimatePresence>
                  {MESSAGES.slice(0, visibleCount).map(({ role, text }, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, ease: EASE }}
                      className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {role === 'maya' && (
                        <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold mr-2 mt-0.5" style={{ background: 'linear-gradient(135deg, #428475, #1A312C)' }}>M</div>
                      )}
                      <div className="max-w-[82%] text-[13px] leading-relaxed px-4 py-2.5"
                        style={{ background: role === 'maya' ? 'rgba(66,132,117,0.07)' : '#428475', color: role === 'maya' ? 'var(--text-muted)' : 'white', borderRadius: role === 'maya' ? '4px 16px 16px 16px' : '16px 4px 16px 16px', border: role === 'maya' ? '1px solid rgba(66,132,117,0.12)' : 'none' }}
                      >{text}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {speaking && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold" style={{ background: 'linear-gradient(135deg, #428475, #1A312C)' }}>M</div>
                    <div className="flex gap-1 px-3 py-2.5 rounded-2xl" style={{ background: 'rgba(66,132,117,0.07)', border: '1px solid rgba(66,132,117,0.12)' }}>
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: '#428475' }}
                          animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="px-5 pb-4">
                <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  <span className="flex-1 text-[13px]" style={{ color: 'var(--text-faint)' }}>Ask Maya anything...</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(66,132,117,0.1)', color: '#428475' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 013 3v7a3 3 0 01-6 0V5a3 3 0 013-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /></svg>
                    </div>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#428475' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
