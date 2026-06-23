import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils/cn'

interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  required?: boolean
}

const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        'block text-sm font-medium text-[var(--text)] leading-none',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-1 text-[var(--danger)]" aria-hidden="true">
          *
        </span>
      )}
    </LabelPrimitive.Root>
  )
)
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
