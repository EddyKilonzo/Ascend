'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string
  description?: string
  indeterminate?: boolean
}

const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, label, description, indeterminate, id, ...props }, ref) => {
    const inputId = id ?? React.useId()
    const isChecked = props.checked ?? props.defaultChecked

    return (
      <div className="flex items-start gap-3">
        <CheckboxPrimitive.Root
          ref={ref}
          id={inputId}
          className={cn(
            'peer h-4.5 w-4.5 shrink-0 rounded-[var(--radius-sm)]',
            'border-2 border-[var(--border)]',
            'bg-[var(--bg-card)]',
            'transition-[border-color,background-color,box-shadow] duration-[150ms]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
            'data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]',
            'data-[state=indeterminate]:bg-[var(--primary)] data-[state=indeterminate]:border-[var(--primary)]',
            'hover:border-[var(--border-hover)]',
            'data-[state=checked]:hover:brightness-110',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'mt-0.5',
            className
          )}
          {...props}
        >
          <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white" asChild>
            <AnimatePresence mode="wait">
              <motion.span
                key={indeterminate ? 'indeterminate' : 'checked'}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.12, ease: [0.34, 1.56, 0.64, 1] }}
                className="flex items-center justify-center"
              >
                {indeterminate
                  ? <Minus className="h-3 w-3" strokeWidth={3} />
                  : <Check className="h-3 w-3" strokeWidth={3} />
                }
              </motion.span>
            </AnimatePresence>
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>

        {(label || description) && (
          <div className="flex flex-col gap-0.5">
            {label && (
              <label
                htmlFor={inputId}
                className={cn(
                  'text-sm font-medium text-[var(--text)] leading-snug cursor-pointer',
                  'peer-disabled:cursor-not-allowed peer-disabled:opacity-50'
                )}
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
Checkbox.displayName = 'Checkbox'

export { Checkbox }
export type { CheckboxProps }
