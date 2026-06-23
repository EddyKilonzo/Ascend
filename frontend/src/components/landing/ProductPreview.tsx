'use client'

import { useState, useRef, type ReactNode } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const TABS = ['Dashboard', 'Habits', 'Planner', 'Maya', 'Analytics'] as const
type Tab = typeof TABS[number]

const TAB_ICONS: Record<Tab, ReactNode> = {
  Dashboard: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
  Habits: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>,
  Planner: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  Maya: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 013 3v7a3 3 0 01-6 0V5a3 3 0 013-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /></svg>,
  Analytics: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
}

const CHART_DATA = [44, 58, 48, 74, 63, 86, 74, 92, 83, 96, 88, 99]

function DashboardTab() {
  const W = 360, H = 80, pad = 8
  const max = Math.max(...CHART_DATA), min = Math.min(...CHART_DATA), range = max - min
  const pts = CHART_DATA.map((v, i) => ({ x: pad + (i / (CHART_DATA.length - 1)) * (W - pad * 2), y: H - pad - ((v - min) / range) * (H - pad * 2) }))
  const line = `M ${pts.map(p => `${p.x},${p.y}`).join(' L ')}`
  const area = `${line} L ${pts[pts.length - 1].x},${H} L ${pts[0].x},${H} Z`
  return (
    <div className="p-6 h-full flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Streak', val: '47d', sub: 'Personal best', accent: '#428475', bg: 'rgba(66,132,117,0.07)' },
          { label: 'XP', val: '2,840', sub: 'This week', accent: '#D4A017', bg: 'rgba(212,160,23,0.07)' },
          { label: 'Focus', val: '94%', sub: 'Score today', accent: '#2563EB', bg: 'rgba(37,99,235,0.07)' },
          { label: 'Done', val: '5/6', sub: 'Habits today', accent: '#059669', bg: 'rgba(5,150,105,0.07)' },
        ].map(({ label, val, sub, accent, bg }) => (
          <div key={label} className="rounded-xl p-3.5" style={{ background: bg, border: `1px solid ${accent}18` }}>
            <p className="text-[10px] uppercase tracking-wider mb-1 font-medium" style={{ color: 'var(--text-faint)' }}>{label}</p>
            <p className="text-[20px] font-bold leading-none mb-0.5" style={{ color: accent, fontFamily: 'var(--font-syne)' }}>{val}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{sub}</p>
          </div>
        ))}
      </div>
      <div className="flex-1 rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>Productivity Trend</p>
          <span className="pill pill-green text-[10px]">▲ +14% this month</span>
        </div>
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="previewGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#428475" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#428475" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path d={area} fill="url(#previewGrad)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
          <motion.path d={line} fill="none" stroke="#428475" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5 }} />
        </svg>
      </div>
    </div>
  )
}

