'use client'

import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils/cn'

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  label?: string
  showValue?: boolean
  formatValue?: (value: number) => string
}

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  ({ className, label, showValue, formatValue, value, defaultValue, min = 0, max = 100, ...props }, ref) => {
    const [internal, setInternal] = React.useState<number[]>(
      (value as number[] | undefined) ?? (defaultValue as number[] | undefined) ?? [0]
    )

    const currentValues = (value as number[] | undefined) ?? internal
    const display = formatValue ? formatValue(currentValues[0]) : currentValues[0]

    return (
      <div className={cn('flex flex-col gap-2 w-full', className)}>
        {(label || showValue) && (
          <div className="flex items-center justify-between">
            {label && <span className="text-sm font-medium text-[var(--text)]">{label}</span>}
            {showValue && (
              <span className="text-sm font-semibold text-[var(--primary)] tabular-nums">{display}</span>
            )}
          </div>
        )}

        <SliderPrimitive.Root
          ref={ref}
          min={min}
          max={max}
          value={value as number[] | undefined}
          defaultValue={defaultValue as number[] | undefined}
          onValueChange={vals => {
            setInternal(vals)
            props.onValueChange?.(vals)
          }}
          className={cn(
            'relative flex w-full touch-none select-none items-center group',
            'h-5'
          )}
          {...props}
        >
          <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-[var(--bg-raised)]">
            <SliderPrimitive.Range className="absolute h-full bg-[var(--primary)] rounded-full" />
          </SliderPrimitive.Track>

          {currentValues.map((_, i) => (
            <SliderPrimitive.Thumb
              key={i}
              className={cn(
                'block h-4 w-4 rounded-full',
                'border-2 border-[var(--primary)] bg-[var(--bg-card)]',
                'shadow-2',
                'transition-[transform,box-shadow] duration-[150ms]',
                'hover:scale-110 hover:shadow-[0_0_0_4px_var(--primary-glow)]',
                'focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--primary-glow)]',
                'active:scale-95',
                'disabled:pointer-events-none disabled:opacity-50'
              )}
              aria-label={label ?? `Slider value ${i + 1}`}
            />
          ))}
        </SliderPrimitive.Root>

        {min !== undefined && max !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-faint)] tabular-nums">{formatValue ? formatValue(min) : min}</span>
            <span className="text-xs text-[var(--text-faint)] tabular-nums">{formatValue ? formatValue(max) : max}</span>
          </div>
        )}
      </div>
    )
  }
)
Slider.displayName = 'Slider'

export { Slider }
export type { SliderProps }
