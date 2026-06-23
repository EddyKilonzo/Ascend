'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import {
  LayoutDashboard, Repeat2, CalendarDays, CheckSquare2,
  Target, TrendingUp, Sparkles, Settings, ChevronsLeft,
  Flame, Zap, X,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useSidebarStore } from '@/store/sidebar.store'
import { Avatar } from '@/components/ui/avatar'

/* ── Constants ───────────────────────────────────────────── */
const SIDEBAR_W   = 256
const COLLAPSED_W = 64

const SPRING = {
  type:      'spring' as const,
  stiffness: 320,
  damping:   32,
  mass:      0.85,
}

const LABEL_TRANSITION = {
  duration: 0.16,
  ease:     [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
}

/* ── Nav definition ─────────────────────────────────────── */
interface NavItem {
  id:      string
  label:   string
  icon:    React.ComponentType<{ className?: string }>
  href:    string
  badge?:  number
}

const NAV_MAIN: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'habits',    label: 'Habits',    icon: Repeat2,          href: '/habits' },
  { id: 'planner',   label: 'Planner',   icon: CalendarDays,     href: '/planner' },
  { id: 'tasks',     label: 'Tasks',     icon: CheckSquare2,     href: '/tasks' },
  { id: 'goals',     label: 'Goals',     icon: Target,           href: '/goals' },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp,       href: '/analytics' },
  { id: 'maya',      label: 'Maya AI',   icon: Sparkles,         href: '/maya' },
]

const NAV_BOTTOM: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
]