function HabitsTab() {
  const habits = [
    { name: 'Morning Run', streak: 47, done: true, pct: 100, icon: '🏃' },
    { name: 'Meditation', streak: 31, done: true, pct: 100, icon: '🧘' },
    { name: 'Read 30 min', streak: 22, done: true, pct: 80, icon: '📖' },
    { name: 'Deep Work 2h', streak: 15, done: true, pct: 88, icon: '💻' },
    { name: 'Journaling', streak: 47, done: false, pct: 0, icon: '✍️' },
    { name: 'Cold Shower', streak: 8, done: false, pct: 0, icon: '🚿' },
  ]
  return (
    <div className="p-6 flex flex-col gap-2.5 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-syne)' }}>Today's Habits</h3>
        <span className="pill pill-green">4 / 6 done</span>
      </div>
      {habits.map(({ name, streak, done, pct, icon }, i) => (
        <motion.div key={name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07, ease: EASE }}
          className="flex items-center gap-3 rounded-xl p-3"
          style={{ background: done ? 'rgba(66,132,117,0.05)' : 'var(--bg-secondary)', border: `1px solid ${done ? 'rgba(66,132,117,0.15)' : 'var(--border)'}` }}
        >
          <span className="text-xl w-6 text-center flex-shrink-0">{icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[13px] font-medium truncate" style={{ color: done ? 'var(--text)' : 'var(--text-muted)' }}>{name}</p>
              <span className="text-[10px] ml-2 flex-shrink-0 font-medium" style={{ color: '#D4A017' }}>🔥 {streak}d</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
              <motion.div className="h-full rounded-full" style={{ background: done ? '#428475' : 'var(--border)' }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, delay: i * 0.07 + 0.2 }} />
            </div>
          </div>
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: done ? '#428475' : 'var(--bg-raised)', border: `1px solid ${done ? '#428475' : 'var(--border)'}` }}>
            {done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function PlannerTab() {
  const blocks = [
    { time: '06:00', task: 'Morning Run', status: 'done', accent: '#428475' },
    { time: '07:30', task: 'Deep Work: Feature Dev', status: 'done', accent: '#2563EB' },
    { time: '09:00', task: 'Team Standup', status: 'done', accent: '#428475' },
    { time: '10:00', task: 'Product Design Review', status: 'active', accent: '#D4A017' },
    { time: '12:30', task: 'Lunch & Recovery', status: 'upcoming', accent: '#059669' },
    { time: '14:00', task: 'Deep Work: Backend', status: 'upcoming', accent: '#2563EB' },
    { time: '17:00', task: 'Evening Run', status: 'upcoming', accent: '#428475' },
  ]
  return (
    <div className="p-6 flex flex-col gap-2 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-syne)' }}>Monday, Jun 23</h3>
        <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>3 done · 4 left</span>
      </div>
      {blocks.map(({ time, task, status, accent }, i) => (
        <motion.div key={time} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, ease: EASE }}
          className="flex items-center gap-3 rounded-xl p-3 relative"
          style={{ background: status === 'active' ? `${accent}0E` : status === 'done' ? 'var(--bg-secondary)' : 'transparent', border: `1px solid ${status === 'active' ? `${accent}30` : 'var(--border)'}` }}
        >
          {status === 'active' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full" style={{ background: accent }} />}
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: status === 'done' ? accent : status === 'active' ? accent : 'var(--border)', opacity: status === 'upcoming' ? 0.4 : 1 }} />
          <span className="text-[10px] font-mono flex-shrink-0 w-9" style={{ color: 'var(--text-faint)' }}>{time}</span>
          <span className="text-[13px] font-medium flex-1" style={{ color: status === 'done' ? 'var(--text-muted)' : 'var(--text)', textDecoration: status === 'done' ? 'line-through' : 'none' }}>{task}</span>
          {status === 'active' && <span className="pill pill-yellow ml-auto">Now</span>}
          {status === 'done' && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
        </motion.div>
      ))}
    </div>
  )
}

function MayaTab() {
  const msgs = [
    { role: 'maya', text: "Good morning! You're on a 47-day streak — a personal best. Your energy data shows 9–11am is your cognitive peak today." },
    { role: 'user', text: "Can you plan my afternoon focus session?" },
    { role: 'maya', text: "Based on your patterns, 2–4pm is your second best window. I've blocked it for Deep Work and enabled Focus Mode automatically." },
    { role: 'user', text: "Perfect. Let's go." },
    { role: 'maya', text: "All set! Focus Mode starts at 2pm. Notifications silenced, Pomodoro timer ready. You're going to crush it." },
  ]
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[11px] font-bold" style={{ background: 'linear-gradient(135deg, #428475, #1A312C)' }}>M</div>
        <div>
          <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Maya</p>
          <p className="text-[11px]" style={{ color: 'var(--primary)' }}>AI Productivity Coach · Online</p>
        </div>
      </div>
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
        {msgs.map(({ role, text }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }} className={`flex ${role === 'user' ? 'justify-end' : ''}`}>
            <div className="max-w-[85%] text-[12.5px] leading-relaxed px-3.5 py-2.5"
              style={{ background: role === 'maya' ? 'rgba(66,132,117,0.07)' : '#428475', color: role === 'maya' ? 'var(--text-muted)' : 'white', borderRadius: role === 'maya' ? '4px 16px 16px 16px' : '16px 4px 16px 16px', border: role === 'maya' ? '1px solid rgba(66,132,117,0.12)' : 'none' }}
            >{text}</div>
          </motion.div>
        ))}
      </div>
      <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <span className="flex-1 text-[12.5px]" style={{ color: 'var(--text-faint)' }}>Message Maya...</span>
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#428475' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </div>
        </div>
      </div>
    </div>
  )
}

