'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { Label } from './label'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'suffix'> {
  label?: string
  error?: string
  hint?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  required?: boolean
  wrapperClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      prefix,
      suffix,
      required,
      id,
      disabled,
      wrapperClassName,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const inputId = id ?? React.useId()
    const hasError = Boolean(error)

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', wrapperClassName)}>
        {label && (
          <Label htmlFor={inputId} required={required}>
            {label}
          </Label>
        )}

        <div className="relative flex items-center group">
          {prefix && (
            <div
              className={cn(
                'absolute left-3 flex items-center justify-center',
                'text-[var(--text-muted)] pointer-events-none',
                '[&_svg]:h-4 [&_svg]:w-4'
              )}
              aria-hidden="true"
            >
              {prefix}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            className={cn(
              'h-10 w-full rounded-[var(--radius)] border bg-[var(--bg-card)]',
              'px-3 py-2 text-sm text-[var(--text)]',
              'placeholder:text-[var(--text-faint)]',
              'transition-[border-color,box-shadow] duration-[150ms]',
              'outline-none',
              /* Normal */
              'border-[var(--border)]',
              /* Focus */
              'focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-glow)]',
              /* Error */
              hasError && 'border-[var(--danger)] focus:border-[var(--danger)] focus:shadow-[0_0_0_3px_var(--danger-glow)]',
              /* Disabled */
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--bg-secondary)]',
              /* Prefix / suffix spacing */
              prefix  && 'pl-10',
              suffix  && 'pr-10',
              className
            )}
            {...props}
          />

          {suffix && (
            <div
              className={cn(
                'absolute right-3 flex items-center justify-center',
                'text-[var(--text-muted)] pointer-events-none',
                '[&_svg]:h-4 [&_svg]:w-4'
              )}
              aria-hidden="true"
            >
              {suffix}
            </div>
          )}
        </div>

        {hasError && (
          <motion.p
            id={`${inputId}-error`}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-[var(--danger)] leading-snug"
          >
            {error}
          </motion.p>
        )}

        {!hasError && hint && (
          <p id={`${inputId}-hint`} className="text-xs text-[var(--text-muted)] leading-snug">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
export type { InputProps }
