'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, useMotionValue, useSpring, useTransform, animate, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const EASE: [number,number,number,number] = [0.22, 1, 0.36, 1]

const CHART_DATASETS = [
  [42, 55, 47, 72, 61, 84, 73, 90, 80, 94, 87, 98],
  [38, 62, 54, 78, 65, 88, 76, 92, 83, 96, 89, 99],
  [45, 58, 50, 74, 63, 86, 75, 91, 81, 95, 88, 97],
  [50, 60, 52, 76, 67, 90, 78, 93, 84, 97, 90, 100],
]

const HEATMAP = Array.from({ length: 91 }, (_, i) => {
  const s = (i * 17 + 3) % 100
  return s < 10 ? 0 : s < 28 ? 1 : s < 54 ? 2 : s < 78 ? 3 : 4
})

const HABITS = [
  { name: 'Morning Run', done: true,  pct: 100 },
  { name: 'Meditation',  done: true,  pct: 100 },
  { name: 'Read',        done: true,  pct: 100 },
  { name: 'Deep Work',   done: true,  pct: 88  },
  { name: 'Journal',     done: true,  pct: 75  },
  { name: 'Cold Shower', done: false, pct: 0   },
]

// Cursor waypoints: [x%, y%] within the dashboard body div
const CURSOR_WAYPOINTS: Array<{ x: number; y: number; action: 'click' | 'hover' }> = [
  { x: 28, y: 28, action: 'hover'  }, // stat card 1
  { x: 57, y: 28, action: 'click'  }, // stat card 2
  { x: 85, y: 28, action: 'click'  }, // stat card 3
  { x: 30, y: 52, action: 'hover'  }, // habit row 1
  { x: 65, y: 52, action: 'click'  }, // habit row 2
  { x: 50, y: 65, action: 'hover'  }, // habit row 4
  { x: 25, y: 80, action: 'hover'  }, // heatmap
  { x: 78, y: 80, action: 'hover'  }, // chart
  { x: 62, y: 14, action: 'hover'  }, // header greeting
  { x: 42, y: 28, action: 'click'  }, // stat card 1 again
]

/* ── Icons ── */
function FlameIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-7 7c-1.862 0-3.76-.674-4.9-2" />
    </svg>
  )
}
function ZapIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}
function TargetIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  )
}

/* ── Animated number counter — count-up + live drift ── */
function AnimatedNumber({
  value, color, suffix = '', prefix = '',
}: { value: number; color: string; suffix?: string; prefix?: string }) {
  const [display, setDisplay] = useState(0)
  const currentRef = useRef(0)

  const animateTo = useCallback((target: number) => {
    return animate(currentRef.current, target, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        currentRef.current = v
        setDisplay(Math.round(v))
      },
    })
  }, [])

  useEffect(() => {
    const ctrl = animateTo(value)
    const interval = setInterval(() => {
      const drift = value + Math.floor((Math.random() - 0.4) * value * 0.07)
      animateTo(Math.max(1, drift))
    }, 6500)
    return () => { ctrl.stop(); clearInterval(interval) }
  }, [value, animateTo])

  return (
    <p className="text-[16px] font-bold leading-tight mt-1 tabular-nums" style={{ color, fontFamily: 'var(--font-syne)' }}>
      {prefix}{display.toLocaleString()}{suffix}
    </p>
  )
}

