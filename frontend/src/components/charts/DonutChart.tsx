'use client'

import * as React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { cn } from '@/lib/utils/cn'

interface DonutSlice {
  label:  string
  value:  number
  color?: string
}

interface DonutChartProps {
  data:          DonutSlice[]
  height?:       number
  innerRadius?:  number
  outerRadius?:  number
  centerLabel?:  string
  centerValue?:  string | number
  showLegend?:   boolean
  showTooltip?:  boolean
  className?:    string
  formatTooltip?:(v: number, name: string) => string
}

const DEFAULT_COLORS = ['#428475', '#5ABFAD', '#FFD700', '#3B82F6', '#EF4444', '#8B5CF6']

const CustomTooltip = ({ active, payload, formatter }: {
  active?: boolean
  payload?: { name: string; value: number; payload: DonutSlice }[]
  formatter?: (v: number, n: string) => string
}) => {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-4 text-xs">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ background: item.payload.color ?? DEFAULT_COLORS[0] }} />
        <span className="text-[var(--text-muted)]">{item.name}</span>
      </div>
      <span className="font-semibold text-[var(--text)] tabular-nums">
        {formatter ? formatter(item.value, item.name) : item.value}
      </span>
    </div>
  )
}

function DonutChart({
  data,
  height = 240,
  innerRadius = 55,
  outerRadius = 90,
  centerLabel,
  centerValue,
  showLegend = false,
  showTooltip = true,
  className,
  formatTooltip,
}: DonutChartProps) {
  const coloredData = data.map((d, i) => ({
    ...d,
    color: d.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }))

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {showTooltip && (
            <Tooltip content={<CustomTooltip formatter={formatTooltip} />} />
          )}

          {showLegend && (
            <Legend
              iconType="circle"
              iconSize={6}
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={v => <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{v}</span>}
            />
          )}

          <Pie
            data={coloredData}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            strokeWidth={0}
            animationDuration={700}
            animationEasing="ease-out"
          >
            {coloredData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>

          {(centerLabel || centerValue !== undefined) && (
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
              {centerValue !== undefined && (
                <tspan
                  x="50%"
                  dy={centerLabel ? '-0.4em' : '0'}
                  fontSize="22"
                  fontWeight="700"
                  fill="var(--text)"
                >
                  {centerValue}
                </tspan>
              )}
              {centerLabel && (
                <tspan
                  x="50%"
                  dy={centerValue !== undefined ? '1.5em' : '0'}
                  fontSize="11"
                  fill="var(--text-muted)"
                >
                  {centerLabel}
                </tspan>
              )}
            </text>
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export { DonutChart }
export type { DonutChartProps, DonutSlice }