/* ── Tooltip wrapper for collapsed items ────────────────── */
function NavTooltip({
  label,
  children,
  disabled,
}: {
  label:    string
  children: React.ReactNode
  disabled: boolean
}) {
  if (disabled) return <>{children}</>
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <span>{children}</span>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="right"
            sideOffset={14}
            className={cn(
              'z-[var(--z-tooltip)] rounded-[var(--radius)] px-3 py-1.5',
              'bg-[var(--bg-card)] border border-[var(--border)]',
              'text-xs font-medium text-[var(--text)] shadow-4',
              'animate-fade-right origin-left',
            )}
          >
            {label}
            <TooltipPrimitive.Arrow className="fill-[var(--border)]" width={10} height={5} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

/* ── Single nav item ────────────────────────────────────── */
function SidebarNavItem({
  item,
  active,
  collapsed,
  onClick,
}: {
  item:      NavItem
  active:    boolean
  collapsed: boolean
  onClick?:  () => void
}) {
  const Icon = item.icon

  const link = (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'group relative flex items-center gap-3 rounded-[var(--radius-lg)]',
        'transition-colors duration-[120ms] outline-none',
        'focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1',
        collapsed
          ? 'w-10 h-10 justify-center mx-auto'
          : 'px-3 py-2.5 w-full',
        active
          ? 'bg-[var(--primary-glow)] text-[var(--primary)]'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-raised)] hover:text-[var(--text)]',
      )}
    >
      {/* Sliding active bar on the left edge */}
      {active && (
        <motion.div
          layoutId="sidebar-active-bar"
          className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--primary)]"
          transition={SPRING}
          aria-hidden
        />
      )}

      {/* Icon with micro-scale */}
      <motion.span
        className="relative shrink-0"
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <Icon className="h-[18px] w-[18px]" />
        {/* Active glow dot */}
        {active && (
          <motion.span
            layoutId={`nav-dot-${item.id}`}
            className="absolute -right-[3px] -top-[3px] h-[7px] w-[7px] rounded-full bg-[var(--primary)]"
            style={{ boxShadow: '0 0 8px var(--primary)' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={SPRING}
            aria-hidden
          />
        )}
      </motion.span>

      {/* Label — fades on collapse */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            key="label"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={LABEL_TRANSITION}
            className="flex-1 truncate text-sm font-medium whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Badge */}
      <AnimatePresence>
        {!collapsed && item.badge != null && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={SPRING}
            className={cn(
              'ml-auto min-w-[18px] h-[18px] rounded-full px-1',
              'bg-[var(--primary)] text-white text-[10px] font-semibold',
              'flex items-center justify-center tabular-nums',
            )}
          >
            {item.badge > 99 ? '99+' : item.badge}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  )

  return (
    <NavTooltip label={item.label} disabled={!collapsed}>
      {link}
    </NavTooltip>
  )
}

/* ── Streak mini-card ───────────────────────────────────── */
function StreakCard({ collapsed }: { collapsed: boolean }) {
  const STREAK = 7   // would come from store in production
  const XP     = 2450

  return (
    <div
      className={cn(
        'mx-3 rounded-[var(--radius-lg)] border border-[var(--border)]',
        'bg-[var(--bg-raised)] overflow-hidden',
        'transition-all duration-[250ms]',
        collapsed ? 'mx-2 p-2' : 'p-3',
      )}
    >
      {collapsed ? (
        /* Icon-only when collapsed */
        <div className="flex flex-col items-center gap-2">
          <NavTooltip label={`${STREAK} day streak`} disabled={false}>
            <span className="flex items-center justify-center text-[var(--warning)]">
              <Flame className="h-4 w-4" />
            </span>
          </NavTooltip>
          <NavTooltip label={`${XP.toLocaleString()} XP`} disabled={false}>
            <span className="flex items-center justify-center text-[var(--gold)]">
              <Zap className="h-4 w-4" />
            </span>
          </NavTooltip>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          <motion.div
            key="streak-expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-[var(--warning)]" />
                <span className="text-xs font-semibold text-[var(--text)]">
                  {STREAK} day streak
                </span>
              </div>
              <span className="text-[10px] font-medium text-[var(--text-muted)]">Keep it up</span>
            </div>

            {/* Streak bar */}
            <div className="flex gap-[3px]">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 flex-1 rounded-full',
                    i < STREAK
                      ? 'bg-[var(--warning)]'
                      : 'bg-[var(--bg-sunken)]',
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-[var(--gold)]" />
              <span className="text-[11px] font-medium text-[var(--text-muted)]">
                <span className="text-[var(--gold)] font-semibold">{XP.toLocaleString()}</span> XP today
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

/* ── User section ───────────────────────────────────────── */
function SidebarUser({ collapsed }: { collapsed: boolean }) {
  return (
    <NavTooltip label="Eddy Kilonzo" disabled={!collapsed}>
      <div
        className={cn(
          'flex items-center gap-3 rounded-[var(--radius-lg)]',
          'px-3 py-2.5 mx-3',
          'hover:bg-[var(--bg-raised)] transition-colors duration-[120ms] cursor-pointer',
          collapsed && 'justify-center mx-2 px-0 py-2',
        )}
      >
        <Avatar
          fallback="EK"
          size="sm"
          online
          className="shrink-0"
        />
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="user-info"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={LABEL_TRANSITION}
              className="flex-1 min-w-0"
            >
              <p className="text-sm font-medium text-[var(--text)] truncate">Eddy Kilonzo</p>
              <p className="text-[10px] text-[var(--text-muted)] truncate">Pro Plan · Lv. 12</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </NavTooltip>
  )
}

/* ── Shared sidebar content ─────────────────────────────── */
function SidebarContent({
  collapsed,
  onClose,
}: {
  collapsed: boolean
  onClose?:  () => void
}) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">

      {/* ── Brand ── */}
      <div
        className={cn(
          'flex h-[var(--header-height)] shrink-0 items-center border-b border-[var(--border)]',
          collapsed ? 'justify-center px-0' : 'px-4 gap-3',
        )}
      >
        {/* Logo mark */}
        <div className="shrink-0 flex items-center justify-center h-8 w-8">
          <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden>
            <path
              d="M16 3 L29 26 L3 26 Z"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M16 10 L24 26 L8 26 Z"
              fill="var(--primary)"
              opacity="0.35"
            />
          </svg>
        </div>

        {/* Wordmark */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="wordmark"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={LABEL_TRANSITION}
              className="flex-1 min-w-0"
            >
              <span
                className="text-base font-bold tracking-tight text-[var(--text)]"
                style={{ fontFamily: 'var(--font-syne, inherit)' }}
              >
                Ascend
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile close */}
        {onClose && !collapsed && (
          <button
            onClick={onClose}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-[var(--radius)]',
              'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-raised)]',
              'transition-colors duration-[120ms]',
            )}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Main nav ── */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5"
        aria-label="Main navigation"
      >
        {NAV_MAIN.map(item => (
          <SidebarNavItem
            key={item.id}
            item={item}
            active={pathname.startsWith(item.href)}
            collapsed={collapsed}
            onClick={onClose}
          />
        ))}
      </nav>

      {/* ── Streak card ── */}
      <div className="py-2">
        <StreakCard collapsed={collapsed} />
      </div>

      {/* ── Divider ── */}
      <div className="mx-3 h-px bg-[var(--border)]" />

      {/* ── Bottom nav ── */}
      <div className="py-2 px-2 space-y-0.5">
        {NAV_BOTTOM.map(item => (
          <SidebarNavItem
            key={item.id}
            item={item}
            active={pathname.startsWith(item.href)}
            collapsed={collapsed}
            onClick={onClose}
          />
        ))}
      </div>

      {/* ── User ── */}
      <div className="py-3 border-t border-[var(--border)]">
        <SidebarUser collapsed={collapsed} />
      </div>
    </div>
  )
}

/* ── Collapse toggle button ─────────────────────────────── */
function CollapseToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle:  () => void
}) {
  return (
    <NavTooltip label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} disabled={false}>
      <button
        onClick={onToggle}
        className={cn(
          'absolute -right-3 top-[76px]',
          'flex h-6 w-6 items-center justify-center',
          'rounded-full border border-[var(--border)]',
          'bg-[var(--bg-card)] text-[var(--text-muted)]',
          'shadow-2 hover:shadow-3 hover:text-[var(--primary)]',
          'hover:border-[var(--primary)] hover:bg-[var(--primary-glow)]',
          'transition-all duration-[150ms]',
          'outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
          'z-10',
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <motion.div
          animate={{ rotate: collapsed ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </motion.div>
      </button>
    </NavTooltip>
  )
}

/* ── Root Sidebar export ────────────────────────────────── */
export function Sidebar() {
  const { collapsed, mobileOpen, toggle, setMobileOpen } = useSidebarStore()

  /* Keyboard shortcut: Ctrl/Cmd + B */
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? COLLAPSED_W : SIDEBAR_W }}
        transition={SPRING}
        className={cn(
          'relative hidden md:flex flex-col h-dvh shrink-0',
          'bg-[var(--bg-card)] border-r border-[var(--border)]',
          'overflow-visible', /* allow the toggle btn to peek out */
        )}
        aria-label="Sidebar"
      >
        <div className="absolute inset-0 overflow-hidden">
          <SidebarContent collapsed={collapsed} />
        </div>

        {/* Collapse toggle — floats on the right edge */}
        <CollapseToggle collapsed={collapsed} onToggle={toggle} />
      </motion.aside>

      {/* ── Mobile overlay backdrop ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--bg-overlay)] md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* ── Mobile sidebar drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            key="mobile-sidebar"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={SPRING}
            style={{ width: SIDEBAR_W }}
            className={cn(
              'fixed left-0 top-0 bottom-0 z-[calc(var(--z-overlay)+1)]',
              'flex flex-col bg-[var(--bg-card)] border-r border-[var(--border)]',
              'shadow-5 md:hidden',
            )}
            aria-label="Mobile navigation"
          >
            <SidebarContent
              collapsed={false}
              onClose={() => setMobileOpen(false)}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
