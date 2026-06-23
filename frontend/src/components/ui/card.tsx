'use client'

import * as React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const cardVariants = cva(
  [
    'rounded-[var(--radius-lg)] border border-[var(--border)]',
    'bg-[var(--bg-card)]',
    'transition-colors duration-[250ms]',
  ],
  {
    variants: {
      variant: {
        default:     'shadow-1',
        elevated:    'shadow-3',
        flat:        'shadow-none',
        glass:       'glass shadow-2',
        teal:        'bg-[var(--primary-glow)] border-[rgba(66,132,117,0.25)]',
        raised:      'bg-[var(--bg-raised)] shadow-1',
        interactive: [
          'cursor-pointer shadow-1',
          'hover:shadow-3 hover:border-[var(--border-hover)]',
          'transition-[box-shadow,border-color,transform] duration-[250ms]',
        ],
      },
      padding: {
        none: 'p-0',
        sm:   'p-3',
        md:   'p-4',
        lg:   'p-6',
        xl:   'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
)

interface CardProps
  extends Omit<HTMLMotionProps<'div'>, 'children'>,
    VariantProps<typeof cardVariants> {
  children?: React.ReactNode
  hoverable?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, hoverable, children, ...props }, ref) => {
    const isInteractive = variant === 'interactive' || hoverable

    return (
      <motion.div
        ref={ref}
        className={cn(cardVariants({ variant, padding, className }))}
        whileHover={isInteractive ? { y: -3, transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] } } : undefined}
        whileTap={isInteractive  ? { scale: 0.99 } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-1.5 px-4 pt-4 pb-0',
        '[&+*]:pt-3',
        className
      )}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-base font-semibold leading-snug text-[var(--text)] tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-[var(--text-muted)] leading-relaxed', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 pt-3', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-2 px-4 pb-4 pt-0',
        'border-t border-[var(--border)] mt-1',
        className
      )}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants }
export type { CardProps }
