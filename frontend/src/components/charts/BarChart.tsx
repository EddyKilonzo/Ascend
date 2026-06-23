'use client'

import * as React from 'react'
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts'
import { cn } from '@/lib/utils/cn'

interface BarSeries {
  key:    string
  label:  string
  color?: string
}

interface BarChartProps {
  data:           Record<string, unknown>[]
  series:         BarSeries[]
  xKey:           string
  height?:        number
  layout?:        'vertical' | 'horizontal'
  showGrid?:      boolean
  showLegend?:    boolean
  rounded?:       boolean
  highlightMax?:  boolean
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
            <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: entry.color }} />
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

function BarChart({
  data,
  series,
  xKey,
  height = 240,
  layout = 'horizontal',
  showGrid = true,
  showLegend = false,
  rounded = true,
  highlightMax = false,
  className,
  formatX,
  formatY,
  formatTooltip,
}: BarChartProps) {
  const maxValues = React.useMemo(() => {
    if (!highlightMax) return {}
    const result: Record<string, number> = {}
    series.forEach(s => {
      result[s.key] = Math.max(...data.map(d => Number(d[s.key] ?? 0)))
    })
    return result
  }, [data, series, highlightMax])

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart
          data={data}
          layout={layout}
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          barGap={4}
          barCategoryGap="30%"
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              horizontal={layout === 'horizontal'}
              vertical={layout === 'vertical'}
            />
          )}

          {layout === 'horizontal' ? (
            <>
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
            </>
          ) : (
            <>
              <XAxis
                type="number"
                tick={{ fill: 'var(--text-faint)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatY}
              />
              <YAxis
                type="category"
                dataKey={xKey}
                tick={{ fill: 'var(--text-faint)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
            </>
          )}

          <Tooltip
            content={<CustomTooltip formatter={formatTooltip} />}
            cursor={{ fill: 'var(--bg-raised)', opacity: 0.5 }}
          />

          {showLegend && (
            <Legend
              iconType="square"
              iconSize={8}
              formatter={v => <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{v}</span>}
            />
          )}

          {series.map((s, i) => {
            const color = s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]
            return (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={color}
                radius={rounded ? (layout === 'horizontal' ? [4, 4, 0, 0] : [0, 4, 4, 0]) : undefined}
                maxBarSize={48}
                animationDuration={700}
                animationEasing="ease-out"
              >
                {highlightMax && data.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={Number(entry[s.key]) === maxValues[s.key]
                      ? color
                      : `${color}66`
                    }
                  />
                ))}
              </Bar>
            )
          })}
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  )
}

export { BarChart }
export type { BarChartProps, BarSeries }
