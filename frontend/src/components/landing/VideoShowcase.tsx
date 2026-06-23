'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Play } from 'lucide-react'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

function VideoPlayer({ src, idx }: { src: string; idx: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: EASE, delay: idx * 0.1 }}
      className="relative rounded-2xl overflow-hidden group"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="relative aspect-video">
        <video
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster="/video-placeholder.svg"
        >
          <source src={src} type="video/mp4" />
        </video>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          style={{ background: 'rgba(0,0,0,0.3)' }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.9)' }}
          >
            <Play className="w-7 h-7 ml-1" style={{ color: '#428475' }} fill="currentColor" />
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text)' }}>Watch Preview</p>
        <p className="text-[12px]" style={{ color: 'var(--text-faint)' }}>Experience the Ascend workflow</p>
      </div>
    </motion.div>
  )
}

export default function VideoShowcase() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-28 px-6 md:px-10 lg:px-16" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[1200px] mx-auto">
        <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease: EASE }}>
          <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.18em] mb-4 px-3 py-1.5 rounded-full"
            style={{ color: 'var(--primary)', border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
          >
            See Ascend in Action
          </span>
          <h2 className="text-[clamp(32px,4vw,52px)] font-bold tracking-[-0.03em] mb-4"
            style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}
          >
            The future of productivity,<br /><span className="text-gradient-teal">delivered today.</span>
          </h2>
          <p className="text-[17px] leading-relaxed max-w-[520px] mx-auto" style={{ color: 'var(--text-muted)' }}>
            Watch how Maya transforms your daily workflow — from habit tracking to deep focus sessions.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          <VideoPlayer src="/videos/habits.mp4" idx={0} />
          <VideoPlayer src="/videos/planner.mp4" idx={1} />
          <VideoPlayer src="/videos/maya-ai.mp4" idx={2} />
        </div>
      </div>
    </section>
  )
}