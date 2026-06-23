'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import AppleInvites from '@/components/ui/smoothui/apple-invites'

const EASE: [number,number,number,number] = [0.22, 1, 0.36, 1]

const TESTIMONIAL_EVENTS = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=320&h=500&q=80',
    badge: '5 Stars',
    title: 'Sarah K.',
    subtitle: 'Product Manager · Series B',
    location: '"91-day streak and counting. Ascend changed how I approach every single day."',
    participants: [{ avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces' }],
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=320&h=500&q=80',
    badge: '5 Stars',
    title: 'James R.',
    subtitle: 'Software Engineer · FAANG',
    location: '"Maya noticed my 7am productivity peak before I did. Eerily accurate."',
    participants: [{ avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=faces' }],
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=320&h=500&q=80',
    badge: '5 Stars',
    title: 'Amara L.',
    subtitle: 'Founder & CEO',
    location: '"First app that adapts to me — not the other way around."',
    participants: [{ avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=64&h=64&fit=crop&crop=faces' }],
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=320&h=500&q=80',
    badge: '5 Stars',
    title: 'Marcus T.',
    subtitle: 'Indie Maker',
    location: '"The analytics alone are worth it. Seeing productivity patterns visualized is eye-opening."',
    participants: [{ avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=faces' }],
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1504307851069-e6a8cbda53cf?auto=format&fit=crop&w=320&h=500&q=80',
    badge: '5 Stars',
    title: 'Emma L.',
    subtitle: 'UX Researcher',
    location: '"Week 3: 21-day streak and 2.4 more hours of focused work per day."',
    participants: [{ avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=64&h=64&fit=crop&crop=faces' }],
  },
]

const TESTIMONIALS = [
  { quote: "Ascend changed how I approach every single day. The streak system is addictive in the best way — 91 days and counting.", name: 'Sarah K.',  role: 'Product Manager · Series B startup', shade: '#428475' },
  { quote: "Maya is like having a coach in my pocket. She noticed I was most productive at 7am before I did.",                       name: 'James R.',  role: 'Software Engineer · FAANG',          shade: '#2D6558' },
  { quote: "I've tried every productivity app. Ascend is the first one that adapts to me instead of making me adapt to it.",         name: 'Amara L.',  role: 'Founder & CEO',                      shade: '#5ABFAD' },
  { quote: "The analytics alone are worth it. Seeing your own productivity patterns visualized is genuinely eye-opening.",           name: 'Marcus T.', role: 'Indie Maker',                         shade: '#1A312C' },
  { quote: "Before Ascend I tracked habits in a spreadsheet. Now I wonder how I ever managed without Maya's intelligence.",          name: 'Priya N.',  role: 'UX Researcher',                      shade: '#3D7A6C' },
  { quote: "The gamification is subtle enough to feel real, not gimmicky. Earning XP genuinely motivates me daily.",                name: 'Leo C.',    role: 'Growth Lead · SaaS startup',         shade: '#6FCFBD' },
  { quote: "Week 1 I was skeptical. By week 3 I had a 21-day streak and was logging 2.4 hours more of focused work per day.",       name: 'Dana W.',   role: 'Content Creator',                    shade: '#428475' },
  { quote: "The planner syncs beautifully with my calendar and Maya's time-block suggestions are eerily accurate.",                  name: 'Tom B.',    role: 'Engineering Manager',                 shade: '#2D6558' },
]

const LOGOS = ['Linear', 'Vercel', 'Stripe', 'Notion', 'Figma', 'Loom', 'Pitch', 'Arc']

function StarRow() {
  return (
    <div className="flex gap-0.5 mb-3" aria-label="5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill="var(--primary)" stroke="none" aria-hidden>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

function TestimonialCard({ t }: { t: typeof TESTIMONIALS[0] }) {
  return (
    <div
      className="flex-shrink-0 w-[300px] rounded-2xl p-5 mx-2"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset',
      }}
    >
      <StarRow />
      <blockquote className="text-[12.5px] leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
        &ldquo;{t.quote}&rdquo;
      </blockquote>
      <div className="flex items-center gap-3 pt-3" style={{ borderTop: '1px solid rgba(66,132,117,0.15)' }}>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${t.shade} 0%, ${t.shade}AA 100%)` }}
          aria-hidden
        >
          {t.name[0]}
        </div>
        <div>
          <p className="text-[12px] font-semibold leading-none" style={{ color: 'var(--primary)' }}>{t.name}</p>
          <p className="text-[10.5px] mt-1" style={{ color: 'var(--text-faint)' }}>{t.role}</p>
        </div>
      </div>
    </div>
  )
}

function Marquee({ items, reverse = false, duration = 55 }: { items: typeof TESTIMONIALS; reverse?: boolean; duration?: number }) {
  return (
    <div className="overflow-hidden relative">
      <div className="absolute inset-y-0 left-0 w-32 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, var(--bg) 0%, transparent 100%)' }} aria-hidden />
      <div className="absolute inset-y-0 right-0 w-32 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, var(--bg) 0%, transparent 100%)' }} aria-hidden />
      <motion.div
        className="flex"
        animate={{ x: reverse ? ['0%', '50%'] : ['0%', '-50%'] }}
        transition={{ duration, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
        style={{ width: 'max-content' }}
      >
        {[...items, ...items].map((t, i) => (
          <TestimonialCard key={`${t.name}-${i}`} t={t} />
        ))}
      </motion.div>
    </div>
  )
}

export default function SocialProof() {
  const ref = useRef<HTMLElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inView = useInView(ref, { once: true, margin: '-80px' as any })

  return (
    <section ref={ref} className="py-28 overflow-hidden relative" style={{ background: 'var(--bg)' }}>
      {/* Hex texture */}
      <div className="absolute inset-0 pointer-events-none hex-bg" style={{ opacity: 0.35 }} aria-hidden />
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, ease: EASE }}
        >
          <span
            className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] mb-5 px-3.5 py-1.5 rounded-full"
            style={{ color: 'var(--primary)', border: '1px solid rgba(66,132,117,0.25)', background: 'rgba(66,132,117,0.06)' }}
          >
            Loved by thousands
          </span>
          <h2
            className="text-[clamp(32px,4.5vw,56px)] font-bold tracking-[-0.035em] leading-[1.08] mb-5"
            style={{ fontFamily: 'var(--font-syne)', color: 'var(--text)' }}
          >
            High-performers building<br />
            <span className="text-gradient-teal">extraordinary lives.</span>
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="var(--primary)" stroke="none" aria-hidden>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <span className="text-[14px] font-medium" style={{ color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>4.9</span> /5 from{' '}
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>2,400+</span> reviews
            </span>
          </div>
        </motion.div>
      </div>

      {/* AppleInvites carousel */}
      <motion.div
        className="relative mx-auto"
        style={{ height: 460, maxWidth: 900 }}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
      >
        <AppleInvites
          events={TESTIMONIAL_EVENTS}
          cardWidth={260}
          interval={4000}
        />
      </motion.div>

      {/* Scrolling marquee rows */}
      <motion.div
        className="space-y-4 mt-12"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Marquee items={TESTIMONIALS.slice(0, 4)} duration={55} />
        <Marquee items={TESTIMONIALS.slice(4)} reverse duration={65} />
      </motion.div>

      {/* Logo strip */}
      <motion.div
        className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16 mt-20 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-8" style={{ color: 'var(--text-faint)' }}>
          Used by teams at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {LOGOS.map(name => (
            <span
              key={name}
              className="text-[15px] font-bold tracking-tight"
              style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-syne)', opacity: 0.4 }}
            >
              {name}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