function AnalyticsTab() {
  const bars = [52, 68, 45, 80, 62, 92, 74, 88, 70, 96, 82, 99]
  const [hovered, setHovered] = useState<number | null>(null)
  return (
    <div className="p-6 flex flex-col gap-4 h-full">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Habit Completion', val: '83%', delta: '+5%', accent: '#428475' },
          { label: 'Focus Hours', val: '28h', delta: '+3h', accent: '#2563EB' },
          { label: 'Avg Streak', val: '31d', delta: '+8d', accent: '#D4A017' },
          { label: 'Weekly XP', val: '640', delta: '+120', accent: '#7C3AED' },
        ].map(({ label, val, delta, accent }) => (
          <div key={label} className="rounded-xl p-3.5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>{label}</p>
            <p className="text-[22px] font-bold leading-none" style={{ color: accent, fontFamily: 'var(--font-syne)' }}>{val}</p>
            <p className="text-[11px] mt-0.5 font-medium" style={{ color: '#059669' }}>{delta} this week</p>
          </div>
        ))}
      </div>
      <div className="flex-1 rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <p className="text-[12px] font-semibold mb-3" style={{ color: 'var(--text)' }}>12-Week Productivity Score</p>
        <div className="flex items-end gap-1.5 h-20">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end cursor-pointer" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <motion.div className="w-full rounded-t-md" style={{ background: hovered === i ? '#1A312C' : '#428475', transition: 'background 0.15s' }}
                initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 0.5, delay: i * 0.04, ease: 'easeOut' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const PREVIEW: Record<Tab, ReactNode> = {
  Dashboard: <DashboardTab />,
  Habits: <HabitsTab />,
  Planner: <PlannerTab />,
  Maya: <MayaTab />,
  Analytics: <AnalyticsTab />,
}

export default function ProductPreview() {
  const [active, setActive] = useState<Tab>('Dashboard')
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} id="preview" className="py-28 px-6 md:px-10 lg:px-16" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[1100px] mx-auto">
        <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease: EASE }}>
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] mb-4 px-3 py-1.5 rounded-full" style={{ color: 'var(--primary)', border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            Product Preview
          </span>
          <h2 className="text-[clamp(32px,4vw,52px)] font-bold tracking-[-0.03em] mb-4" style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
            Every tool you need,<br /><span className="text-gradient-teal">beautifully unified.</span>
          </h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
          className="flex items-center justify-center gap-1 mb-6 p-1 rounded-2xl w-fit mx-auto"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          {TABS.map((tab) => (
            <motion.button key={tab} onClick={() => setActive(tab)} className="relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-medium" whileTap={{ scale: 0.97 }}>
              {active === tab && (
                <motion.div layoutId="preview-tab" className="absolute inset-0 rounded-xl"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
              )}
              <span className="relative z-10 flex items-center gap-1.5" style={{ color: active === tab ? 'var(--primary)' : 'var(--text-muted)' }}>
                {TAB_ICONS[tab]}<span className="hidden sm:inline">{tab}</span>
              </span>
            </motion.button>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
          className="rounded-2xl overflow-hidden card-shadow-lg"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
        >
          <div className="flex items-center gap-2 px-5 py-3.5" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
            <span className="ml-3 text-[11px] font-mono" style={{ color: 'var(--text-faint)' }}>app.ascend.io/{active.toLowerCase()}</span>
          </div>
          <div style={{ height: 440 }}>
            <AnimatePresence mode="wait">
              <motion.div key={active} className="h-full"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                {PREVIEW[active]}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
