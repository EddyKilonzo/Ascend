'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/lib/utils/cn'

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
}

const trackSize = {
  sm: 'h-5 w-9',
  md: 'h-6 w-11',
  lg: 'h-7 w-14',
}

const thumbSize = {
  sm: 'h-3.5 w-3.5 data-[state=checked]:translate-x-4',
  md: 'h-4.5 w-4.5 data-[state=checked]:translate-x-5',
  lg: 'h-5.5 w-5.5 data-[state=checked]:translate-x-7',
}

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  ({ className, label, description, size = 'md', id, ...props }, ref) => {
    const inputId = id ?? React.useId()

    return (
      <div className="flex items-center gap-3">
        <SwitchPrimitive.Root
          ref={ref}
          id={inputId}
          className={cn(
            'peer inline-flex shrink-0 cursor-pointer items-center rounded-full',
            'border-2 border-transparent',
            'transition-[background-color,box-shadow] duration-[200ms] ease-out',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'bg-[var(--bg-raised)] data-[state=checked]:bg-[var(--primary)]',
            'data-[state=checked]:shadow-[0_0_12px_var(--primary-glow)]',
            trackSize[size],
            className
          )}
          {...props}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              'pointer-events-none block rounded-full',
              'bg-white shadow-md',
              'transition-transform duration-[200ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]',
              'translate-x-0.5',
              thumbSize[size]
            )}
          />
        </SwitchPrimitive.Root>

        {(label || description) && (
          <div className="flex flex-col gap-0.5">
            {label && (
              <label
                htmlFor={inputId}
                className="text-sm font-medium text-[var(--text)] cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{description}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)
Switch.displayName = 'Switch'

export { Switch }
export type { SwitchProps }
