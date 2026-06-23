'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

/* ── Root ── */
const Tabs = TabsPrimitive.Root

/* ── List ── */
interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: 'underline' | 'pills' | 'boxed'
}

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({ className, variant = 'underline', ...props }, ref) => (
    <TabsPrimitive.List
      ref={ref}
      data-variant={variant}
      className={cn(
        'flex items-center gap-0',
        variant === 'underline' && [
          'border-b border-[var(--border)]',
          'gap-1',
        ],
        variant === 'pills' && [
          'bg-[var(--bg-raised)] rounded-[var(--radius-lg)] p-1 gap-1',
        ],
        variant === 'boxed' && [
          'bg-[var(--bg-secondary)] rounded-[var(--radius)] p-1 gap-0.5',
          'border border-[var(--border)]',
        ],
        className
      )}
      {...props}
    />
  )
)
TabsList.displayName = TabsPrimitive.List.displayName

/* ── Trigger ── */
interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  variant?: 'underline' | 'pills' | 'boxed'
  badge?: string | number
}

const TabsTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, TabsTriggerProps>(
  ({ className, variant = 'underline', badge, children, ...props }, ref) => (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'relative inline-flex items-center justify-center gap-2',
        'text-sm font-medium whitespace-nowrap',
        'transition-[color,background-color] duration-[150ms]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-inset',
        'disabled:pointer-events-none disabled:opacity-50',
        'select-none cursor-pointer',

        variant === 'underline' && [
          'px-3 py-2.5 rounded-t-sm',
          'text-[var(--text-muted)]',
          'hover:text-[var(--text)]',
          'data-[state=active]:text-[var(--primary)]',
          'after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5',
          'after:bg-[var(--primary)] after:rounded-t',
          'after:scale-x-0 data-[state=active]:after:scale-x-100',
          'after:transition-transform after:duration-[200ms] after:ease-[cubic-bezier(0.34,1.56,0.64,1)]',
        ],

        variant === 'pills' && [
          'px-3 py-1.5 rounded-[var(--radius)]',
          'text-[var(--text-muted)]',
          'hover:text-[var(--text)] hover:bg-[var(--bg-card)]',
          'data-[state=active]:bg-[var(--bg-card)] data-[state=active]:text-[var(--text)] data-[state=active]:shadow-1',
        ],

        variant === 'boxed' && [
          'flex-1 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs',
          'text-[var(--text-muted)]',
          'hover:text-[var(--text)]',
          'data-[state=active]:bg-[var(--bg-card)] data-[state=active]:text-[var(--text)] data-[state=active]:shadow-1',
        ],

        className
      )}
      {...props}
    >
      {children}
      {badge !== undefined && (
        <span className="ml-auto h-4 min-w-4 px-1 rounded-full bg-[var(--bg-raised)] text-[10px] font-semibold text-[var(--text-muted)] flex items-center justify-center tabular-nums">
          {badge}
        </span>
      )}
    </TabsPrimitive.Trigger>
  )
)
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

/* ── Content ── */
interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {
  animate?: boolean
}

const TabsContent = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Content>, TabsContentProps>(
  ({ className, animate = true, children, ...props }, ref) => (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'focus-visible:outline-none',
        animate && 'data-[state=active]:animate-fade-up',
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Content>
  )
)
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
