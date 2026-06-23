'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '@/lib/utils/cn'

const sizeMap = {
  xs:  'h-6 w-6 text-[10px]',
  sm:  'h-8 w-8 text-xs',
  md:  'h-10 w-10 text-sm',
  lg:  'h-12 w-12 text-base',
  xl:  'h-16 w-16 text-lg',
  '2xl': 'h-20 w-20 text-xl',
} as const

type AvatarSize = keyof typeof sizeMap

interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  src?: string
  alt?: string
  fallback?: string
  size?: AvatarSize
  online?: boolean
  ring?: boolean
}

const Avatar = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Root>, AvatarProps>(
  ({ className, src, alt = '', fallback, size = 'md', online, ring = false, ...props }, ref) => (
    <div className="relative inline-flex shrink-0">
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          'relative flex shrink-0 overflow-hidden rounded-full select-none',
          ring && 'ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--bg)]',
          sizeMap[size],
          className
        )}
        {...props}
      >
        <AvatarPrimitive.Image
          src={src}
          alt={alt}
          className="aspect-square h-full w-full object-cover"
        />
        <AvatarPrimitive.Fallback
          className="flex h-full w-full items-center justify-center rounded-full bg-[var(--primary-glow)] text-[var(--primary)] font-semibold tracking-wider"
          delayMs={src ? 300 : 0}
        >
          {fallback?.slice(0, 2).toUpperCase() ?? '??'}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>

      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-[var(--bg)]',
            size === 'xs' || size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5',
            online ? 'bg-[var(--success)]' : 'bg-[var(--text-faint)]'
          )}
          aria-label={online ? 'Online' : 'Offline'}
          role="img"
        />
      )}
    </div>
  )
)
Avatar.displayName = 'Avatar'

function AvatarGroup({ avatars, max = 4, size = 'sm' as AvatarSize }: {
  avatars: { src?: string; fallback?: string; alt?: string }[]
  max?: number
  size?: AvatarSize
}) {
  const visible = avatars.slice(0, max)
  const overflow = avatars.length - max

  return (
    <div className="flex items-center" role="group">
      {visible.map((a, i) => (
        <div key={i} className="-ml-2 first:ml-0" style={{ zIndex: visible.length - i }}>
          <Avatar {...a} size={size} className="ring-2 ring-[var(--bg)]" />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            '-ml-2 flex items-center justify-center rounded-full',
            'bg-[var(--bg-raised)] border-2 border-[var(--bg)]',
            'text-xs font-semibold text-[var(--text-muted)]',
            sizeMap[size]
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}

export { Avatar, AvatarGroup }
export type { AvatarProps, AvatarSize }
