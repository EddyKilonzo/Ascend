import * as React from 'react'
import { cn } from '@/lib/utils/cn'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  variant?: 'block' | 'text' | 'avatar' | 'circle' | 'button'
}

const roundedMap = {
  sm:   'rounded-[var(--radius-sm)]',
  md:   'rounded-[var(--radius)]',
  lg:   'rounded-[var(--radius-lg)]',
  xl:   'rounded-[var(--radius-xl)]',
  full: 'rounded-full',
}

function Skeleton({ className, width, height, rounded = 'md', variant = 'block', style, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'skeleton',
        roundedMap[rounded],
        variant === 'text'   && 'h-4',
        variant === 'avatar' && 'h-10 w-10 rounded-full',
        variant === 'circle' && 'rounded-full',
        variant === 'button' && 'h-10 rounded-[var(--radius)]',
        className
      )}
      style={{ width, height, ...style }}
      {...props}
    />
  )
}

function SkeletonText({
  lines = 3,
  className,
  lastLineWidth = '60%',
}: {
  lines?: number
  className?: string
  lastLineWidth?: string
}) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          style={{ width: i === lines - 1 ? lastLineWidth : '100%' }}
        />
      ))}
    </div>
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-[var(--radius-lg)] border border-[var(--border)] p-4 space-y-3', className)}>
      <div className="flex items-center gap-3">
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="60%" className="h-3" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  )
}

export { Skeleton, SkeletonText, SkeletonCard }
