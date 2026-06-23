'use client'

import * as React from 'react'
import {
  RadarChart as ReRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { cn } from '@/lib/utils/cn'

interface RadarSeries {
  key:    string
  label:  string
  color?: string
}

interface RadarChartProps {
  data:          Record<string, unknown>[]
  series:        RadarSeries[]
  angleKey:      string
  height?:       number
  showGrid?:     boolean
  showLegend?:   boolean
  showDots?:     boolean
  filled?:       boolean
  className?:    string
  formatTooltip?:(v: number, name: string) => string
}

const DEFAULT_COLORS = ['#428475', '#5ABFAD', '#FFD700']

const CustomTooltip = ({ active, payload, formatter }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  formatter?: (v: number, n: string) => string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-4 text-xs">
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

function RadarChart({
  data,
  series,
  angleKey,
  height = 280,
  showGrid = true,
  showLegend = false,
  showDots = true,
  filled = true,
  className,
  formatTooltip,
}: RadarChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReRadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          {showGrid && (
            <PolarGrid stroke="var(--border)" strokeWidth={1} />
          )}

          <PolarAngleAxis
            dataKey={angleKey}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            tickLine={false}
          />

          <PolarRadiusAxis
            tick={{ fill: 'var(--text-faint)', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 'auto']}
          />

          <Tooltip content={<CustomTooltip formatter={formatTooltip} />} />

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
              <Radar
                key={s.key}
                name={s.label}
                dataKey={s.key}
                stroke={color}
                strokeWidth={2}
                fill={filled ? color : 'transparent'}
                fillOpacity={filled ? 0.15 : 0}
                dot={showDots ? { r: 3, fill: color, strokeWidth: 0 } : false}
                animationDuration={700}
              />
            )
          })}
        </ReRadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export { RadarChart }
export type { RadarChartProps, RadarSeries }
