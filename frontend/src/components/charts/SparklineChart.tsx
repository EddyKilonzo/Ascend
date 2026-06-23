'use client'

import * as React from 'react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { cn } from '@/lib/utils/cn'

interface SparklineProps {
  data:       number[] | { value: number }[]
  color?:     string
  height?:    number
  width?:     string | number
  showTooltip?: boolean
  filled?:    boolean
  className?: string
}

function SparklineChart({
  data,
  color = 'var(--primary)',
  height = 40,
  width = '100%',
  showTooltip = false,
  filled = true,
  className,
}: SparklineProps) {
  const normalized = data.map(d => (typeof d === 'number' ? { value: d } : d))
  const id = React.useId()

  const trend = normalized.length >= 2
    ? normalized[normalized.length - 1].value >= normalized[normalized.length - 2].value
      ? 'up'
      : 'down'
    : 'neutral'

  const effectiveColor =
    trend === 'up'   ? 'var(--success)'  :
    trend === 'down' ? 'var(--danger)'   :
                       color

  return (
    <div className={cn('shrink-0', className)} style={{ height, width }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={normalized} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          {filled && (
            <defs>
              <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={effectiveColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={effectiveColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
          )}
          {showTooltip && <Tooltip
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: 11,
              color: 'var(--text)',
              boxShadow: 'var(--shadow-3)',
            }}
            itemStyle={{ color: 'var(--text)' }}
            labelStyle={{ display: 'none' }}
          />}
          <Area
            type="monotone"
            dataKey="value"
            stroke={effectiveColor}
            strokeWidth={1.5}
            fill={filled ? `url(#${id}-fill)` : 'transparent'}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export { SparklineChart }
export type { SparklineProps }
