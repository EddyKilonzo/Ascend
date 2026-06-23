'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

interface EmptyStateAction {
  label:    string
  onClick:  () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  icon?:    React.ReactNode
}

interface EmptyStateProps {
  icon?:        React.ReactNode
  title:        string
  description?: string
  actions?:     EmptyStateAction[]
  size?:        'sm' | 'md' | 'lg'
  className?:   string
}

const sizeMap = {
  sm: { icon: 'h-8 w-8', title: 'text-sm font-semibold', desc: 'text-xs', gap: 'gap-2', pad: 'py-8' },
  md: { icon: 'h-10 w-10', title: 'text-base font-semibold', desc: 'text-sm', gap: 'gap-3', pad: 'py-12' },
  lg: { icon: 'h-14 w-14', title: 'text-lg font-semibold', desc: 'text-sm', gap: 'gap-4', pad: 'py-16' },
}

function EmptyState({
  icon,
  title,
  description,
  actions,
  size = 'md',
  className,
}: EmptyStateProps) {
  const s = sizeMap[size]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'flex flex-col items-center justify-center text-center w-full',
        s.pad, s.gap,
        className
      )}
    >
      {icon && (
        <div className={cn(
          s.icon,
          'rounded-[var(--radius-xl)] bg-[var(--bg-raised)]',
          'flex items-center justify-center',
          'text-[var(--text-muted)] [&_svg]:h-5 [&_svg]:w-5'
        )}>
          {icon}
        </div>
      )}

      <div className="flex flex-col items-center gap-1.5 max-w-xs">
        <p className={cn(s.title, 'text-[var(--text)]')}>{title}</p>
        {description && (
          <p className={cn(s.desc, 'text-[var(--text-muted)] leading-relaxed')}>{description}</p>
        )}
      </div>

      {actions && actions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
          {actions.map((action, i) => (
            <Button
              key={i}
              variant={action.variant ?? (i === 0 ? 'primary' : 'secondary')}
              size="sm"
              leftIcon={action.icon}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export { EmptyState }
export type { EmptyStateProps, EmptyStateAction }
