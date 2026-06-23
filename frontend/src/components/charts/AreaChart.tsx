'use client'

import * as React from 'react'
import {
  AreaChart as ReAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { cn } from '@/lib/utils/cn'

interface AreaSeries {
  key:   string
  label: string
  color?: string
  gradient?: string
}

interface AreaChartProps {
  data:          Record<string, unknown>[]
  series:        AreaSeries[]
  xKey:          string
  height?:       number
  showGrid?:     boolean
  showLegend?:   boolean
  className?:    string
  formatX?:      (v: unknown) => string
  formatY?:      (v: number) => string
  formatTooltip?:(v: number, name: string) => string
  stacked?:      boolean
  curved?:       boolean
}

const DEFAULT_COLORS = [
  '#428475',
  '#5ABFAD',
  '#FFD700',
  '#3B82F6',
  '#EF4444',
]

const CustomTooltip = ({ active, payload, label, formatter }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
  formatter?: (v: number, n: string) => string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className={cn(
      'rounded-[var(--radius-lg)] border border-[var(--border)]',
      'bg-[var(--bg-card)] p-3 shadow-4',
      'text-xs'
    )}>
      {label && <p className="font-semibold text-[var(--text-muted)] mb-2">{label}</p>}
      {payload.map(entry => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: entry.color }} />
            <span className="text-[var(--text-muted)]">{entry.name}</span>
          </div>
          <span className="font-semibold text-[var(--text)] tabular-nums">
            {formatter ? formatter(entry.value, entry.name) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

function AreaChart({
  data,
  series,
  xKey,
  height = 240,
  showGrid = true,
  showLegend = false,
  className,
  formatX,
  formatY,
  formatTooltip,
  stacked = false,
  curved = true,
}: AreaChartProps) {
  const gradientId = React.useId()

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReAreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            {series.map((s, i) => {
              const color = s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]
              return (
                <linearGradient key={s.key} id={`${gradientId}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              )
            })}
          </defs>

          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
          )}

          <XAxis
            dataKey={xKey}
            tick={{ fill: 'var(--text-faint)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatX ? v => formatX(v) : undefined}
            dy={6}
          />

          <YAxis
            tick={{ fill: 'var(--text-faint)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatY}
            width={36}
          />

          <Tooltip
            content={<CustomTooltip formatter={formatTooltip} />}
            cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
          />

          {showLegend && (
            <Legend
              iconType="circle"
              iconSize={6}
              formatter={v => <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{v}</span>}
            />
          )}

          {series.map((s, i) => {
            const color = s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]
            return (
              <Area
                key={s.key}
                type={curved ? 'monotone' : 'linear'}
                dataKey={s.key}
                name={s.label}
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradientId}-${s.key})`}
                stackId={stacked ? 'stack' : undefined}
                dot={false}
                activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
                animationDuration={800}
                animationEasing="ease-out"
              />
            )
          })}
        </ReAreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export { AreaChart }
export type { AreaChartProps, AreaSeries }
