'use client'

import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'

const EASE: [number,number,number,number] = [0.22, 1, 0.36, 1]

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Start your journey',
    monthlyPrice: 0,
    annualPrice: 0,
    accent: 'var(--text-muted)',
    accentLight: 'rgba(255,255,255,0.06)',
    border: 'var(--border)',
    cta: 'Start for Free',
    ctaStyle: { background: 'var(--bg-card)', color: 'var(--primary)', border: '1.5px solid var(--primary)' },
    features: [
      '5 habits tracked',
      '7-day streak history',
      'Basic analytics',
      'Daily planner',
      'Maya AI (10 msgs/day)',
      'Mobile access',
    ],
    limits: ['No XP gamification', 'No export', 'Community support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For serious achievers',
    monthlyPrice: 12,
    annualPrice: 9,
    accent: '#428475',
    accentLight: 'rgba(66,132,117,0.08)',
    border: 'rgba(66,132,117,0.35)',
    popular: true,
    cta: 'Start Pro Trial',
    ctaStyle: {
      background: 'linear-gradient(135deg, #428475 0%, #1A312C 100%)',
      color: 'white',
      boxShadow: '0 1px 0 rgba(255,255,255,0.12) inset, 0 6px 32px rgba(66,132,117,0.4)',
    },
    features: [
      'Unlimited habits',
      'Full streak history & heatmaps',
      'Advanced analytics',
      'AI-powered planner',
      'Maya AI (unlimited)',
      'XP, achievements & levels',
      'Calendar integrations',
      'Export to CSV/PDF',
      'Priority support',
    ],
    limits: [],
  },
  {
    id: 'elite',
    name: 'Elite',
    tagline: 'Peak performance unlocked',
    monthlyPrice: 29,
    annualPrice: 22,
    accent: '#D4A017',
    accentLight: 'rgba(212,160,23,0.06)',
    border: 'rgba(212,160,23,0.3)',
    cta: 'Go Elite',
    ctaStyle: {
      background: 'linear-gradient(135deg, #D4A017 0%, #92600E 100%)',
      color: 'white',
      boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset, 0 6px 28px rgba(212,160,23,0.35)',
    },
    features: [
      'Everything in Pro',
      'Maya voice mode',
      'OCR receipt & doc scanning',
      'Custom AI coaching cadence',
      'Team accountability pods',
      'API access',
      'Dedicated coach (monthly)',
      '1-on-1 onboarding call',
      'SLA-backed support',
    ],
    limits: [],
  },
]

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

interface Plan { id: string; name: string; tagline: string; monthlyPrice: number; annualPrice: number; accent: string; accentLight: string; border: string; popular?: boolean; cta: string; ctaStyle: React.CSSProperties; features: string[]; limits: string[] }

