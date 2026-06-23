'use client'

import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'

const EASE: [number,number,number,number] = [0.22, 1, 0.36, 1]

const FAQS = [
  {
    q: 'What makes Ascend different from other habit trackers?',
    a: 'Ascend is the only productivity platform with Maya — an AI coach that actively learns your behavioral patterns, peak hours, and personal goals. Rather than passive logging, Maya provides proactive, personalized coaching that adapts to you daily.',
  },
  {
    q: 'How does Maya AI actually work?',
    a: "Maya runs on a state-of-the-art large language model fine-tuned on productivity and behavioral science research. She analyzes your check-in data, time patterns, and goal progress to surface insights and suggestions at exactly the right moments.",
  },
  {
    q: 'Can I try Ascend before paying?',
    a: 'Yes — the Free plan is permanently free with no credit card required. Pro and Elite plans include a 14-day full-featured trial so you can experience everything before committing.',
  },
  {
    q: 'Is my data private and secure?',
    a: "Absolutely. Your data is encrypted at rest and in transit. We never sell your personal data. Maya's AI context is isolated per-user and never used to train shared models. You can export or delete all your data at any time.",
  },
  {
    q: 'Does Ascend work offline?',
    a: 'Core habit logging and planner viewing work offline on mobile. Syncing, Maya AI, and analytics require connectivity and will update automatically when you reconnect.',
  },
  {
    q: 'Which calendar apps does Ascend integrate with?',
    a: 'Ascend integrates with Google Calendar and Apple Calendar on Pro and Elite plans. You can sync events bi-directionally, and Maya will respect your existing commitments when suggesting focus blocks.',
  },
  {
    q: 'What is the XP and gamification system?',
    a: 'XP (experience points) are earned for every completed habit, streak milestone, and focus session. XP accumulates toward levels and unlocks achievements, visual themes, and leaderboard positions. It\'s designed to make consistency feel genuinely rewarding.',
  },
  {
    q: 'Can I use Ascend with my team?',
    a: 'Elite plan includes team accountability pods where members can share streaks, challenge each other, and track collective goals. Team dashboards are available for groups up to 20.',
  },
  {
    q: 'What does Maya Voice Mode do?',
    a: 'Available on Elite, Maya Voice lets you interact with your AI coach using natural speech — perfect for quick check-ins during your commute or morning routine without opening the app.',
  },
  {
    q: 'How do I cancel my subscription?',
    a: 'Cancel anytime from your account settings — no hoops to jump through. Your Pro or Elite features remain active until the end of your billing period, after which your account moves to the Free plan.',
  },
]

function FAQItem({ q, a, index, inView }: { q: string; a: string; index: number; inView: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: EASE, delay: 0.1 + index * 0.05 }}
      className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${open ? 'rgba(66,132,117,0.3)' : 'var(--border)'}`, background: open ? 'rgba(66,132,117,0.03)' : 'var(--bg-card)', transition: 'border-color 0.2s ease, background 0.2s ease', boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset' }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-start justify-between gap-4 w-full text-left px-5 py-4"
        aria-expanded={open}
      >
        <span className="text-[14px] font-medium leading-snug flex-1" style={{ color: open ? 'var(--text)' : 'var(--text-muted)' }}>
          {q}
        </span>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: open ? '#428475' : 'var(--bg-raised)', border: `1px solid ${open ? 'rgba(66,132,117,0.4)' : 'var(--border)'}` }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={open ? 'white' : 'var(--text-faint)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-5">
              <div className="h-px w-full mb-4" style={{ background: 'var(--border)' }} />
              <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FAQSection() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const col1 = FAQS.slice(0, Math.ceil(FAQS.length / 2))
  const col2 = FAQS.slice(Math.ceil(FAQS.length / 2))

  return (
    <section ref={ref} id="faq" className="py-32 px-6 md:px-10 lg:px-16 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Hex texture */}
      <div className="absolute inset-0 pointer-events-none hex-bg" style={{ opacity: 0.35 }} aria-hidden />
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, ease: EASE }}
        >
          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] mb-5 px-3.5 py-1.5 rounded-full"
            style={{ color: 'var(--primary)', border: '1px solid rgba(66,132,117,0.25)', background: 'rgba(66,132,117,0.06)' }}>
            Common questions
          </span>
          <h2 className="text-[clamp(32px,4.5vw,56px)] font-bold tracking-[-0.035em] leading-[1.08] mb-5"
            style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
            Everything you need to know.
          </h2>
          <p className="text-[16px] leading-relaxed max-w-[440px] mx-auto" style={{ color: 'var(--text-muted)' }}>
            Still have questions? Reach us at{' '}
            <a href="mailto:hello@ascend.io" className="underline underline-offset-2 transition-colors duration-150 hover:opacity-70" style={{ color: 'var(--primary)' }}>
              hello@ascend.io
            </a>
          </p>
        </motion.div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="space-y-3">
            {col1.map((item, i) => (
              <FAQItem key={item.q} q={item.q} a={item.a} index={i} inView={inView} />
            ))}
          </div>
          <div className="space-y-3">
            {col2.map((item, i) => (
              <FAQItem key={item.q} q={item.q} a={item.a} index={col1.length + i} inView={inView} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
