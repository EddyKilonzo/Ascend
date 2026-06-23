'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Menu, Search, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useSidebarStore } from '@/store/sidebar.store'
import { useUIStore } from '@/store/ui.store'
import { NotificationBell } from './NotificationCenter'
import { Avatar } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useTheme } from 'next-themes'

/* ── Route → title map ───────────────────────────────────── */
const ROUTE_TITLES: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/habits':     'Habits',
  '/planner':    'Planner',
  '/tasks':      'Tasks',
  '/goals':      'Goals',
  '/analytics':  'Analytics',
  '/maya':       'Maya AI',
  '/settings':   'Settings',
}

function usePageTitle() {
  const pathname = usePathname()
  const segment = '/' + (pathname.split('/')[1] ?? '')
  return ROUTE_TITLES[segment] ?? 'Ascend'
}

/* ── Search trigger ──────────────────────────────────────── */
function SearchTrigger() {
  const { toggleCommand } = useUIStore()

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        toggleCommand()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleCommand])

  return (
    <button
      onClick={toggleCommand}
      className={cn(
        'hidden sm:flex items-center gap-2',
        'h-9 w-full max-w-[240px] px-3',
        'rounded-[var(--radius-lg)] border border-[var(--border)]',
        'bg-[var(--bg-raised)] text-[var(--text-muted)]',
        'hover:border-[var(--border-hover)] hover:text-[var(--text)]',
        'transition-colors duration-[120ms]',
        'text-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
      )}
      aria-label="Open search (Ctrl+K)"
    >
      <Search className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 text-left text-[var(--text-faint)]">Search anything...</span>
      <kbd className="hidden lg:inline-flex items-center gap-px rounded border border-[var(--border)] bg-[var(--bg-card)] px-1.5 py-px text-[10px] font-mono text-[var(--text-faint)]">
        <span className="text-[9px]">⌘</span>K
      </kbd>
    </button>
  )
}

/* ── Theme toggle ────────────────────────────────────────── */
function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-[var(--radius-lg)]',
        'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-raised)]',
        'transition-colors duration-[120ms]',
        'outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
      )}
      aria-label="Toggle theme"
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, scale: 0.7, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 24 }}
      >
        {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
      </motion.div>
    </button>
  )
}

/* ── User menu ───────────────────────────────────────────── */
function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center gap-2 rounded-[var(--radius-lg)] p-1.5 pr-2.5',
          'hover:bg-[var(--bg-raised)] transition-colors duration-[120ms]',
          'outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
        )}
        aria-label="User menu"
      >
        <Avatar
          fallback="EK"
          size="sm"
          online
          className="h-7 w-7"
        />
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-xs font-semibold text-[var(--text)] leading-none">Eddy K.</span>
          <span className="text-[10px] text-[var(--text-muted)] leading-none mt-0.5">Lv. 12</span>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={<Search className="h-4 w-4" />} shortcut="⌘P">Profile</DropdownMenuItem>
        <DropdownMenuItem icon={<Search className="h-4 w-4" />}>Billing</DropdownMenuItem>
        <DropdownMenuItem icon={<Search className="h-4 w-4" />}>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive icon={<Search className="h-4 w-4" />}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ── TopNav ──────────────────────────────────────────────── */
export function TopNav() {
  const { toggleMobile } = useSidebarStore()
  const title = usePageTitle()

  return (
    <header
      className={cn(
        'flex h-[var(--header-height)] shrink-0 items-center gap-3 px-4',
        'border-b border-[var(--border)] bg-[var(--bg-card)]',
        'z-[var(--z-sticky)]',
      )}
    >
      {/* Mobile hamburger */}
      <button
        onClick={toggleMobile}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-[var(--radius-lg)] md:hidden',
          'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-raised)]',
          'transition-colors duration-[120ms]',
          'outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
        )}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title */}
      <motion.h1
        key={title}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="text-base font-semibold text-[var(--text)] tracking-tight shrink-0"
      >
        {title}
      </motion.h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Center: Search */}
      <SearchTrigger />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right cluster */}
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationBell />

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-[var(--border)]" aria-hidden />

        <UserMenu />
      </div>
    </header>
  )
}
