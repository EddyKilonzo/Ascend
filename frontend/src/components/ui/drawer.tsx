'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const Drawer        = DialogPrimitive.Root
const DrawerTrigger = DialogPrimitive.Trigger
const DrawerClose   = DialogPrimitive.Close
const DrawerPortal  = DialogPrimitive.Portal

type DrawerSide = 'left' | 'right' | 'bottom'

const slideVariants: Record<DrawerSide, { hidden: object; visible: object }> = {
  right:  { hidden: { x: '100%', opacity: 0.6 }, visible: { x: 0, opacity: 1 } },
  left:   { hidden: { x: '-100%', opacity: 0.6 }, visible: { x: 0, opacity: 1 } },
  bottom: { hidden: { y: '100%', opacity: 0.6 }, visible: { y: 0, opacity: 1 } },
}

const sizeMap: Record<DrawerSide, Record<string, string>> = {
  right:  { sm: 'w-80', md: 'w-96', lg: 'w-[480px]', full: 'w-screen' },
  left:   { sm: 'w-80', md: 'w-96', lg: 'w-[480px]', full: 'w-screen' },
  bottom: { sm: 'h-64', md: 'h-80', lg: 'h-[480px]', full: 'h-screen' },
}

interface DrawerContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: DrawerSide
  size?: 'sm' | 'md' | 'lg' | 'full'
  showClose?: boolean
  title?: string
  description?: string
}

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-[var(--z-modal)]',
      'bg-[var(--bg-overlay)] backdrop-blur-sm',
      'data-[state=open]:animate-fade-in',
      className
    )}
    {...props}
  />
))
DrawerOverlay.displayName = 'DrawerOverlay'

const DrawerContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, DrawerContentProps>(
  ({ className, children, side = 'right', size = 'md', showClose = true, title, description, ...props }, ref) => {
    const isVertical = side === 'right' || side === 'left'
    const positionClass =
      side === 'right'  ? 'right-0 top-0 h-full' :
      side === 'left'   ? 'left-0 top-0 h-full'  :
                          'bottom-0 left-0 w-full'

    return (
      <DrawerPortal>
        <DrawerOverlay />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            'fixed z-[var(--z-modal)]',
            positionClass,
            isVertical ? sizeMap[side][size] : sizeMap[side][size],
            'bg-[var(--bg-card)] border-[var(--border)]',
            side === 'right'  && 'border-l shadow-[-20px_0_60px_rgba(0,0,0,0.15)]',
            side === 'left'   && 'border-r shadow-[20px_0_60px_rgba(0,0,0,0.15)]',
            side === 'bottom' && 'border-t rounded-t-[var(--radius-2xl)] shadow-[-0px_-20px_60px_rgba(0,0,0,0.2)]',
            'flex flex-col',
            'outline-none',
            'data-[state=open]:animate-slide-in-right data-[state=open]:data-[side=left]:animate-slide-in-left data-[state=open]:data-[side=bottom]:animate-slide-in-bottom',
            className
          )}
          {...props}
        >
          {(title || showClose) && (
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] shrink-0">
              <div>
                {title && (
                  <DialogPrimitive.Title className="text-base font-semibold text-[var(--text)] leading-snug">
                    {title}
                  </DialogPrimitive.Title>
                )}
                {description && (
                  <DialogPrimitive.Description className="text-xs text-[var(--text-muted)] mt-0.5">
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>
              {showClose && (
                <DrawerClose
                  className={cn(
                    'rounded-[var(--radius-sm)] p-1.5',
                    'text-[var(--text-muted)] hover:text-[var(--text)]',
                    'hover:bg-[var(--bg-raised)]',
                    'transition-colors duration-[150ms]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]'
                  )}
                  aria-label="Close panel"
                >
                  <X className="h-4 w-4" />
                </DrawerClose>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DrawerPortal>
    )
  }
)
DrawerContent.displayName = 'DrawerContent'

export { Drawer, DrawerTrigger, DrawerClose, DrawerPortal, DrawerOverlay, DrawerContent }
