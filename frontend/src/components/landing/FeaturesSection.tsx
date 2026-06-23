'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import ContributionGraph, { type ContributionData } from '@/components/ui/smoothui/contribution-graph'

const EASE: [number,number,number,number] = [0.22, 1, 0.36, 1]

/* ── Mini chart for Maya card ── */
function MiniChart() {
  const data = [30, 50, 42, 70, 60, 88, 74, 92, 85, 98]
  const W = 180, H = 48, pad = 4
  const max = Math.max(...data), min = Math.min(...data), range = max - min
  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (W - pad * 2),
    y: H - pad - ((v - min) / range) * (H - pad * 2),
  }))
  const line = `M ${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`
  const area = `${line} L ${pts[pts.length-1].x},${H} L ${pts[0].x},${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="fg1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#428475" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#428475" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={area} fill="url(#fg1)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} />
      <motion.path d={line} fill="none" stroke="#428475" strokeWidth="2" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.4, ease: 'easeOut' }} />
    </svg>
  )
}

/* ── Sample habit contribution data ── */
function generateSampleData(): ContributionData[] {
  const data: ContributionData[] = []
  const today = new Date()
  for (let i = 0; i < 200; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const rand = Math.random()
    const level = rand > 0.65 ? 4 : rand > 0.45 ? 3 : rand > 0.3 ? 2 : rand > 0.18 ? 1 : 0
    if (level > 0) {
      data.push({ date: d.toISOString().split('T')[0], count: level * 2, level })
    }
  }
  return data
}

const HABIT_GRAPH_DATA = generateSampleData()

/* ── Analytics bars ── */
function AnalyticsBars() {
  const vals = [65, 80, 55, 90, 72, 95, 88]
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  return (
    <div className="flex items-end gap-2 h-20">
      {vals.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            className="w-full rounded-md"
            style={{ background: v >= 85 ? '#428475' : 'var(--bg-raised)', border: '1px solid var(--border)' }}
            initial={{ height: 0 }}
            animate={{ height: `${v}%` }}
            transition={{ delay: 0.3 + i * 0.07, duration: 0.6, ease: 'easeOut' }}
          />
          <span className="text-[8px]" style={{ color: 'var(--text-faint)' }}>{days[i]}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Conversation preview ── */
function ConvPreview() {
  return (
    <div className="space-y-2.5">
      {[
        { role: 'maya', text: "You've hit 47 consecutive days. You're in the top 3% of all users." },
        { role: 'user', text: "What's my weakest habit right now?" },
        { role: 'maya', text: "Evening journaling — 61% completion. Want me to reschedule it?" },
      ].map(({ role, text }, i) => (
        <motion.div key={i} className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.25 }}>
          <div className="max-w-[88%] text-[11px] leading-snug px-3 py-2 rounded-xl"
            style={{
              background: role === 'maya' ? 'rgba(66,132,117,0.1)' : '#428475',
              color:      role === 'maya' ? 'var(--text-muted)'    : 'white',
              borderRadius: role === 'maya' ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
              border: role === 'maya' ? '1px solid rgba(66,132,117,0.15)' : 'none',
            }}>
            {text}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/* ── XP progress ── */
function XPProgress() {
  return (
    <div className="space-y-3">
      {[
        { label: 'Reading',     xp: 340, max: 400, color: '#428475' },
        { label: 'Exercise',    xp: 280, max: 400, color: '#2563EB' },
        { label: 'Meditation',  xp: 180, max: 400, color: '#7C3AED' },
      ].map(({ label, xp, max, color }, i) => (
        <div key={label}>
          <div className="flex justify-between mb-1">
            <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span className="text-[10px] font-semibold" style={{ color }}>{xp} XP</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
            <motion.div className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${color}, ${color}BB)` }}
              initial={{ width: 0 }}
              animate={{ width: `${(xp / max) * 100}%` }}
              transition={{ delay: 0.5 + i * 0.15, duration: 0.7, ease: 'easeOut' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Feature cards ── */
interface Card { label: string; heading: string; copy: string; accent: string; preview: React.ReactNode; span?: string }

const CARDS: Card[] = [
  {
    label:   'Maya AI Coach',
    heading: 'An AI coach that actually knows you',
    copy:    'Maya learns your patterns, peak hours, and goals — delivering precision insights, not generic advice.',
    accent:  '#428475',
    span:    'lg:col-span-2',
    preview: <ConvPreview />,
  },
  {
    label:   'Habit Tracking',
    heading: 'Streaks that last',
    copy:    'Science-backed habit stacking with heatmaps, adaptive reminders, and visual progress you want to protect.',
    accent:  '#5ABFAD',
    preview: (
      <div style={{ transform: 'scale(0.8)', transformOrigin: 'top left', height: 100, overflow: 'hidden' }}>
        <ContributionGraph data={HABIT_GRAPH_DATA} showLegend={true} showTooltips={false} />
      </div>
    ),
  },
  {
    label:   'Deep Analytics',
    heading: 'Visualize what matters',
    copy:    'Animated charts reveal your productivity patterns and peak performance windows with clarity.',
    accent:  '#7C3AED',
    preview: <div className="space-y-2"><AnalyticsBars /><MiniChart /></div>,
  },
  {
    label:   'Daily Planner',
    heading: 'Time-blocked & AI-scheduled',
    copy:    'Drag-and-drop blocks with AI-suggested deep focus windows and seamless calendar sync.',
    accent:  '#2563EB',
    preview: (
      <div className="grid grid-cols-1 gap-1.5">
        {['9:00 Deep Work', '11:30 Team Standup', '13:00 Lunch', '14:00 Review'].map((t, i) => (
          <motion.div key={t} className="rounded-lg px-3 py-2 text-[10px] font-medium"
            style={{ background: i === 0 ? 'rgba(37,99,235,0.12)' : 'var(--bg-raised)', border: `1px solid ${i === 0 ? 'rgba(37,99,235,0.2)' : 'var(--border)'}`, color: i === 0 ? '#3B82F6' : 'var(--text-muted)' }}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
            {t}
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    label:   'XP & Gamification',
    heading: 'Progress that feels rewarding',
    copy:    'Earn XP, unlock achievements, and climb leaderboards. Accountability never felt this good.',
    accent:  '#D4A017',
    preview: <XPProgress />,
  },
  {
    label:   'Smart Insights',
    heading: 'Answers before you ask',
    copy:    'Proactive nudges, weekly summaries, and behavioral patterns surfaced at exactly the right moment.',
    accent:  '#059669',
    preview: (
      <div className="space-y-2">
        {['+12% productivity this week', '7am–10am is your peak window', 'Reading streak at risk'].map((msg, i) => (
          <motion.div key={msg} className="flex items-start gap-2" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.15 }}>
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#059669' }} />
            <p className="text-[10.5px] leading-snug" style={{ color: 'var(--text-muted)' }}>{msg}</p>
          </motion.div>
        ))}
      </div>
    ),
  },
]

const REVEAL_EASE: [number,number,number,number] = [0.16, 1, 0.3, 1]

export default function FeaturesSection() {
  const secRef = useRef<HTMLElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const secInView = useInView(secRef, { once: true, amount: 0.06 as any })
  const gridRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gridInView = useInView(gridRef, { once: true, amount: 0.04 as any })

  return (
    <section ref={secRef} id="features" className="relative py-32 px-6 md:px-10 lg:px-16 overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
      {/* Section bg — hex + grid overlay */}
      <div className="absolute inset-0 pointer-events-none hex-bg opacity-30" aria-hidden />
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" aria-hidden>
        <svg className="w-full h-full">
          <defs><pattern id="feat-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--primary)" strokeWidth="0.5" />
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#feat-grid)" />
        </svg>
      </div>

      <div className="max-w-[1200px] mx-auto relative">
        {/* Header — staggered line-by-line reveal */}
        <div className="text-center mb-20 overflow-hidden">
          <motion.span
            className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] mb-5 px-3.5 py-1.5 rounded-full"
            style={{ color: 'var(--primary)', border: '1px solid rgba(66,132,117,0.25)', background: 'rgba(66,132,117,0.06)' }}
            initial={{ opacity: 0, y: 24 }}
            animate={secInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: REVEAL_EASE, delay: 0 }}
          >
            Everything you need
          </motion.span>
          <motion.h2
            className="text-[clamp(36px,5vw,60px)] font-bold tracking-[-0.035em] leading-[1.06] mb-5"
            style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}
            initial={{ opacity: 0, y: 48, filter: 'blur(10px)' }}
            animate={secInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ duration: 0.8, ease: REVEAL_EASE, delay: 0.1 }}
          >
            Built for those who take<br />
            <span className="text-gradient-teal">their growth seriously.</span>
          </motion.h2>
          <motion.p
            className="text-[17px] leading-relaxed max-w-[500px] mx-auto"
            style={{ color: 'var(--text-muted)' }}
            initial={{ opacity: 0, y: 24 }}
            animate={secInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, ease: REVEAL_EASE, delay: 0.22 }}
          >
            Every feature exists for one purpose — to help you become the person you are working to be.
          </motion.p>
        </div>

        {/* Bento grid — each card staggered */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
          {CARDS.map(({ label, heading, copy, accent, preview, span }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 60, filter: 'blur(8px)' }}
              animate={gridInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
              transition={{ duration: 0.7, ease: REVEAL_EASE, delay: i * 0.09 }}
              whileHover={{ y: -5, transition: { duration: 0.22, ease: 'easeOut' } }}
              className={`group relative rounded-2xl p-6 flex flex-col gap-5 overflow-hidden ${span ?? ''}`}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = `${accent}45`
                el.style.boxShadow = `0 28px 64px rgba(0,0,0,0.2), 0 0 0 1px ${accent}22, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset`
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = 'var(--border)'
                el.style.boxShadow = 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset'
              }}
            >
              {/* Accent corner glow */}
              <div
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)` }}
                aria-hidden
              />

              {/* Header */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: accent }}>{label}</span>
                <h3 className="text-[16px] font-semibold leading-snug" style={{ color: 'var(--text)', fontFamily: 'var(--font-syne)' }}>{heading}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{copy}</p>
              </div>

              {/* Preview area */}
              <div
                className="rounded-xl p-4 mt-auto"
                style={{
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border)',
                  boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset',
                }}
              >
                {preview}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
