'use client'

import * as React from 'react'
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts'
import { cn } from '@/lib/utils/cn'

interface LineSeries {
  key:     string
  label:   string
  color?:  string
  dashed?: boolean
}

interface LineChartProps {
  data:           Record<string, unknown>[]
  series:         LineSeries[]
  xKey:           string
  height?:        number
  showGrid?:      boolean
  showDots?:      boolean
  showLegend?:    boolean
  reference?:     { value: number; label?: string; color?: string }
  className?:     string
  formatX?:       (v: unknown) => string
  formatY?:       (v: number) => string
  formatTooltip?: (v: number, name: string) => string
}

const DEFAULT_COLORS = ['#428475', '#5ABFAD', '#FFD700', '#3B82F6', '#EF4444']

const CustomTooltip = ({ active, payload, label, formatter }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
  formatter?: (v: number, n: string) => string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-4 text-xs">
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

function LineChart({
  data,
  series,
  xKey,
  height = 240,
  showGrid = true,
  showDots = false,
  showLegend = false,
  reference,
  className,
  formatX,
  formatY,
  formatTooltip,
}: LineChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReLineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
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

          {reference && (
            <ReferenceLine
              y={reference.value}
              stroke={reference.color ?? 'var(--warning)'}
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: reference.label ?? '', fill: 'var(--text-faint)', fontSize: 10 }}
            />
          )}

          {series.map((s, i) => {
            const color = s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]
            return (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={color}
                strokeWidth={2}
                strokeDasharray={s.dashed ? '5 5' : undefined}
                dot={showDots ? { r: 3, fill: color, strokeWidth: 0 } : false}
                activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
                animationDuration={800}
                animationEasing="ease-out"
              />
            )
          })}
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  )
}

export { LineChart }
export type { LineChartProps, LineSeries }
