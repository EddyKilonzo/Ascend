'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

const TooltipProvider = TooltipPrimitive.Provider
const TooltipRoot     = TooltipPrimitive.Root
const TooltipTrigger  = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-[var(--z-tooltip)]',
        'rounded-[var(--radius-sm)] px-2.5 py-1.5',
        'bg-[var(--text)] text-[var(--bg)] text-xs font-medium leading-snug',
        'shadow-4 border border-[var(--border)]',
        'max-w-[240px] text-center',
        'select-none pointer-events-none',
        /* Radix built-in animation states */
        'data-[state=delayed-open]:animate-scale-in',
        'data-[state=closed]:animate-fade-in',
        'origin-[var(--radix-tooltip-content-transform-origin)]',
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

/* Convenience wrapper */
interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  delayDuration?: number
  className?: string
  disabled?: boolean
}

function Tooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  delayDuration = 500,
  className,
  disabled = false,
}: TooltipProps) {
  if (disabled || !content) return <>{children}</>

  return (
    <TooltipRoot delayDuration={delayDuration}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} align={align} className={className}>
        {content}
      </TooltipContent>
    </TooltipRoot>
  )
}

export { Tooltip, TooltipRoot, TooltipTrigger, TooltipContent, TooltipProvider }
export type { TooltipProps }
