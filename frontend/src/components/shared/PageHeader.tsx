'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface Breadcrumb {
  label: string
  href?: string
  onClick?: () => void
}

interface PageHeaderProps {
  title:           string
  description?:    string
  breadcrumbs?:    Breadcrumb[]
  actions?:        React.ReactNode
  badge?:          React.ReactNode
  icon?:           React.ReactNode
  compact?:        boolean
  className?:      string
  titleClassName?: string
}

function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  badge,
  icon,
  compact = false,
  className,
  titleClassName,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'flex flex-col gap-1 w-full',
        compact ? 'mb-4' : 'mb-6',
        className
      )}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 mb-1">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <span className="text-[var(--text-faint)] text-xs select-none">/</span>
              )}
              {crumb.href || crumb.onClick ? (
                <a
                  href={crumb.href}
                  onClick={crumb.onClick}
                  className={cn(
                    'text-xs text-[var(--text-muted)]',
                    'hover:text-[var(--text)] transition-colors duration-[120ms]',
                    'cursor-pointer focus-visible:outline-none focus-visible:ring-1',
                    'focus-visible:ring-[var(--primary)] rounded-[2px]'
                  )}
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-xs text-[var(--text-faint)]">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className={cn(
              'shrink-0 flex items-center justify-center',
              'rounded-[var(--radius-lg)] bg-[var(--bg-raised)]',
              compact ? 'h-8 w-8' : 'h-10 w-10',
              'text-[var(--primary)] [&_svg]:h-5 [&_svg]:w-5'
            )}>
              {icon}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className={cn(
                  'font-bold text-[var(--text)] tracking-tight leading-tight',
                  compact ? 'text-xl' : 'text-2xl',
                  titleClassName
                )}
              >
                {title}
              </h1>
              {badge}
            </div>

            {description && (
              <p className="text-sm text-[var(--text-muted)] leading-relaxed mt-0.5 max-w-prose">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export { PageHeader }
export type { PageHeaderProps, Breadcrumb }
