'use client'

import * as React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-semibold tracking-wide',
    'border border-transparent',
    'cursor-pointer select-none',
    'transition-colors duration-[150ms]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
    'disabled:pointer-events-none disabled:opacity-40',
    'relative overflow-hidden',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-[var(--primary)] text-white',
          'hover:brightness-110 active:brightness-95',
          'shadow-1',
        ],
        secondary: [
          'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)]',
          'hover:border-[var(--border-hover)] hover:bg-[var(--bg-raised)]',
        ],
        ghost: [
          'text-[var(--text)]',
          'hover:bg-[var(--bg-raised)]',
        ],
        danger: [
          'bg-[var(--danger)] text-white',
          'hover:brightness-110',
          'shadow-1',
        ],
        outline: [
          'border-[var(--primary)] text-[var(--primary)]',
          'hover:bg-[var(--primary-glow)]',
        ],
        teal: [
          'bg-[var(--primary-glow)] border border-[rgba(66,132,117,0.3)] text-[var(--primary)]',
          'hover:bg-[var(--primary)] hover:text-white hover:border-transparent',
        ],
        gold: [
          'bg-[var(--gold-bg)] border border-[rgba(212,160,23,0.3)] text-[var(--gold)]',
          'hover:brightness-110',
        ],
        link: [
          'text-[var(--primary)] underline-offset-4',
          'hover:underline',
          'h-auto p-0 border-none shadow-none',
        ],
        'ghost-muted': [
          'text-[var(--text-muted)]',
          'hover:bg-[var(--bg-raised)] hover:text-[var(--text)]',
        ],
      },
      size: {
        sm:        'h-8 px-3 text-xs rounded-[var(--radius-sm)]',
        md:        'h-10 px-4 text-sm rounded-[var(--radius)]',
        lg:        'h-12 px-6 text-base rounded-[var(--radius-lg)]',
        xl:        'h-14 px-8 text-lg rounded-[var(--radius-xl)]',
        icon:      'h-10 w-10 p-0 rounded-[var(--radius)]',
        'icon-sm': 'h-8 w-8 p-0 rounded-[var(--radius-sm)]',
        'icon-lg': 'h-12 w-12 p-0 rounded-[var(--radius-lg)]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const isLink    = variant === 'link'
    const isDisabled = disabled || loading

    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        whileHover={!isDisabled && !isLink ? { scale: 1.015 } : undefined}
        whileTap={!isDisabled && !isLink  ? { scale: 0.968 } : undefined}
        transition={{ duration: 0.08, ease: [0.34, 1.56, 0.64, 1] }}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          leftIcon && <span className="shrink-0" aria-hidden="true">{leftIcon}</span>
        )}

        {children}

        {!loading && rightIcon && (
          <span className="shrink-0" aria-hidden="true">{rightIcon}</span>
        )}
      </motion.button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
export type { ButtonProps }
