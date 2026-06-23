'use client'

import * as React from 'react'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import { cn } from '@/lib/utils/cn'

interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  orientation?: 'vertical' | 'horizontal' | 'both'
  hideScrollbar?: boolean
}

const ScrollArea = React.forwardRef<React.ElementRef<typeof ScrollAreaPrimitive.Root>, ScrollAreaProps>(
  ({ className, children, orientation = 'vertical', hideScrollbar = false, ...props }, ref) => (
    <ScrollAreaPrimitive.Root ref={ref} className={cn('relative overflow-hidden', className)} {...props}>
      <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>

      {!hideScrollbar && (orientation === 'vertical' || orientation === 'both') && (
        <ScrollBar orientation="vertical" />
      )}
      {!hideScrollbar && (orientation === 'horizontal' || orientation === 'both') && (
        <ScrollBar orientation="horizontal" />
      )}

      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
)
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      'flex touch-none select-none transition-opacity duration-[150ms]',
      'opacity-0 hover:opacity-100 data-[state=visible]:opacity-100',
      orientation === 'vertical'   && 'h-full w-1.5 border-l border-l-transparent p-[1px]',
      orientation === 'horizontal' && 'h-1.5 border-t border-t-transparent p-[1px]',
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb
      className="relative flex-1 rounded-full bg-[var(--border)] hover:bg-[var(--text-muted)] transition-colors duration-[150ms]"
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
