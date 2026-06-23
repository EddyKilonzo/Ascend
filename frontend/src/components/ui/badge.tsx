import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1.5 shrink-0',
    'font-semibold leading-none tracking-wide',
    'select-none whitespace-nowrap',
    'rounded-full border',
  ],
  {
    variants: {
      variant: {
        default:  'bg-[var(--primary-glow)] text-[var(--primary)] border-[rgba(66,132,117,0.22)]',
        success:  'bg-[var(--success-bg)] text-[var(--success)] border-[rgba(45,140,90,0.22)]',
        warning:  'bg-[var(--warning-bg)] text-[var(--warning)] border-[rgba(217,119,6,0.22)]',
        danger:   'bg-[var(--danger-bg)]  text-[var(--danger)]  border-[rgba(220,38,38,0.22)]',
        info:     'bg-[var(--info-bg)]    text-[var(--info)]    border-[rgba(37,99,235,0.22)]',
        purple:   'bg-[rgba(124,58,237,0.08)] text-[#7C3AED] border-[rgba(124,58,237,0.22)]',
        gold:     'bg-[var(--gold-bg)] text-[var(--gold)] border-[rgba(212,160,23,0.22)]',
        muted:    'bg-[var(--bg-raised)] text-[var(--text-muted)] border-[var(--border)]',
        outline:  'bg-transparent text-[var(--text-muted)] border-[var(--border)]',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.5',
        md: 'text-xs px-2.5 py-1',
        lg: 'text-sm px-3 py-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean
}

const dotColorMap: Record<string, string> = {
  success: 'bg-[var(--success)]',
  warning: 'bg-[var(--warning)]',
  danger:  'bg-[var(--danger)]',
  info:    'bg-[var(--info)]',
  default: 'bg-[var(--primary)]',
  gold:    'bg-[var(--gold)]',
  purple:  'bg-[#7C3AED]',
  muted:   'bg-[var(--text-faint)]',
  outline: 'bg-[var(--text-faint)]',
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size, dot, children, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant, size, className }))} {...props}>
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColorMap[variant ?? 'default'])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
)
Badge.displayName = 'Badge'

export { Badge, badgeVariants }
export type { BadgeProps }
