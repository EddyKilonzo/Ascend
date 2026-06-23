'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { MobileNav } from './MobileNav'
import { MayaDock } from './MayaDock'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Props {
  children: React.ReactNode
}

export function DashboardLayoutClient({ children }: Props) {
  const pathname = usePathname()

  return (
    <div className={cn('flex h-dvh overflow-hidden', 'bg-[var(--bg)]')}>

      {/* ── Sidebar (desktop + mobile overlay) ── */}
      <Sidebar />

      {/* ── Main content column ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

        {/* Top navigation bar */}
        <TopNav />

        {/* Scrollable page content */}
        <main
          id="main-content"
          className={cn(
            'flex-1 overflow-y-auto overflow-x-hidden',
            /* Bottom padding for mobile dock */
            'pb-[var(--mobile-dock-height)] md:pb-0',
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{
                duration: 0.22,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Mobile bottom navigation ── */}
      <MobileNav />

      {/* ── Maya floating dock ── */}
      <MayaDock />
    </div>
  )
}
