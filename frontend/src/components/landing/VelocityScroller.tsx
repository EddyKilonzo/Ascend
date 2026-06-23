'use client'

import { useRef } from 'react'
import {
  motion,
  useScroll,
  useVelocity,
  useTransform,
  useSpring,
  useAnimationFrame,
  useMotionValue,
} from 'framer-motion'

/* Modulo wrap — keeps a value cycling between min and max */
function wrap(min: number, max: number, v: number): number {
  const range = max - min
  return min + ((((v - min) % range) + range) % range)
}

const ROW_ONE = [
  'AI Habit Coaching',
  '47-Day Streaks',
  'Deep Focus Blocks',
  'Progress Analytics',
  'Maya Voice AI',
  'Smart Scheduling',
  'XP & Leveling',
  'OCR Receipt Scan',
]

const ROW_TWO = [
  '2,400+ Members',
  'AI Accountability',
  'Evening Reviews',
  '94% Retention Rate',
  'Pattern Recognition',
  'Pomodoro Integration',
  'Smart Reminders',
  'Ranked Leaderboard',
]

interface ParallaxRowProps {
  items: string[]
  baseVelocity: number
}

function ParallaxRow({ items, baseVelocity }: ParallaxRowProps) {
  const baseX = useMotionValue(0)
  const { scrollY } = useScroll()
  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 })
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false })

  const x = useTransform(baseX, (v) => `${wrap(-20, -45, v)}%`)
  const directionFactor = useRef<number>(1)

  useAnimationFrame((_t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000)
    const vf = velocityFactor.get()
    if (vf < 0) directionFactor.current = -1
    else if (vf > 0) directionFactor.current = 1
    moveBy += directionFactor.current * moveBy * Math.abs(vf)
    baseX.set(baseX.get() + moveBy)
  })

  const track = [...items, ...items, ...items, ...items]

  return (
    <div className="overflow-hidden">
      <motion.div className="flex gap-3 whitespace-nowrap py-2" style={{ x }}>
        {track.map((label, i) => (
          <div
            key={i}
            className="inline-flex items-center px-5 py-2.5 rounded-full flex-shrink-0"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset',
            }}
          >
            <span
              className="text-[12.5px] font-semibold tracking-[-0.01em] whitespace-nowrap"
              style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-syne)' }}
            >
              {label}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

export default function VelocityScroller() {
  return (
    <section
      className="relative py-16 overflow-hidden"
      style={{ background: 'var(--bg)' }}
      aria-label="Feature highlights"
    >
      {/* Left + right edge fades */}
      <div
        className="absolute left-0 top-0 bottom-0 w-24 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to right, var(--bg), transparent)' }}
        aria-hidden
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-24 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to left, var(--bg), transparent)' }}
        aria-hidden
      />

      {/* Subtle top separator */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{ background: 'linear-gradient(to right, transparent, var(--border), transparent)' }}
        aria-hidden
      />
      <div
        className="absolute bottom-0 inset-x-0 h-px"
        style={{ background: 'linear-gradient(to right, transparent, var(--border), transparent)' }}
        aria-hidden
      />

      <div className="flex flex-col gap-3">
        <ParallaxRow items={ROW_ONE} baseVelocity={-8} />
        <ParallaxRow items={ROW_TWO} baseVelocity={8} />
      </div>
    </section>
  )
}
