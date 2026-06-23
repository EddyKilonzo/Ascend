'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const EASE: [number,number,number,number] = [0.22, 1, 0.36, 1]

export default function CTASection() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="relative py-32 px-6 md:px-10 lg:px-16 overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
      {/* Hex texture */}
      <div className="absolute inset-0 pointer-events-none hex-bg" style={{ opacity: 0.35 }} aria-hidden />
      {/* Cinematic backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(66,132,117,0.16) 0%, transparent 60%)', filter: 'blur(40px)' }} />
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(66,132,117,0.07) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(212,160,23,0.04) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.02]">
          <svg className="w-full h-full">
            <defs><pattern id="cta-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="var(--primary)" strokeWidth="0.5" />
            </pattern></defs>
            <rect width="100%" height="100%" fill="url(#cta-grid)" />
          </svg>
        </div>
      </div>

      <div className="relative max-w-[760px] mx-auto text-center">
        {/* Overline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: EASE }}
          className="flex justify-center mb-7"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ color: 'var(--primary)', border: '1px solid rgba(66,132,117,0.25)', background: 'rgba(66,132,117,0.06)' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70" style={{ background: 'var(--primary)' }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--primary)' }} />
            </span>
            Your best self is waiting
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, ease: EASE, delay: 0.1 }}
          className="font-bold tracking-[-0.04em] leading-[1.04] mb-6"
          style={{
            fontSize: 'clamp(44px, 6.5vw, 80px)',
            fontFamily: 'var(--font-amagro, var(--font-syne))',
            color: 'var(--text)',
          }}
        >
          Build the life you&apos;ve been
          <br />
          <span className="text-gradient-teal">planning for.</span>
        </motion.h2>

        {/* Sub-copy */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: EASE, delay: 0.2 }}
          className="text-[18px] leading-[1.72] max-w-[520px] mx-auto mb-10"
          style={{ color: 'var(--text-muted)' }}
        >
          Join 2,400 high-performers who use Ascend to turn intentions into systems
          and systems into extraordinary results — guided by Maya every step of the way.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <motion.a
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-[15px] rounded-xl text-[15px] font-semibold w-full sm:w-auto justify-center"
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #428475',
              color: '#428475',
              boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset',
            }}
            whileHover={{ scale: 1.03, boxShadow: '0 0 0 2px #428475, 0 8px 32px rgba(66,132,117,0.22)' }}
            whileTap={{ scale: 0.97 }}
          >
            Start for Free — No Credit Card
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </motion.a>
          <motion.a
            href="#pricing"
            className="inline-flex items-center justify-center gap-2 px-8 py-[15px] rounded-xl text-[15px] font-semibold w-full sm:w-auto"
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #428475',
              color: '#428475',
              boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset',
            }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 0 2px #428475, 0 4px 16px rgba(66,132,117,0.18)' }}
            whileTap={{ scale: 0.97 }}
          >
            View Pricing
          </motion.a>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-10"
        >
          {[
            { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, text: 'SOC 2 compliant' },
            { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>, text: 'End-to-end encrypted' },
            { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="20 6 9 17 4 12" /></svg>, text: '14-day free trial' },
            { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>, text: 'Cancel anytime' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-1.5" style={{ color: 'var(--text-faint)' }}>
              {icon}
              <span className="text-[11.5px]">{text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