function PlanCard({ plan, annual, index, inView }: { plan: Plan; annual: boolean; index: number; inView: boolean }) {
  const price = annual ? plan.annualPrice : plan.monthlyPrice
  const savePct = plan.monthlyPrice > 0 ? Math.round(((plan.monthlyPrice - plan.annualPrice) / plan.monthlyPrice) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 48 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: EASE, delay: 0.2 + index * 0.1 }}
      className="relative flex flex-col rounded-2xl p-7 overflow-hidden"
      style={{
        background: plan.popular ? plan.accentLight : 'var(--bg-card)',
        border: `1px solid ${plan.border}`,
        boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset',
      }}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px">
          <div
            className="px-4 py-1 rounded-b-xl text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ background: plan.accent, color: 'white' }}
          >
            Most Popular
          </div>
        </div>
      )}

      {/* Corner glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${plan.accent}12 0%, transparent 70%)` }} aria-hidden />

      {/* Header */}
      <div className="mb-6">
        <span className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: plan.accent }}>
          {plan.name}
        </span>
        <p className="text-[13px] mb-5" style={{ color: 'var(--text-muted)' }}>{plan.tagline}</p>

        <div className="flex items-end gap-2">
          <AnimatePresence mode="wait">
            <motion.span
              key={`${plan.id}-${annual}`}
              className="text-[48px] font-bold leading-none tracking-tight"
              style={{ color: 'var(--text)', fontFamily: 'var(--font-syne)' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {price === 0 ? 'Free' : `$${price}`}
            </motion.span>
          </AnimatePresence>
          {price > 0 && (
            <div className="pb-2">
              <p className="text-[12px]" style={{ color: 'var(--text-faint)' }}>/mo</p>
              {annual && savePct > 0 && (
                <p className="text-[10px] font-semibold" style={{ color: plan.accent }}>
                  Save {savePct}%
                </p>
              )}
            </div>
          )}
        </div>

        {annual && plan.monthlyPrice > 0 && (
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-faint)' }}>
            Billed ${plan.annualPrice * 12}/yr
          </p>
        )}
      </div>

      {/* CTA */}
      <motion.a
        href="/signup"
        className="flex items-center justify-center gap-1.5 w-full py-3 rounded-xl text-[14px] font-semibold mb-7"
        style={plan.ctaStyle}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        {plan.cta}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </motion.a>

      {/* Divider */}
      <div className="h-px w-full mb-6" style={{ background: `linear-gradient(to right, transparent, ${plan.border}, transparent)` }} />

      {/* Features */}
      <ul className="space-y-3 flex-1">
        {plan.features.map(f => (
          <li key={f} className="flex items-start gap-2.5">
            <span className="mt-[1px] flex-shrink-0"><CheckIcon color={plan.accent} /></span>
            <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{f}</span>
          </li>
        ))}
        {plan.limits.map(l => (
          <li key={l} className="flex items-start gap-2.5">
            <span className="mt-[1px] flex-shrink-0"><XIcon /></span>
            <span className="text-[13px]" style={{ color: 'var(--text-faint)' }}>{l}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

export default function PricingSection() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [annual, setAnnual] = useState(true)

  return (
    <section ref={ref} id="pricing" className="relative py-32 px-6 md:px-10 lg:px-16 overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
      {/* Hex texture */}
      <div className="absolute inset-0 pointer-events-none hex-bg" style={{ opacity: 0.35 }} aria-hidden />
      {/* Background orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(66,132,117,0.05) 0%, transparent 60%)', filter: 'blur(60px)' }} aria-hidden />

      <div className="max-w-[1200px] mx-auto relative">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, ease: EASE }}
        >
          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] mb-5 px-3.5 py-1.5 rounded-full"
            style={{ color: 'var(--primary)', border: '1px solid rgba(66,132,117,0.25)', background: 'rgba(66,132,117,0.06)' }}>
            Simple pricing
          </span>
          <h2 className="text-[clamp(32px,4.5vw,56px)] font-bold tracking-[-0.035em] leading-[1.08] mb-5"
            style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}>
            Invest in yourself.<br />
            <span className="text-gradient-teal">Not in subscriptions.</span>
          </h2>

          {/* Billing toggle */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.2, ease: EASE }}
            className="flex items-center justify-center gap-3 mt-8"
          >
            <button
              onClick={() => setAnnual(false)}
              className="text-[13px] font-medium transition-colors duration-150"
              style={{ color: !annual ? 'var(--text)' : 'var(--text-faint)' }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(v => !v)}
              className="relative w-11 h-6 rounded-full transition-colors duration-200"
              style={{ background: annual ? '#428475' : 'var(--bg-raised)', border: '1px solid var(--border)' }}
              aria-label="Toggle annual billing"
            >
              <motion.div
                className="absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white"
                animate={{ x: annual ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              />
            </button>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setAnnual(true)}
                className="text-[13px] font-medium transition-colors duration-150"
                style={{ color: annual ? 'var(--text)' : 'var(--text-faint)' }}
              >
                Annual
              </button>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(66,132,117,0.1)', color: '#428475' }}>
                Save up to 25%
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} annual={annual} index={i} inView={inView} />
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          className="text-center text-[12px] mt-10"
          style={{ color: 'var(--text-faint)' }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.7 }}
        >
          All plans include a 14-day free trial. No credit card required to start. Cancel anytime.
        </motion.p>
      </div>
    </section>
  )
}
