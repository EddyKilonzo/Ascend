'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Dashboard3D from './Dashboard3D'

const EASE: [number,number,number,number] = [0.22, 1, 0.36, 1]

const CYCLE_WORDS = ['Time.', 'Habits.', 'Goals.', 'Growth.']

const HEADLINE_PREFIX = [
  { text: 'Master' },
  { text: 'Your'   },
]

function CyclingWord() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => {
      setIdx(i => (i + 1) % CYCLE_WORDS.length)
    }, 2800)
    return () => clearTimeout(t)
  }, [idx])

  return (
    <span style={{ display: 'inline-block', position: 'relative', verticalAlign: 'bottom' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={CYCLE_WORDS[idx]}
          className="text-gradient-teal"
          style={{ display: 'inline-block' }}
          initial={{ y: 56, opacity: 0, filter: 'blur(14px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -40, opacity: 0, filter: 'blur(8px)' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {CYCLE_WORDS[idx]}
        </motion.span>
      </AnimatePresence>
      {/* Blinking cursor */}
      <motion.span
        aria-hidden
        style={{
          display: 'inline-block',
          width: 3,
          height: '0.8em',
          background: '#428475',
          marginLeft: 5,
          verticalAlign: 'middle',
          borderRadius: 2,
        }}
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
      />
    </span>
  )
}

const HERO_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=40&h=40&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=faces',
]

const STATS = [
  { val: '47d',    label: 'Avg streak'      },
  { val: '94%',   label: 'Habit retention' },
  { val: '4.9',   label: 'App rating'      },
  { val: '2,400+',label: 'Members'         },
]

/* ── Grain / noise texture overlay ── */
function TextureLayer() {
  return (
    <>
      {/* Hexagon grid */}
      <div className="absolute inset-0 pointer-events-none z-[0] hex-bg" style={{ opacity: 0.45 }} aria-hidden />

      {/* Film grain — SVG feTurbulence noise */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          mixBlendMode: 'overlay',
        }}
        aria-hidden
      />

      {/* Micro dot grid */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          opacity: 0.038,
          backgroundImage: 'radial-gradient(circle, rgba(66,132,117,1) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden
      />

      {/* Diagonal line texture — very subtle */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          opacity: 0.018,
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(66,132,117,1) 0px, rgba(66,132,117,1) 1px, transparent 1px, transparent 28px)',
        }}
        aria-hidden
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          background: 'radial-gradient(ellipse 90% 80% at 50% 0%, transparent 45%, rgba(6,12,11,0.55) 100%)',
        }}
        aria-hidden
      />
    </>
  )
}

