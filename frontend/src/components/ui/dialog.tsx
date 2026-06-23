'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { overlayVariants, dialogVariants } from '@/lib/utils/animations'

const Dialog         = DialogPrimitive.Root
const DialogTrigger  = DialogPrimitive.Trigger
const DialogPortal   = DialogPrimitive.Portal
const DialogClose    = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-[var(--z-modal)]',
      'bg-[var(--bg-overlay)] backdrop-blur-sm',
      'data-[state=open]:animate-fade-in',
      'data-[state=closed]:animate-fade-in [&[data-state=closed]]:opacity-0',
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

const sizeMap: Record<DialogSize, string> = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)]',
}

interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: DialogSize
  showClose?: boolean
  overlayClassName?: string
}

const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, DialogContentProps>(
  ({ className, children, size = 'md', showClose = true, overlayClassName, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay className={overlayClassName} />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed left-1/2 top-1/2 z-[var(--z-modal)]',
          '-translate-x-1/2 -translate-y-1/2',
          'w-[calc(100%-2rem)]',
          sizeMap[size],
          'rounded-[var(--radius-xl)] border border-[var(--border)]',
          'bg-[var(--bg-card)] shadow-primary',
          'outline-none',
          'data-[state=open]:animate-scale-in',
          'data-[state=closed]:animate-fade-in [&[data-state=closed]]:opacity-0 [&[data-state=closed]]:scale-95',
          className
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogClose
            className={cn(
              'absolute right-4 top-4 rounded-[var(--radius-sm)] p-1.5',
              'text-[var(--text-muted)] hover:text-[var(--text)]',
              'hover:bg-[var(--bg-raised)]',
              'transition-colors duration-[150ms]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
              'disabled:pointer-events-none'
            )}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </DialogClose>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
)
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-6 pb-0', className)} {...props} />
  )
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-end gap-3 p-6 pt-4',
        'border-t border-[var(--border)]',
        className
      )}
      {...props}
    />
  )
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-snug tracking-tight text-[var(--text)]', className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-[var(--text-muted)] leading-relaxed mt-1', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

const DialogBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-4', className)} {...props} />
  )
)
DialogBody.displayName = 'DialogBody'

export {
  Dialog, DialogTrigger, DialogPortal, DialogClose, DialogOverlay,
  DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogBody,
}
