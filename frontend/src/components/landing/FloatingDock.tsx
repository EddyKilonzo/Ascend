'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, type MotionValue } from 'framer-motion'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const DOCK_ITEMS = [
  {
    label: 'Dashboard',
    href: '#',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
  },
  {
    label: 'Habits',
    href: '#',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>,
  },
  {
    label: 'Planner',
    href: '#',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  },
  {
    label: 'Maya',
    href: '#',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 013 3v7a3 3 0 01-6 0V5a3 3 0 013-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /></svg>,
    accent: true,
  },
  {
    label: 'Analytics',
    href: '#',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  },
  {
    label: 'Settings',
    href: '#',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>,
  },
]

function DockItem({ item, mouseX }: { item: typeof DOCK_ITEMS[0]; mouseX: MotionValue<number> }) {
  const ref = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState(false)

  const dist = useTransform(mouseX, (x) => {
    if (!ref.current) return 999
    const rect = ref.current.getBoundingClientRect()
    return Math.abs(x - (rect.left + rect.width / 2))
  })
  const size = useSpring(useTransform(dist, [0, 80, 160], [54, 44, 36]), { stiffness: 260, damping: 22 })

  return (
    <div ref={ref} className="relative flex flex-col items-center" onMouseEnter={() => setTooltip(true)} onMouseLeave={() => setTooltip(false)}>
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={{ duration: 0.12, ease: EASE }}
            className="absolute -top-9 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
          >
            {item.label}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={item.href}
        style={item.accent ? {
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #428475, #1A312C)',
          boxShadow: '0 4px 16px rgba(66,132,117,0.4)',
          color: 'white',
          borderRadius: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        } : {
          width: size,
          height: size,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          borderRadius: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
        className="transition-colors"
        whileTap={{ scale: 0.9 }}
        onMouseEnter={e => { if (!item.accent) { (e.currentTarget as HTMLAnchorElement).style.color = '#428475'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(66,132,117,0.4)' } }}
        onMouseLeave={e => { if (!item.accent) { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)' } }}
      >
        {item.icon}
      </motion.a>
    </div>
  )
}

export default function FloatingDock() {
  const mouseX = useMotionValue(Infinity)
  const [visible, setVisible] = useState(true)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.5, ease: EASE, delay: 1.5 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex md:hidden items-end gap-2 px-3 py-2.5 rounded-2xl"
          style={{
            background: 'color-mix(in srgb, var(--bg-card) 90%, transparent)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
          }}
          onMouseMove={e => mouseX.set(e.clientX)}
          onMouseLeave={() => mouseX.set(Infinity)}
        >
          {DOCK_ITEMS.map((item) => (
            <DockItem key={item.label} item={item} mouseX={mouseX} />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