/* ── Floating UI cards ── */
function StreakFloater() {
  return (
    <motion.div
      className="absolute -top-6 -left-10 z-20 hidden xl:block"
      initial={{ opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      transition={{ duration: 0.6, ease: EASE, delay: 1.2 }}
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="flex items-center gap-2.5 rounded-2xl px-4 py-3"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(66,132,117,0.2)',
          boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset',
        }}
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(217,119,6,0.1)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-7 7c-1.862 0-3.76-.674-4.9-2" />
          </svg>
        </div>
        <div>
          <p className="text-[11px] font-bold leading-tight tracking-tight" style={{ color: 'var(--text)', fontFamily: 'var(--font-syne)' }}>47-day streak</p>
          <p className="text-[9.5px] mt-0.5" style={{ color: 'var(--text-faint)' }}>Personal record</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

function XPFloater() {
  return (
    <motion.div
      className="absolute -top-4 -right-8 z-20 hidden xl:block"
      initial={{ opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      transition={{ duration: 0.6, ease: EASE, delay: 1.4 }}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="rounded-2xl px-4 py-3"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(212,160,23,0.2)',
          boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset',
        }}
      >
        <div className="flex items-center justify-between gap-8 mb-2">
          <p className="text-[10px] font-semibold tracking-wide" style={{ color: 'var(--text-faint)' }}>XP Today</p>
          <p className="text-[11px] font-bold" style={{ color: '#D4A017', fontFamily: 'var(--font-syne)' }}>+340 XP</p>
        </div>
        <div className="h-1.5 w-36 rounded-full overflow-hidden" style={{ background: 'var(--bg-raised)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #D4A017, #F59E0B)' }}
            initial={{ width: 0 }}
            animate={{ width: '72%' }}
            transition={{ delay: 2.0, duration: 0.9, ease: 'easeOut' }}
          />
        </div>
        <p className="text-[9px] mt-1.5" style={{ color: 'var(--text-faint)' }}>2,840 / 3,500 to Level 13</p>
      </motion.div>
    </motion.div>
  )
}

function MayaFloater() {
  return (
    <motion.div
      className="absolute -bottom-6 -right-6 z-20 hidden xl:block"
      initial={{ opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      transition={{ duration: 0.6, ease: EASE, delay: 1.6 }}
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="flex items-center gap-3 rounded-2xl px-4 py-3 max-w-[240px]"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(66,132,117,0.18)',
          boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset',
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #428475, #1A312C)' }}
        >
          <Image src="/icons/asc.png" alt="Ascend" width={32} height={32} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium leading-snug" style={{ color: 'var(--text-muted)' }}>Your peak focus is 7–10am. Protect those hours?</p>
          <p className="text-[9px] mt-0.5 font-semibold tracking-wide uppercase" style={{ color: '#428475' }}>Maya AI</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bgY      = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '8%'])
  const opacity  = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section
      ref={ref}
      className="relative overflow-hidden"
      style={{ minHeight: '100svh', paddingTop: 64, background: 'var(--bg)' }}
    >
      {/* ── Texture layers ── */}
      <TextureLayer />

      {/* ── Background glows ── */}
      <motion.div className="absolute inset-0 pointer-events-none z-[1]" style={{ y: bgY }} aria-hidden>
        {/* Top center aurora */}
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[800px] rounded-full"
          style={{ background: 'radial-gradient(ellipse at center, rgba(66,132,117,0.12) 0%, rgba(66,132,117,0.04) 40%, transparent 65%)' }}
        />
        {/* Right side glow */}
        <div
          className="absolute top-1/4 right-0 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(66,132,117,0.07) 0%, transparent 65%)' }}
        />
        {/* Lower left accent */}
        <div
          className="absolute bottom-1/4 -left-32 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(90,191,173,0.04) 0%, transparent 70%)' }}
        />
      </motion.div>

      {/* Top divider line */}
      <div
        className="absolute top-[64px] inset-x-0 h-px pointer-events-none z-[3]"
        style={{ background: 'linear-gradient(to right, transparent, rgba(66,132,117,0.35), transparent)' }}
        aria-hidden
      />

      {/* ── Main grid ── */}
      <motion.div
        className="relative z-10 w-full max-w-[1280px] mx-auto px-6 md:px-10 lg:px-14"
        style={{ y: contentY, opacity }}
      >
        <div className="grid lg:grid-cols-2 gap-8 xl:gap-14 items-center py-4 lg:py-6">

          {/* ── LEFT: Copy ── */}
          <div className="flex flex-col items-start">

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
              className="mb-4"
            >
              <div
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-[11.5px] font-semibold tracking-[0.04em] uppercase"
                style={{
                  border: '1px solid rgba(66,132,117,0.35)',
                  background: 'rgba(66,132,117,0.07)',
                  color: 'var(--primary)',
                  letterSpacing: '0.05em',
                }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--primary)' }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--primary)' }} />
                </span>
                Intelligent AI coaching — Now in Beta
              </div>
            </motion.div>

            {/* Headline — optical kerning, editorial weight */}
            <motion.h1
              className="mb-3 overflow-visible"
              style={{
                fontFamily: 'var(--font-syne)',
                fontWeight: 800,
                fontSize: 'clamp(44px, 5.5vw, 80px)',
                lineHeight: 0.95,
                letterSpacing: '-0.035em',
                color: 'var(--text)',
                fontFeatureSettings: '"kern" 1, "liga" 1',
              }}
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
              }}
            >
              {HEADLINE_PREFIX.map(({ text }) => (
                <motion.span
                  key={text}
                  className="block"
                  variants={{
                    hidden:  { opacity: 0, y: 52, filter: 'blur(12px)' },
                    visible: { opacity: 1, y: 0,  filter: 'blur(0px)',  transition: { duration: 0.7, ease: EASE } },
                  }}
                  style={{ display: 'block' }}
                >
                  {text}
                </motion.span>
              ))}
              {/* Third line: cycling animated word */}
              <motion.span
                style={{ display: 'block', overflow: 'visible' }}
                variants={{
                  hidden:  { opacity: 0, y: 52, filter: 'blur(12px)' },
                  visible: { opacity: 1, y: 0,  filter: 'blur(0px)',  transition: { duration: 0.7, ease: EASE } },
                }}
              >
                <CyclingWord />
              </motion.span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.65 }}
              style={{
                fontSize: 'clamp(15px, 1.2vw, 17.5px)',
                lineHeight: 1.8,
                letterSpacing: '-0.01em',
                color: 'var(--text-muted)',
                maxWidth: 460,
                marginBottom: 20,
                fontWeight: 400,
              }}
            >
              Maya, your personal AI coach, learns your patterns, builds your habits, and
              orchestrates your entire productivity system — unified in one place.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.78 }}
              className="flex flex-wrap items-center gap-3 mb-5"
            >
              <motion.a
                href="/signup"
                className="inline-flex items-center gap-2.5 px-7 py-[13px] rounded-xl text-[14px] font-semibold tracking-[-0.01em]"
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #428475',
                  color: '#428475',
                  boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset',
                }}
                whileHover={{ scale: 1.03, boxShadow: '0 0 0 2px #428475, 0 8px 32px rgba(66,132,117,0.22)' }}
                whileTap={{ scale: 0.97 }}
              >
                Start for Free
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </motion.a>

              <motion.a
                href="#showcase"
                className="inline-flex items-center gap-2.5 px-7 py-[13px] rounded-xl text-[14px] font-medium tracking-[-0.01em]"
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #428475',
                  color: '#428475',
                  boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset',
                }}
                whileHover={{ scale: 1.02, boxShadow: '0 0 0 2px #428475, 0 4px 18px rgba(66,132,117,0.18)' }}
                whileTap={{ scale: 0.97 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
                </svg>
                Watch Demo
              </motion.a>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.92 }}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center gap-3">
                {/* Animated photo avatar stack */}
                <div className="flex -space-x-2">
                  {HERO_AVATARS.map((url, i) => (
                    <motion.div
                      key={i}
                      className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                      style={{
                        boxShadow: '0 0 0 2px var(--bg)',
                        zIndex: 5 - i,
                      }}
                      initial={{ opacity: 0, scale: 0.5, x: -8 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: 0.92 + i * 0.07, ease: EASE }}
                      whileHover={{ scale: 1.12, zIndex: 10 }}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </motion.div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#D4A017" stroke="none" aria-hidden>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-[13px] tracking-tight" style={{ color: 'var(--text)' }}>
                    Loved by <span style={{ fontWeight: 700, fontFamily: 'var(--font-syne)' }}>2,400+</span> users
                  </span>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-5 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                {STATS.map(({ val, label }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span
                      className="leading-none tabular-nums"
                      style={{
                        fontSize: 'clamp(18px, 1.5vw, 22px)',
                        fontWeight: 800,
                        color: 'var(--text)',
                        fontFamily: 'var(--font-syne)',
                        letterSpacing: '-0.03em',
                      }}
                    >
                      {val}
                    </span>
                    <span
                      className="text-[11px] tracking-[0.04em] uppercase"
                      style={{ color: 'var(--text-muted)', fontWeight: 500 }}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT: Dashboard mockup ── */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}
          >
            {/* Ambient glow behind mockup */}
            <div
              className="absolute inset-0 -m-12 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 55% 40%, rgba(66,132,117,0.14) 0%, transparent 60%)' }}
              aria-hidden
            />
            {/* Subtle halo ring */}
            <div
              className="absolute inset-0 -m-4 rounded-[28px] pointer-events-none"
              style={{
                background: 'transparent',
                boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px',
              }}
              aria-hidden
            />

            {/* Floating cards */}
            <StreakFloater />
            <XPFloater />
            <MayaFloater />

            {/* Dashboard mockup */}
            <div className="relative">
              <Dashboard3D />
            </div>
          </motion.div>

        </div>
      </motion.div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 inset-x-0 h-32 pointer-events-none z-20"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--bg))' }}
        aria-hidden
      />
    </section>
  )
}
