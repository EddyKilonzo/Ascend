'use client'

import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check, ChevronRight, Circle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const DropdownMenu          = DropdownMenuPrimitive.Root
const DropdownMenuTrigger   = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup     = DropdownMenuPrimitive.Group
const DropdownMenuPortal    = DropdownMenuPrimitive.Portal
const DropdownMenuSub       = DropdownMenuPrimitive.Sub
const DropdownMenuRadioGroup= DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & { inset?: boolean }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'flex cursor-pointer select-none items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm',
      'outline-none transition-colors duration-[100ms]',
      'focus:bg-[var(--bg-raised)] data-[state=open]:bg-[var(--bg-raised)]',
      'text-[var(--text)]',
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4 text-[var(--text-muted)]" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      'z-[var(--z-dropdown)] min-w-[180px] overflow-hidden',
      'rounded-[var(--radius-lg)] border border-[var(--border)]',
      'bg-[var(--bg-card)] p-1 shadow-4',
      'data-[state=open]:animate-scale-in',
      'origin-[var(--radix-dropdown-menu-content-transform-origin)]',
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-[var(--z-dropdown)] min-w-[200px] overflow-hidden',
        'rounded-[var(--radius-lg)] border border-[var(--border)]',
        'bg-[var(--bg-card)] p-1 shadow-4',
        'data-[state=open]:animate-scale-in',
        'origin-[var(--radix-dropdown-menu-content-transform-origin)]',
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
    icon?: React.ReactNode
    shortcut?: string
    destructive?: boolean
  }
>(({ className, inset, icon, shortcut, destructive, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2',
      'rounded-[var(--radius-sm)] px-2 py-1.5 text-sm',
      'outline-none transition-colors duration-[100ms]',
      'focus:bg-[var(--bg-raised)]',
      destructive
        ? 'text-[var(--danger)] focus:bg-[var(--danger-bg)] focus:text-[var(--danger)]'
        : 'text-[var(--text)]',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {icon && (
      <span className="h-4 w-4 shrink-0 text-[var(--text-muted)] [&_svg]:h-4 [&_svg]:w-4" aria-hidden>
        {icon}
      </span>
    )}
    <span className="flex-1 truncate">{children}</span>
    {shortcut && (
      <span className="ml-auto text-xs tracking-widest text-[var(--text-faint)] font-mono shrink-0">
        {shortcut}
      </span>
    )}
  </DropdownMenuPrimitive.Item>
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2',
      'rounded-[var(--radius-sm)] py-1.5 pl-8 pr-2 text-sm',
      'outline-none transition-colors duration-[100ms]',
      'focus:bg-[var(--bg-raised)] text-[var(--text)]',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5 text-[var(--primary)]" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2',
      'rounded-[var(--radius-sm)] py-1.5 pl-8 pr-2 text-sm',
      'outline-none transition-colors duration-[100ms]',
      'focus:bg-[var(--bg-raised)] text-[var(--text)]',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-[var(--primary)] text-[var(--primary)]" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      'px-2 py-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-caps',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-[var(--border)]', className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

export {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuPortal, DropdownMenuSub, DropdownMenuRadioGroup,
  DropdownMenuSubContent, DropdownMenuSubTrigger,
  DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem,
  DropdownMenuLabel, DropdownMenuSeparator,
}
