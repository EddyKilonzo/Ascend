'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

type ProgressVariant = 'default' | 'success' | 'warning' | 'danger' | 'gold' | 'gradient'

const trackColor: Record<ProgressVariant, string> = {
  default:  'bg-[var(--primary)]',
  success:  'bg-[var(--success)]',
  warning:  'bg-[var(--warning)]',
  danger:   'bg-[var(--danger)]',
  gold:     'bg-[var(--gold)]',
  gradient: 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)]',
}

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number
  max?: number
  variant?: ProgressVariant
  size?: 'xs' | 'sm' | 'md' | 'lg'
  label?: string
  showValue?: boolean
  animated?: boolean
}

const sizeMap = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      variant = 'default',
      size = 'md',
      label,
      showValue = false,
      animated = true,
      ...props
    },
    ref
  ) => {
    const pct = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
      <div className="w-full space-y-1.5">
        {(label || showValue) && (
          <div className="flex items-center justify-between gap-2">
            {label && (
              <span className="text-xs font-medium text-[var(--text-muted)] truncate">{label}</span>
            )}
            {showValue && (
              <span className="text-xs font-semibold text-[var(--text)] tabular-nums shrink-0">
                {Math.round(pct)}%
              </span>
            )}
          </div>
        )}

        <ProgressPrimitive.Root
          ref={ref}
          value={value}
          max={max}
          aria-label={label ?? `Progress: ${Math.round(pct)}%`}
          className={cn(
            'relative overflow-hidden rounded-full bg-[var(--bg-raised)]',
            sizeMap[size],
            className
          )}
          {...props}
        >
          <ProgressPrimitive.Indicator asChild>
            {animated ? (
              <motion.div
                className={cn('h-full rounded-full origin-left', trackColor[variant])}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: pct / 100 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                style={{ transformOrigin: 'left' }}
              />
            ) : (
              <div
                className={cn('h-full rounded-full', trackColor[variant])}
                style={{ width: `${pct}%` }}
              />
            )}
          </ProgressPrimitive.Indicator>
        </ProgressPrimitive.Root>
      </div>
    )
  }
)
Progress.displayName = 'Progress'

/* XP bar — special styled variant used in gamification */
interface XPBarProps {
  current: number
  max: number
  level?: number
  className?: string
  animated?: boolean
}

function XPBar({ current, max, level, className, animated = true }: XPBarProps) {
  const pct = Math.min((current / max) * 100, 100)

  return (
    <div className={cn('w-full space-y-1', className)}>
      {level !== undefined && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[var(--gold)]">Level {level}</span>
          <span className="text-[var(--text-muted)] tabular-nums">
            {current.toLocaleString()} / {max.toLocaleString()} XP
          </span>
        </div>
      )}
      <div className="relative h-2 rounded-full bg-[var(--bg-raised)] overflow-hidden">
        {animated ? (
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] shadow-[0_0_12px_var(--gold-glow)]"
            initial={{ width: '0%' }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          />
        ) : (
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)]"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </div>
  )
}

export { Progress, XPBar }
export type { ProgressProps }
