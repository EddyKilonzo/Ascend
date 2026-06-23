'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, X, CheckCheck, Trash2,
  Info, CheckCircle2, AlertTriangle, Trophy, Flame, Sparkles, Clock, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  useNotificationsStore,
  useUnreadCount,
  type Notification,
  type NotifType,
} from '@/store/notifications.store'
import { formatRelative } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

/* ── Type config ─────────────────────────────────────────── */
const TYPE_CONFIG: Record<NotifType, {
  icon:  React.ComponentType<{ className?: string }>
  color: string
  bg:    string
}> = {
  info:        { icon: Info,          color: 'text-[var(--info)]',    bg: 'bg-[var(--info-bg)]' },
  success:     { icon: CheckCircle2,  color: 'text-[var(--success)]', bg: 'bg-[var(--success-bg)]' },
  warning:     { icon: AlertTriangle, color: 'text-[var(--warning)]', bg: 'bg-[var(--warning-bg)]' },
  achievement: { icon: Trophy,        color: 'text-[var(--gold)]',    bg: 'bg-[var(--gold-bg)]' },
  streak:      { icon: Flame,         color: 'text-[var(--warning)]', bg: 'bg-[var(--warning-bg)]' },
  maya:        { icon: Sparkles,      color: 'text-[var(--primary)]', bg: 'bg-[var(--primary-glow)]' },
  reminder:    { icon: Clock,         color: 'text-[var(--text-muted)]', bg: 'bg-[var(--bg-raised)]' },
  xp:          { icon: Zap,           color: 'text-[var(--gold)]',    bg: 'bg-[var(--gold-bg)]' },
}

/* ── Single notification item ───────────────────────────── */
function NotifItem({ notif }: { notif: Notification }) {
  const { markRead, remove } = useNotificationsStore()
  const config = TYPE_CONFIG[notif.type]
  const Icon = config.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 16, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, x: 16, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'group relative flex gap-3 px-4 py-3',
        'border-b border-[var(--border)] last:border-0',
        !notif.read && 'bg-[var(--bg-raised)]',
        'hover:bg-[var(--bg-raised)] transition-colors duration-[100ms]',
        'cursor-pointer',
      )}
      onClick={() => !notif.read && markRead(notif.id)}
    >
      {/* Icon */}
      <div className={cn('mt-0.5 h-7 w-7 shrink-0 rounded-[var(--radius)] flex items-center justify-center', config.bg)}>
        <Icon className={cn('h-3.5 w-3.5', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm leading-snug', notif.read ? 'text-[var(--text-muted)]' : 'text-[var(--text)] font-medium')}>
          {notif.title}
        </p>
        {notif.body && (
          <p className="mt-0.5 text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
            {notif.body}
          </p>
        )}
        <p className="mt-1 text-[10px] text-[var(--text-faint)]">
          {formatRelative(notif.createdAt)}
        </p>
      </div>

      {/* Unread dot */}
      {!notif.read && (
        <div className="mt-2 shrink-0 h-2 w-2 rounded-full bg-[var(--primary)]" aria-label="Unread" />
      )}

      {/* Remove button — on hover */}
      <button
        onClick={e => { e.stopPropagation(); remove(notif.id) }}
        className={cn(
          'absolute right-3 top-3',
          'h-5 w-5 flex items-center justify-center rounded',
          'text-[var(--text-faint)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)]',
          'opacity-0 group-hover:opacity-100 transition-all duration-[120ms]',
        )}
        aria-label="Dismiss notification"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  )
}

/* ── Empty state ────────────────────────────────────────── */
function NotifEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="h-10 w-10 rounded-[var(--radius-xl)] bg-[var(--bg-raised)] flex items-center justify-center mb-3">
        <Bell className="h-5 w-5 text-[var(--text-faint)]" />
      </div>
      <p className="text-sm font-medium text-[var(--text)]">All caught up</p>
      <p className="text-xs text-[var(--text-muted)] mt-1">Notifications will appear here</p>
    </div>
  )
}

/* ── Panel ──────────────────────────────────────────────── */
function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { items, markAllRead, clearAll } = useNotificationsStore()
  const unread = useUnreadCount()
  const ref = React.useRef<HTMLDivElement>(null)

  /* Close on outside click */
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  /* Close on Escape */
  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      className={cn(
        'absolute right-0 top-full mt-2',
        'w-[360px] max-h-[520px]',
        'rounded-[var(--radius-xl)] border border-[var(--border)]',
        'bg-[var(--bg-card)] shadow-primary',
        'flex flex-col overflow-hidden',
        'origin-top-right z-[var(--z-dropdown)]',
      )}
      role="dialog"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[var(--text)]">Notifications</h2>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="min-w-[18px] h-[18px] rounded-full bg-[var(--primary)] text-white text-[10px] font-semibold flex items-center justify-center px-1 tabular-nums"
            >
              {unread > 99 ? '99+' : unread}
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <Button variant="ghost" size="icon-sm" onClick={markAllRead} title="Mark all read">
              <CheckCheck className="h-3.5 w-3.5" />
            </Button>
          )}
          {items.length > 0 && (
            <Button variant="ghost" size="icon-sm" onClick={clearAll} title="Clear all">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <AnimatePresence initial={false}>
          {items.length === 0 ? (
            <NotifEmpty />
          ) : (
            <div>
              {items.map(n => <NotifItem key={n.id} notif={n} />)}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </motion.div>
  )
}

/* ── Bell trigger (used in TopNav) ─────────────────────── */
export function NotificationBell() {
  const { panelOpen, togglePanel, setPanelOpen } = useNotificationsStore()
  const unread = useUnreadCount()

  return (
    <div className="relative">
      <button
        onClick={togglePanel}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-[var(--radius-lg)]',
          'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-raised)]',
          'transition-colors duration-[120ms]',
          'outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
          panelOpen && 'bg-[var(--bg-raised)] text-[var(--text)]',
        )}
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
        aria-expanded={panelOpen}
        aria-haspopup="dialog"
      >
        <motion.div
          animate={unread > 0 ? { rotate: [0, -8, 8, -5, 5, 0] } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          key={unread}
        >
          <Bell className="h-[18px] w-[18px]" />
        </motion.div>

        {/* Unread badge */}
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className={cn(
                'absolute -right-0.5 -top-0.5',
                'min-w-[14px] h-[14px] rounded-full px-0.5',
                'bg-[var(--primary)] text-white text-[9px] font-bold',
                'flex items-center justify-center tabular-nums',
                'shadow-[0_0_0_2px_var(--bg-card)]',
              )}
              aria-hidden
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {panelOpen && (
          <NotificationPanel onClose={() => setPanelOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