/* ── Heatmap ── */
function Heatmap() {
  return (
    <div className="flex gap-[2.5px]">
      {Array.from({ length: 13 }, (_, col) => (
        <div key={col} className="flex flex-col gap-[2.5px]">
          {Array.from({ length: 7 }, (_, row) => {
            const idx = col * 7 + row
            const level = HEATMAP[idx] ?? 0
            return (
              <motion.div
                key={row}
                className="rounded-[2px] heatmap-cell"
                data-level={level}
                style={{ width: 9, height: 9 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + idx * 0.003, duration: 0.12 }}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

/* ── Line chart that redraws on dataset cycle ── */
function LineChart({ dataIndex = 0 }: { dataIndex?: number }) {
  const data = CHART_DATASETS[dataIndex % CHART_DATASETS.length]
  const W = 220, H = 52, pad = 5
  const max = Math.max(...data), min = Math.min(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (W - pad * 2),
    y: H - pad - ((v - min) / range) * (H - pad * 2),
  }))
  const line = `M ${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`
  const area = `${line} L ${pts[pts.length - 1].x},${H} L ${pts[0].x},${H} Z`

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="lc-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#428475" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#428475" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={area} fill="url(#lc-grad)"
        key={`area-${dataIndex}`}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      />
      <motion.path
        d={line} fill="none" stroke="#428475" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        key={`line-${dataIndex}`}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: 'easeInOut' }}
      />
      <motion.circle
        cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3" fill="#428475"
        key={`dot-${dataIndex}`}
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ delay: 1.3, type: 'spring', stiffness: 380, damping: 18 }}
      />
    </svg>
  )
}

/* ── Bar chart with live-updating heights ── */
const INITIAL_BARS = [48, 72, 55, 83, 67, 91, 58, 78, 65, 95, 74, 88]

function BarChart() {
  const [heights, setHeights] = useState(INITIAL_BARS)

  useEffect(() => {
    const t = setInterval(() => {
      setHeights(prev =>
        prev.map((h, i) => {
          const wave = Math.sin(Date.now() / 1000 + i * 0.8) * 12
          return Math.max(15, Math.min(100, h + (Math.random() - 0.45) * 10 + wave))
        })
      )
    }, 1800)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex items-end gap-[2px] mt-1" style={{ height: 28 }}>
      {heights.map((h, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-t-[2px]"
          style={{
            background: i === heights.length - 1
              ? 'linear-gradient(180deg, #5ABFAD 0%, #428475 100%)'
              : `rgba(66,132,117,${0.15 + (h / 100) * 0.45})`,
          }}
          animate={{ height: `${h}%` }}
          transition={{ duration: 0.9, ease: 'easeInOut', delay: i * 0.02 }}
        />
      ))}
    </div>
  )
}

/* ── Simulated mouse cursor ── */
function LiveCursor() {
  const xPct = useMotionValue(65)
  const yPct = useMotionValue(28)
  const [clicking, setClicking] = useState(false)

  const springX = useSpring(xPct, { stiffness: 70, damping: 16 })
  const springY = useSpring(yPct, { stiffness: 70, damping: 16 })
  const leftVal = useTransform(springX, v => `${v}%`)
  const topVal  = useTransform(springY, v => `${v}%`)

  useEffect(() => {
    let idx = 0
    let mounted = true

    const moveTo = () => {
      if (!mounted) return
      const wp = CURSOR_WAYPOINTS[idx % CURSOR_WAYPOINTS.length]
      xPct.set(wp.x)
      yPct.set(wp.y)

      if (wp.action === 'click') {
        setTimeout(() => { if (mounted) setClicking(true)  }, 650)
        setTimeout(() => { if (mounted) setClicking(false) }, 920)
      }

      idx++
      setTimeout(() => { if (mounted) moveTo() }, 1500 + Math.random() * 500)
    }

    const t = setTimeout(moveTo, 900)
    return () => { mounted = false; clearTimeout(t) }
  }, [xPct, yPct])

  return (
    <motion.div className="absolute pointer-events-none z-30" style={{ left: leftVal, top: topVal }}>
      <motion.svg
        width="13" height="17" viewBox="0 0 13 17"
        animate={{ scale: clicking ? 0.82 : 1 }}
        transition={{ duration: 0.08 }}
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
      >
        <path d="M0 0 L0 13 L3.2 9.8 L6 16 L7.5 15.4 L4.7 9.2 L9 9.2 Z" fill="white" stroke="rgba(0,0,0,0.3)" strokeWidth="0.6" />
      </motion.svg>

      <AnimatePresence>
        {clicking && (
          <motion.div
            className="absolute rounded-full"
            style={{ inset: -10, background: 'rgba(66,132,117,0.35)' }}
            initial={{ scale: 0.3, opacity: 1 }}
            animate={{ scale: 2.2,  opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Sidebar icons ── */
const SIDEBAR_ICONS = [
  { d: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', active: true },
  { d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { d: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
  { d: 'M12 2a3 3 0 013 3v7a3 3 0 01-6 0V5a3 3 0 013-3zM19 10v2a7 7 0 01-14 0v-2' },
  { d: 'M16 8v8m-8-5v5M12 5v11' },
]

const STAT_CARDS = [
  { Icon: FlameIcon,  value: 47,   label: 'Streak',   accent: '#428475', bg: 'rgba(66,132,117,0.08)', border: 'rgba(66,132,117,0.18)', suffix: 'd' },
  { Icon: ZapIcon,    value: 2840, label: 'XP Today', accent: '#D4A017', bg: 'var(--gold-bg)',          border: 'rgba(212,160,23,0.2)',  suffix: ''  },
  { Icon: TargetIcon, value: 94,   label: 'Focus',    accent: '#3B82F6', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.15)', suffix: '%' },
]

export default function Dashboard3D() {
  const containerRef = useRef<HTMLDivElement>(null)
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const rotateX = useSpring(rawY, { stiffness: 80, damping: 22 })
  const rotateY = useSpring(rawX, { stiffness: 80, damping: 22 })
  const [chartIdx, setChartIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setChartIdx(i => i + 1), 5000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const relX = (e.clientX - rect.left  - rect.width  / 2) / (rect.width  / 2)
      const relY = (e.clientY - rect.top   - rect.height / 2) / (rect.height / 2)
      rawX.set(relX * 4)
      rawY.set(-relY * 3)
    }
    const onLeave = () => { rawX.set(0); rawY.set(0) }
    const el = containerRef.current
    el?.addEventListener('mousemove', onMove)
    el?.addEventListener('mouseleave', onLeave)
    return () => { el?.removeEventListener('mousemove', onMove); el?.removeEventListener('mouseleave', onLeave) }
  }, [rawX, rawY])

  return (
    <div ref={containerRef} className="relative w-full" style={{ perspective: '1200px' }}>
      {/* Ambient glow under the card */}
      <div
        className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-4/5 h-20 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(66,132,117,0.32) 0%, transparent 70%)',
          filter: 'blur(24px)',
        }}
      />

      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        initial={{ opacity: 0, y: 36, scale: 0.95 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 1.0, ease: EASE, delay: 0.3 }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          className="relative rounded-[18px] overflow-hidden w-full"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset',
          }}
        >
          {/* Shimmer border highlight */}
          <div
            className="absolute inset-0 rounded-[18px] pointer-events-none z-10"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.03) 100%)',
            }}
          />

          {/* Browser chrome */}
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="w-3 h-3 rounded-full" style={{ background: '#FF5F57' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#FEBC2E' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#28C840' }} />
            <div className="flex-1 mx-4">
              <div
                className="mx-auto max-w-[200px] h-5 rounded-md flex items-center justify-center text-[10px] font-mono"
                style={{ background: 'var(--bg-raised)', color: 'var(--text-faint)' }}
              >
                app.ascend.io/dashboard
              </div>
            </div>
            {/* LIVE recording dot */}
            <div className="flex items-center gap-1.5 pr-1">
              <motion.div
                className="w-2 h-2 rounded-full"
                style={{ background: '#EF4444' }}
                animate={{ opacity: [1, 0.25, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="text-[9px] font-bold tracking-wider" style={{ color: '#EF4444' }}>LIVE</span>
            </div>
          </div>

          {/* Dashboard body — position: relative for cursor overlay */}
          <div className="flex relative" style={{ height: 390 }}>
            <LiveCursor />

            {/* Sidebar */}
            <div
              className="flex flex-col items-center py-4 gap-3 flex-shrink-0"
              style={{ width: 52, borderRight: '1px solid rgba(255,255,255,0.04)', background: 'var(--bg-secondary)' }}
            >
              <div className="w-7 h-7 rounded-lg overflow-hidden mb-2 flex-shrink-0">
                <Image src="/icons/asc.png" alt="Ascend" width={28} height={28} className="w-full h-full object-cover" />
              </div>
              {SIDEBAR_ICONS.map(({ d, active }, i) => (
                <motion.div
                  key={i}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: active ? 'rgba(66,132,117,0.14)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(66,132,117,0.28)' : 'transparent'}`,
                  }}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.35, ease: EASE }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke={active ? '#428475' : 'var(--text-faint)'}
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={d} />
                  </svg>
                </motion.div>
              ))}
            </div>

            {/* Main content area */}
            <div className="flex-1 p-5 overflow-hidden">
              {/* Header */}
              <motion.div
                className="flex items-center justify-between mb-5"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4, ease: EASE }}
              >
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] mb-0.5" style={{ color: 'var(--text-faint)' }}>MON, JUN 23</p>
                  <h3 className="text-[14px] font-semibold leading-tight" style={{ color: 'var(--text)', fontFamily: 'var(--font-syne)' }}>Good morning, Alex</h3>
                </div>
                <span className="pill pill-green text-[9px]">On Track</span>
              </motion.div>

              {/* Stat cards with animated numbers */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {STAT_CARDS.map(({ Icon, value, label, accent, bg, border, suffix }, i) => (
                  <motion.div
                    key={label}
                    className="rounded-xl p-2.5"
                    style={{ background: bg, border: `1px solid ${border}` }}
                    initial={{ opacity: 0, scale: 0.88, y: 8 }}
                    animate={{ opacity: 1, scale: 1,    y: 0 }}
                    transition={{ delay: 0.7 + i * 0.1, duration: 0.4, ease: EASE }}
                  >
                    <Icon />
                    <AnimatedNumber value={value} suffix={suffix} color={accent} />
                    <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Today's Habits */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--text-faint)' }}>Today's Habits</p>
                  <motion.span
                    className="text-[9px] font-medium"
                    style={{ color: '#428475' }}
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    5/6 done
                  </motion.span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {HABITS.map(({ name, done, pct }, i) => (
                    <motion.div
                      key={name}
                      className="rounded-lg px-2 py-1.5"
                      style={{
                        background: done ? 'rgba(66,132,117,0.07)' : 'var(--bg-secondary)',
                        border: `1px solid ${done ? 'rgba(66,132,117,0.18)' : 'var(--border)'}`,
                      }}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 + i * 0.07, duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[8px] font-medium truncate pr-1" style={{ color: done ? 'var(--text-2)' : 'var(--text-faint)' }}>{name}</p>
                        {done && (
                          <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: '#428475' }}>
                            <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #428475, #5ABFAD)' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 1.0 + i * 0.06, duration: 0.9, ease: 'easeOut' }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Bottom: Heatmap + Chart */}
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--text-faint)' }}>Activity</p>
                  <Heatmap />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3, duration: 0.5 }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--text-faint)' }}>Score</p>
                    <motion.span
                      className="text-[9px] font-semibold"
                      style={{ color: '#2D8C5A' }}
                      animate={{ opacity: [1, 0.6, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    >
                      +12%
                    </motion.span>
                  </div>
                  <LineChart dataIndex={chartIdx} />
                  <BarChart />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
