import * as React from 'react'
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const alertVariants = cva(
  [
    'relative w-full rounded-[var(--radius-lg)] border p-4',
    'flex items-start gap-3',
    'text-sm',
  ],
  {
    variants: {
      variant: {
        default: 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)]',
        info:    'bg-[var(--info-bg)] border-[rgba(37,99,235,0.22)] text-[var(--text)]',
        success: 'bg-[var(--success-bg)] border-[rgba(45,140,90,0.22)] text-[var(--text)]',
        warning: 'bg-[var(--warning-bg)] border-[rgba(217,119,6,0.22)] text-[var(--text)]',
        danger:  'bg-[var(--danger-bg)] border-[rgba(220,38,38,0.22)] text-[var(--text)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const iconMap = {
  default: Info,
  info:    Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  danger:  AlertCircle,
}

const iconColorMap = {
  default: 'text-[var(--text-muted)]',
  info:    'text-[var(--info)]',
  success: 'text-[var(--success)]',
  warning: 'text-[var(--warning)]',
  danger:  'text-[var(--danger)]',
}

interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string
  onDismiss?: () => void
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', title, onDismiss, children, ...props }, ref) => {
    const Icon = iconMap[variant ?? 'default']
    const iconColor = iconColorMap[variant ?? 'default']

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant, className }))}
        {...props}
      >
        <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', iconColor)} aria-hidden="true" />

        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-semibold leading-snug mb-1">{title}</p>
          )}
          {children && (
            <div className="text-[var(--text-muted)] leading-relaxed">{children}</div>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss alert"
            className={cn(
              'shrink-0 rounded p-1 -mr-1 -mt-1',
              'text-[var(--text-muted)] hover:text-[var(--text)]',
              'hover:bg-[var(--bg-raised)]',
              'transition-colors duration-[150ms]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]'
            )}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    )
  }
)
Alert.displayName = 'Alert'

export { Alert, alertVariants }
export type { AlertProps }
