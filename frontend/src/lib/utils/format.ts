import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'
import calendar from 'dayjs/plugin/calendar'
import utc from 'dayjs/plugin/utc'

dayjs.extend(relativeTime)
dayjs.extend(duration)
dayjs.extend(calendar)
dayjs.extend(utc)

/* ─── Date & time ─── */

export function formatDate(date: string | Date | null | undefined, fmt = 'MMM D, YYYY'): string {
  if (!date) return '—'
  return dayjs(date).format(fmt)
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return dayjs(date).format('MMM D, YYYY · h:mm A')
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return dayjs(date).format('h:mm A')
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return dayjs(date).fromNow()
}

export function formatCalendar(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return dayjs(date).calendar(null, {
    sameDay:  '[Today at] h:mm A',
    lastDay:  '[Yesterday at] h:mm A',
    lastWeek: 'dddd [at] h:mm A',
    nextDay:  '[Tomorrow at] h:mm A',
    nextWeek: 'dddd [at] h:mm A',
    sameElse: 'MMM D, YYYY',
  })
}

export function formatDayShort(date: string | Date): string {
  return dayjs(date).format('ddd, MMM D')
}

export function formatMonthYear(date: string | Date): string {
  return dayjs(date).format('MMMM YYYY')
}

export function isToday(date: string | Date): boolean {
  return dayjs(date).isSame(dayjs(), 'day')
}

export function isThisWeek(date: string | Date): boolean {
  return dayjs(date).isSame(dayjs(), 'week')
}

/* ─── Duration / timer ─── */

/** 90 → "1h 30m", 45 → "45m", 0 → "0m" */
export function formatDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0m'
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/** 3661 → "1:01:01", 90 → "1:30", 45 → "0:45" */
export function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  if (h > 0) return `${h}:${mm}:${ss}`
  return `${mm}:${ss}`
}

/** 95 seconds → "1m 35s" */
export function formatDurationVerbose(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (s === 0) return `${m}m`
  return `${m}m ${s}s`
}

/* ─── Numbers ─── */

/** 1234567 → "1,234,567" */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n)
}

/** 1500 → "1.5k", 2000000 → "2M" */
export function formatCompact(n: number): string {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

/** 0.856 → "86%" */
export function formatPercent(ratio: number, decimals = 0): string {
  return `${(ratio * 100).toFixed(decimals)}%`
}

/** 85.6 → "86" (already in percent) */
export function formatScore(score: number): string {
  return Math.round(score).toString()
}

/** 100 → "$1.00" */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

/* ─── XP / Gamification ─── */

/** 1500 → "1.5k XP", 500 → "500 XP" */
export function formatXP(xp: number): string {
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M XP`
  if (xp >= 1_000)     return `${(xp / 1_000).toFixed(1)}k XP`
  return `${xp} XP`
}

/** 7 → "7-day streak", 1 → "1-day streak" */
export function formatStreak(days: number): string {
  return `${days}-day streak`
}

/** 0.95 → "95%" completion */
export function formatCompletion(rate: number): string {
  return `${Math.round(rate * 100)}%`
}

/* ─── Strings ─── */

/** Truncate with ellipsis */
export function truncate(str: string, max: number): string {
  if (!str || str.length <= max) return str
  return `${str.slice(0, max - 1)}…`
}

/** "hello world" → "Hello World" */
export function titleCase(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase())
}

/** "helloWorld" | "hello_world" → "Hello World" */
export function humanize(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\s/, '')
    .replace(/\b\w/g, c => c.toUpperCase())
}

/** Pluralize: pluralize(1, 'habit') → "1 habit", pluralize(3, 'habit') → "3 habits" */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

/* ─── File ─── */

/** 1536 → "1.5 KB" */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 ** 2)   return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3)   return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`
}

/* ─── Initials ─── */

/** "Eddy Kilonzo" → "EK" */
export function getInitials(name: string, max = 2): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, max)
    .map(w => w[0].toUpperCase())
    .join('')
}

/* ─── Color for scores ─── */

/** Returns semantic color class based on 0-100 score */
export function scoreToColor(score: number): string {
  if (score >= 80) return 'text-[var(--success)]'
  if (score >= 60) return 'text-[var(--warning)]'
  return 'text-[var(--danger)]'
}

/** Returns pill variant name based on 0-100 score */
export function scoreToPill(score: number): 'pill-green' | 'pill-yellow' | 'pill-red' {
  if (score >= 80) return 'pill-green'
  if (score >= 60) return 'pill-yellow'
  return 'pill-red'
}
