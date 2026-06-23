'use client'

import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

interface ModalProps {
  trigger?: ReactNode
  title?: string
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Modal({ trigger, title, children, open: controlledOpen, onOpenChange }: ModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}

      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50"
                style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg rounded-2xl p-6"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
              >
                {title && (
                  <Dialog.Title className="text-[18px] font-bold mb-4" style={{ color: 'var(--text)', fontFamily: 'var(--font-syne)' }}>
                    {title}
                  </Dialog.Title>
                )}
                <Dialog.Description className="sr-only" />
                {children}
                <Dialog.Close asChild>
                  <button
                    className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}
                    aria-label="Close"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </Dialog.Close>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}