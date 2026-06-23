'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { Label } from './label'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  maxLength?: number
  autoResize?: boolean
  wrapperClassName?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      hint,
      required,
      maxLength,
      autoResize = false,
      id,
      disabled,
      wrapperClassName,
      onChange,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const inputId   = id ?? React.useId()
    const hasError  = Boolean(error)
    const [count, setCount] = React.useState<number>(() => {
      const initial = value ?? defaultValue
      return typeof initial === 'string' ? initial.length : 0
    })

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (maxLength !== undefined) setCount(e.target.value.length)
        if (autoResize) {
          e.target.style.height = 'auto'
          e.target.style.height = `${e.target.scrollHeight}px`
        }
        onChange?.(e)
      },
      [onChange, maxLength, autoResize]
    )

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', wrapperClassName)}>
        {label && (
          <Label htmlFor={inputId} required={required}>
            {label}
          </Label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          disabled={disabled}
          maxLength={maxLength}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          onChange={handleChange}
          value={value}
          defaultValue={defaultValue}
          className={cn(
            'w-full min-h-[100px] rounded-[var(--radius)] border bg-[var(--bg-card)]',
            'px-3 py-2.5 text-sm text-[var(--text)] leading-relaxed',
            'placeholder:text-[var(--text-faint)]',
            'transition-[border-color,box-shadow] duration-[150ms]',
            'outline-none resize-y',
            'border-[var(--border)]',
            'focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-glow)]',
            hasError && 'border-[var(--danger)] focus:border-[var(--danger)] focus:shadow-[0_0_0_3px_var(--danger-glow)]',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--bg-secondary)]',
            autoResize && 'resize-none overflow-hidden',
            className
          )}
          {...props}
        />

        <div className="flex items-start justify-between gap-2">
          <div>
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

          {maxLength !== undefined && (
            <span
              className={cn(
                'text-xs shrink-0 tabular-nums',
                count >= maxLength
                  ? 'text-[var(--danger)]'
                  : count >= maxLength * 0.85
                  ? 'text-[var(--warning)]'
                  : 'text-[var(--text-faint)]'
              )}
              aria-live="polite"
            >
              {count}/{maxLength}
            </span>
          )}
        </div>
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
export type { TextareaProps }
