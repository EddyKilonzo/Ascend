'use client'

import * as React from 'react'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const CollapsibleRoot    = CollapsiblePrimitive.Root
const CollapsibleTrigger = CollapsiblePrimitive.Trigger
const CollapsibleContent = CollapsiblePrimitive.Content

/* Animated collapsible wrapper */
interface CollapsibleProps {
  trigger: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  contentClassName?: string
  showChevron?: boolean
}

function Collapsible({
  trigger,
  children,
  defaultOpen = false,
  open,
  onOpenChange,
  className,
  contentClassName,
  showChevron = true,
}: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isOpen = open ?? internalOpen

  const handleOpenChange = (next: boolean) => {
    setInternalOpen(next)
    onOpenChange?.(next)
  }

  return (
    <CollapsibleRoot
      open={isOpen}
      onOpenChange={handleOpenChange}
      className={cn('w-full', className)}
    >
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between gap-2',
          'text-sm font-medium text-[var(--text)]',
          'cursor-pointer select-none',
          'py-2 hover:text-[var(--primary)]',
          'transition-colors duration-[150ms]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1'
        )}
        asChild={false}
      >
        <span className="flex-1 text-left">{trigger}</span>
        {showChevron && (
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-[var(--text-muted)]',
              'transition-transform duration-[200ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]',
              isOpen && 'rotate-180'
            )}
          />
        )}
      </CollapsibleTrigger>

      <AnimatePresence initial={false}>
        {isOpen && (
          <CollapsibleContent forceMount asChild>
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1, transition: { height: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }, opacity: { duration: 0.15 } } }}
              exit={{ height: 0, opacity: 0, transition: { height: { duration: 0.2 }, opacity: { duration: 0.1 } } }}
              className="overflow-hidden"
            >
              <div className={cn('py-2', contentClassName)}>
                {children}
              </div>
            </motion.div>
          </CollapsibleContent>
        )}
      </AnimatePresence>
    </CollapsibleRoot>
  )
}

export { Collapsible, CollapsibleRoot, CollapsibleTrigger, CollapsibleContent }
