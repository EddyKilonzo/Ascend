'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Mic, Send, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useUIStore } from '@/store/ui.store'

const SPRING = { type: 'spring' as const, stiffness: 340, damping: 28, mass: 0.9 }

/* ── Orb idle animation ─────────────────────────────────── */
function MayaOrb({ listening }: { listening: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse rings */}
      {listening ? (
        <>
          <motion.div
            className="absolute h-16 w-16 rounded-full bg-[var(--primary)]"
            animate={{ scale: [1, 1.6, 1], opacity: [0.25, 0, 0.25] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute h-16 w-16 rounded-full bg-[var(--primary)]"
            animate={{ scale: [1, 2, 1], opacity: [0.15, 0, 0.15] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          />
        </>
      ) : (
        <motion.div
          className="absolute h-14 w-14 rounded-full bg-[var(--primary-glow)]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Core button */}
      <div
        className={cn(
          'relative flex h-14 w-14 items-center justify-center rounded-full',
          'bg-[var(--primary)]',
          'shadow-[0_4px_24px_var(--primary-glow-strong)]',
        )}
      >
        <Sparkles className="h-6 w-6 text-white" />
      </div>
    </div>
  )
}

/* ── Waveform bars (while listening) ────────────────────── */
function Waveform() {
  return (
    <div className="flex items-center justify-center gap-[3px] h-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-[var(--primary)]"
          animate={{ height: ['8px', '20px', '8px'] }}
          transition={{
            duration: 0.7,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

/* ── Maya panel ─────────────────────────────────────────── */
function MayaPanel({ onClose }: { onClose: () => void }) {
  const [listening, setListening] = React.useState(false)
  const [message, setMessage] = React.useState('')

  return (
    <motion.div
      key="maya-panel"
      initial={{ opacity: 0, y: 20, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.94 }}
      transition={SPRING}
      className={cn(
        'absolute bottom-[72px] right-0',
        'w-[340px] sm:w-[360px]',
        'rounded-[var(--radius-2xl)] border border-[var(--border)]',
        'bg-[var(--bg-card)] shadow-primary',
        'flex flex-col overflow-hidden',
      )}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-3',
        'border-b border-[var(--border)]',
        'bg-gradient-to-r from-[var(--bg-raised)] to-[var(--bg-card)]',
      )}>
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)]">
          <Sparkles className="h-4 w-4 text-white" />
          {/* Active dot */}
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--success)] border-2 border-[var(--bg-card)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text)]">Maya</p>
          <p className="text-[10px] text-[var(--success)]">Online · Ready to help</p>
        </div>
        <button
          onClick={onClose}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-[var(--radius)]',
            'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-raised)]',
            'transition-colors duration-[120ms]',
          )}
          aria-label="Close Maya"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 min-h-[200px] max-h-[320px] p-4 flex flex-col justify-end gap-3 overflow-y-auto">
        {/* Greeting bubble */}
        <div className="flex gap-2.5 items-end">
          <div className="h-6 w-6 shrink-0 rounded-full bg-[var(--primary)] flex items-center justify-center">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
          <div className={cn(
            'max-w-[80%] rounded-[var(--radius-xl)] rounded-bl-[var(--radius-sm)]',
            'bg-[var(--bg-raised)] px-3.5 py-2.5',
            'text-sm text-[var(--text)] leading-relaxed',
          )}>
            Hello! I&apos;m Maya, your personal AI coach. What would you like to work on today?
          </div>
        </div>

        {/* Listening indicator */}
        <AnimatePresence>
          {listening && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex gap-2.5 items-end self-end"
            >
              <div className={cn(
                'rounded-[var(--radius-xl)] rounded-br-[var(--radius-sm)]',
                'bg-[var(--primary-glow)] border border-[var(--primary)] px-3.5 py-2.5',
              )}>
                <Waveform />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className={cn(
        'flex items-center gap-2 px-3 py-3',
        'border-t border-[var(--border)]',
      )}>
        <button
          onClick={() => setListening(l => !l)}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            'transition-colors duration-[150ms]',
            listening
              ? 'bg-[var(--primary)] text-white shadow-[0_0_12px_var(--primary-glow-strong)]'
              : 'bg-[var(--bg-raised)] text-[var(--text-muted)] hover:bg-[var(--bg-sunken)]',
          )}
          aria-label={listening ? 'Stop listening' : 'Start voice input'}
        >
          {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
        </button>

        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Ask Maya anything..."
          className={cn(
            'flex-1 bg-[var(--bg-raised)] rounded-[var(--radius-full)]',
            'px-3.5 py-2 text-sm text-[var(--text)]',
            'placeholder:text-[var(--text-faint)]',
            'border border-[var(--border)]',
            'outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_2px_var(--primary-glow)]',
            'transition-[border-color,box-shadow] duration-[150ms]',
          )}
          onKeyDown={e => { if (e.key === 'Enter' && message.trim()) setMessage('') }}
        />

        <motion.button
          whileTap={{ scale: 0.88 }}
          disabled={!message.trim()}
          onClick={() => setMessage('')}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            'bg-[var(--primary)] text-white',
            'transition-opacity duration-[120ms]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
          aria-label="Send message"
        >
          <Send className="h-3.5 w-3.5" />
        </motion.button>
      </div>
    </motion.div>
  )
}

/* ── MayaDock ────────────────────────────────────────────── */
export function MayaDock() {
  const { mayaOpen, toggleMaya, setMayaOpen } = useUIStore()

  /* Keyboard: Ctrl/Cmd + M */
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault()
        toggleMaya()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleMaya])

  return (
    <div
      className="fixed bottom-6 right-6 z-[calc(var(--z-overlay)+2)] flex flex-col items-end"
      style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
    >
      <AnimatePresence>
        {mayaOpen && (
          <MayaPanel key="panel" onClose={() => setMayaOpen(false)} />
        )}
      </AnimatePresence>

      {/* FAB trigger */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        transition={SPRING}
        onClick={toggleMaya}
        className="relative outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 rounded-full"
        aria-label={mayaOpen ? 'Close Maya' : 'Open Maya AI'}
        aria-expanded={mayaOpen}
      >
        <AnimatePresence mode="wait">
          {mayaOpen ? (
            <motion.div
              key="close"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={SPRING}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] shadow-4"
            >
              <X className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div
              key="orb"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={SPRING}
            >
              <MayaOrb listening={false} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Tooltip label when closed */}
      <AnimatePresence>
        {!mayaOpen && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.5, duration: 0.2 }}
            className={cn(
              'absolute bottom-full mb-2 right-0',
              'rounded-[var(--radius)] px-2 py-1',
              'bg-[var(--bg-card)] border border-[var(--border)]',
              'text-[10px] font-medium text-[var(--text-muted)]',
              'whitespace-nowrap shadow-3 pointer-events-none',
            )}
          >
            Maya AI
            <span className="ml-1 font-mono text-[9px] text-[var(--text-faint)]">⌘M</span>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
