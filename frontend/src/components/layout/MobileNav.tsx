'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Repeat2, CalendarDays, CheckSquare2, Target, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/* ── Nav definition ─────────────────────────────────────── */
const NAV = [
  { id: 'dashboard', label: 'Home',     icon: LayoutDashboard, href: '/dashboard' },
  { id: 'habits',    label: 'Habits',   icon: Repeat2,          href: '/habits' },
  { id: 'planner',   label: 'Planner',  icon: CalendarDays,     href: '/planner' },
  { id: 'tasks',     label: 'Tasks',    icon: CheckSquare2,     href: '/tasks' },
  { id: 'maya',      label: 'Maya',     icon: Sparkles,         href: '/maya' },
]

const SPRING = { type: 'spring' as const, stiffness: 380, damping: 26 }

/* ── Mobile nav bar ─────────────────────────────────────── */
export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Mobile navigation"
      className={cn(
        'fixed bottom-0 inset-x-0 z-[var(--z-sticky)]',
        'flex items-center',
        'h-[var(--mobile-dock-height)]',
        'border-t border-[var(--border)]',
        'bg-[var(--bg-card)]/80 backdrop-blur-xl',
        'md:hidden',
        /* Safe area bottom padding for notched devices */
        'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      {NAV.map(item => {
        const isActive = pathname.startsWith(item.href)
        const Icon = item.icon

        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              'relative flex flex-1 flex-col items-center justify-center gap-1',
              'h-full pt-2',
              'outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
              'transition-colors duration-[120ms]',
              isActive ? 'text-[var(--primary)]' : 'text-[var(--text-faint)]',
            )}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Active pill indicator */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-pill"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-full bg-[var(--primary)]"
                  style={{ boxShadow: '0 0 8px var(--primary)' }}
                  transition={SPRING}
                  aria-hidden
                />
              )}
            </AnimatePresence>

            {/* Icon with tap feedback */}
            <motion.span
              whileTap={{ scale: 0.84 }}
              transition={SPRING}
              className="relative"
            >
              <Icon className="h-[22px] w-[22px]" />

              {/* Active glow */}
              {isActive && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-[var(--primary)]"
                  initial={{ opacity: 0, scale: 1.5 }}
                  animate={{ opacity: 0.12, scale: 1.8 }}
                  exit={{ opacity: 0 }}
                  aria-hidden
                />
              )}
            </motion.span>

            {/* Label */}
            <motion.span
              animate={{
                color:    isActive ? 'var(--primary)'    : 'var(--text-faint)',
                fontWeight: isActive ? 600 : 400,
              }}
              transition={{ duration: 0.15 }}
              className="text-[10px] leading-none"
            >
              {item.label}
            </motion.span>
          </Link>
        )
      })}
    </nav>
  )
}
