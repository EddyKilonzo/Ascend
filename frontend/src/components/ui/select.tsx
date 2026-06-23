'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Label } from './label'

const Select          = SelectPrimitive.Root
const SelectGroup     = SelectPrimitive.Group
const SelectValue     = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & { error?: boolean }
>(({ className, children, error, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between gap-2',
      'rounded-[var(--radius)] border bg-[var(--bg-card)]',
      'px-3 py-2 text-sm text-[var(--text)]',
      'transition-[border-color,box-shadow] duration-[150ms]',
      'outline-none',
      'border-[var(--border)]',
      'hover:border-[var(--border-hover)]',
      'focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--primary-glow)]',
      error && 'border-[var(--danger)] focus:shadow-[0_0_0_3px_var(--danger-glow)]',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[placeholder]:text-[var(--text-faint)]',
      '[&>span]:truncate [&>span]:flex-1 [&>span]:text-left',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-[200ms] group-data-[state=open]:rotate-180" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1 text-[var(--text-muted)]', className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1 text-[var(--text-muted)]', className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn(
        'relative z-[var(--z-dropdown)] overflow-hidden',
        'rounded-[var(--radius-lg)] border border-[var(--border)]',
        'bg-[var(--bg-card)] shadow-4',
        'min-w-[var(--radix-select-trigger-width)]',
        position === 'popper' && [
          'data-[side=bottom]:translate-y-1',
          'data-[side=top]:-translate-y-1',
        ],
        'data-[state=open]:animate-scale-in',
        'origin-[var(--radix-select-content-transform-origin)]',
        className
      )}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' && 'max-h-[min(var(--radix-select-content-available-height),320px)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('px-2 py-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-caps', className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer items-center gap-2',
      'rounded-[var(--radius-sm)] px-2 py-2 pl-8',
      'text-sm text-[var(--text)]',
      'outline-none select-none',
      'transition-colors duration-[100ms]',
      'focus:bg-[var(--bg-raised)] focus:text-[var(--text)]',
      'data-[highlighted]:bg-[var(--bg-raised)]',
      'data-[state=checked]:text-[var(--primary)] data-[state=checked]:font-medium',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5 text-[var(--primary)]" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-[var(--border)]', className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

/* Convenience wrapper */
interface SelectFieldProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  placeholder?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  disabled?: boolean
}

function SelectField({ label, error, hint, required, placeholder, value, onValueChange, children, disabled }: SelectFieldProps) {
  const id = React.useId()
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <Label htmlFor={id} required={required}>{label}</Label>}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id={id} error={Boolean(error)}>
          <SelectValue placeholder={placeholder ?? 'Select...'} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
      {error && <p role="alert" className="text-xs text-[var(--danger)]">{error}</p>}
      {!error && hint && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
    </div>
  )
}

export {
  Select, SelectGroup, SelectValue,
  SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator,
  SelectScrollUpButton, SelectScrollDownButton,
  SelectField,
}
