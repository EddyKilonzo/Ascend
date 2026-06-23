'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/* ── Types ── */
interface CommandItem {
  id:        string
  label:     string
  group?:    string
  icon?:     React.ReactNode
  shortcut?: string
  onSelect:  () => void
  keywords?: string[]
}

interface CommandPaletteProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  items:        CommandItem[]
  placeholder?: string
}

/* ── Internals ── */
function highlight(text: string, query: string) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[var(--primary-glow)] text-[var(--primary)] rounded-[2px]">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function CommandPalette({ open, onOpenChange, items, placeholder = 'Search anything...' }: CommandPaletteProps) {
  const [query, setQuery] = React.useState('')
  const inputRef   = React.useRef<HTMLInputElement>(null)
  const listRef    = React.useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = React.useState(0)

  const filtered = React.useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.keywords?.some(k => k.toLowerCase().includes(q))
    )
  }, [items, query])

  const grouped = React.useMemo(() => {
    const map = new Map<string, CommandItem[]>()
    filtered.forEach(item => {
      const g = item.group ?? 'Actions'
      const arr = map.get(g) ?? []
      arr.push(item)
      map.set(g, arr)
    })
    return map
  }, [filtered])

  /* Reset on open */
  React.useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  /* Keyboard navigation */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = filtered[activeIdx]
      if (item) {
        item.onSelect()
        onOpenChange(false)
      }
    } else if (e.key === 'Escape') {
      onOpenChange(false)
    }
  }

  let flatIdx = 0

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-command)] bg-[var(--bg-overlay)] backdrop-blur-sm data-[state=open]:animate-fade-in" />

        {/* Panel */}
        <DialogPrimitive.Content
          className={cn(
            'fixed z-[var(--z-command)] top-[20vh]',
            'left-1/2 -translate-x-1/2',
            'w-[calc(100%-2rem)] max-w-xl',
            'rounded-[var(--radius-xl)] border border-[var(--border)]',
            'bg-[var(--bg-card)] shadow-primary overflow-hidden',
            'outline-none',
            'data-[state=open]:animate-scale-in',
            'origin-top'
          )}
          aria-label="Command palette"
          onKeyDown={handleKeyDown}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
            <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setActiveIdx(0) }}
              placeholder={placeholder}
              className={cn(
                'flex-1 bg-transparent text-sm text-[var(--text)]',
                'placeholder:text-[var(--text-faint)]',
                'outline-none border-none'
              )}
              aria-label="Search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-faint)] bg-[var(--bg-raised)]">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div
            ref={listRef}
            className="max-h-[min(60vh,400px)] overflow-y-auto py-2"
            role="listbox"
            aria-label="Results"
          >
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : (
              Array.from(grouped.entries()).map(([group, groupItems]) => (
                <div key={group} className="px-2 mb-1 last:mb-0">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-caps text-[var(--text-faint)]">
                    {group}
                  </p>
                  {groupItems.map(item => {
                    const isActive = flatIdx === activeIdx
                    const currentIdx = flatIdx++

                    return (
                      <button
                        key={item.id}
                        role="option"
                        aria-selected={isActive}
                        onClick={() => {
                          item.onSelect()
                          onOpenChange(false)
                        }}
                        onMouseEnter={() => setActiveIdx(currentIdx)}
                        className={cn(
                          'w-full flex items-center gap-3 px-2 py-2 rounded-[var(--radius-sm)]',
                          'text-sm text-[var(--text)] text-left',
                          'transition-colors duration-[80ms]',
                          'cursor-pointer select-none',
                          isActive && 'bg-[var(--bg-raised)]'
                        )}
                      >
                        {item.icon && (
                          <span className="h-5 w-5 shrink-0 flex items-center justify-center text-[var(--text-muted)] [&_svg]:h-4 [&_svg]:w-4" aria-hidden>
                            {item.icon}
                          </span>
                        )}
                        <span className="flex-1 truncate">
                          {highlight(item.label, query)}
                        </span>
                        {item.shortcut && (
                          <span className="shrink-0 text-xs font-mono text-[var(--text-faint)] tracking-wider">
                            {item.shortcut}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-[var(--border)] text-[10px] text-[var(--text-faint)]">
            <span><kbd className="font-mono">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono">↵</kbd> Select</span>
            <span><kbd className="font-mono">ESC</kbd> Close</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export { CommandPalette }
export type { CommandItem, CommandPaletteProps }
