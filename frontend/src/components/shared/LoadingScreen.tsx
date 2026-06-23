'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface LoadingScreenProps {
  show?:      boolean
  label?:     string
  sublabel?:  string
  variant?:   'fullscreen' | 'overlay' | 'inline'
  size?:      'sm' | 'md' | 'lg'
  className?: string
}

const sizePx = { sm: 28, md: 40, lg: 56 }
const strokeW = { sm: 3, md: 3.5, lg: 4 }

function AscendSpinner({ size = 'md', color = 'var(--primary)' }: { size?: 'sm' | 'md' | 'lg'; color?: string }) {
  const sz  = sizePx[size]
  const sw  = strokeW[size]
  const r   = (sz - sw * 2) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * 0.72

  return (
    <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} aria-hidden>
      {/* Track */}
      <circle
        cx={sz / 2}
        cy={sz / 2}
        r={r}
        fill="none"
        stroke="var(--bg-raised)"
        strokeWidth={sw}
      />
      {/* Arc */}
      <motion.circle
        cx={sz / 2}
        cy={sz / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
        style={{ filter: `drop-shadow(0 0 4px ${color}88)`, transformOrigin: `${sz / 2}px ${sz / 2}px` }}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, ease: 'linear', repeat: Infinity }}
      />
    </svg>
  )
}

function LoadingScreen({
  show = true,
  label,
  sublabel,
  variant = 'inline',
  size = 'md',
  className,
}: LoadingScreenProps) {
  const inner = (
    <div className={cn(
      'flex flex-col items-center justify-center gap-4',
      variant === 'inline' && 'py-12',
    )}>
      {/* Logo wordmark + spinner stacked */}
      <div className="relative">
        <AscendSpinner size={size} />
      </div>

      {(label || sublabel) && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="flex flex-col items-center gap-1 text-center"
        >
          {label && (
            <p className="text-sm font-medium text-[var(--text)]">{label}</p>
          )}
          {sublabel && (
            <p className="text-xs text-[var(--text-muted)]">{sublabel}</p>
          )}
        </motion.div>
      )}

      {/* Typing dots indicator */}
      <div className="flex items-center gap-1" aria-label="Loading">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="h-1 w-1 rounded-full bg-[var(--primary)]"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  )

  if (variant === 'fullscreen') {
    return (
      <AnimatePresence>
        {show && (
          <motion.div
            key="loading-fullscreen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className={cn(
              'fixed inset-0 z-[var(--z-overlay)]',
              'bg-[var(--bg-base)] flex items-center justify-center',
              className
            )}
          >
            {inner}
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  if (variant === 'overlay') {
    return (
      <AnimatePresence>
        {show && (
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className={cn(
              'absolute inset-0 z-[var(--z-overlay)]',
              'bg-[var(--bg-overlay)] backdrop-blur-sm',
              'flex items-center justify-center rounded-[inherit]',
              className
            )}
          >
            {inner}
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      {show && inner}
    </div>
  )
}

export { LoadingScreen, AscendSpinner }
export type { LoadingScreenProps }
