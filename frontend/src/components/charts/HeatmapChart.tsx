'use client'

import * as React from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils/cn'

interface HeatmapCell {
  date:   string
  value:  number
  label?: string
}

interface HeatmapChartProps {
  data:           HeatmapCell[]
  weeks?:         number
  minColor?:      string
  maxColor?:      string
  emptyColor?:    string
  cellSize?:      number
  gap?:           number
  showMonths?:    boolean
  showDays?:      boolean
  className?:     string
  formatTooltip?: (cell: HeatmapCell) => string
  onCellClick?:   (cell: HeatmapCell) => void
}

const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', '']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t)
}

function interpolateColor(from: string, to: string, t: number): string {
  const parse = (hex: string) => {
    const h = hex.replace('#', '')
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ]
  }
  const [r1, g1, b1] = parse(from)
  const [r2, g2, b2] = parse(to)
  return `rgb(${lerp(r1, r2, t)},${lerp(g1, g2, t)},${lerp(b1, b2, t)})`
}

function HeatmapChart({
  data,
  weeks       = 53,
  minColor    = '#1a312c',
  maxColor    = '#428475',
  emptyColor  = 'var(--bg-raised)',
  cellSize    = 13,
  gap         = 3,
  showMonths  = true,
  showDays    = true,
  className,
  formatTooltip,
  onCellClick,
}: HeatmapChartProps) {
  const byDate = React.useMemo(() => {
    const map: Record<string, HeatmapCell> = {}
    data.forEach(d => { map[d.date] = d })
    return map
  }, [data])

  const maxValue = React.useMemo(() =>
    Math.max(...data.map(d => d.value), 1), [data])

  /* Build a 7xweeks grid starting from the Sunday 'weeks' weeks ago */
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  /* Start from the beginning of the week 'weeks' ago */
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - weeks * 7 + (7 - today.getDay()))

  const grid: (HeatmapCell | null)[][] = []
  const monthLabels: { month: string; col: number }[] = []

  for (let w = 0; w < weeks; w++) {
    const col: (HeatmapCell | null)[] = []
    let prevMonth = -1

    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + w * 7 + d)

      if (date > today) {
        col.push(null)
        continue
      }

      const key = date.toISOString().slice(0, 10)
      col.push(byDate[key] ?? { date: key, value: 0 })

      if (d === 0 && date.getMonth() !== prevMonth) {
        prevMonth = date.getMonth()
        if (w > 0) monthLabels.push({ month: MONTHS[prevMonth], col: w })
      }
    }
    grid.push(col)
  }

  const cellStep = cellSize + gap
  const labelsW  = showDays ? 28 : 0
  const labelsH  = showMonths ? 20 : 0
  const svgW     = labelsW + weeks * cellStep
  const svgH     = labelsH + 7 * cellStep

  return (
    <Tooltip.Provider delayDuration={100}>
      <div className={cn('overflow-x-auto', className)}>
        <svg
          width={svgW}
          height={svgH}
          aria-label="Activity heatmap"
          style={{ display: 'block' }}
        >
          {/* Month labels */}
          {showMonths && monthLabels.map(({ month, col }) => (
            <text
              key={`${month}-${col}`}
              x={labelsW + col * cellStep}
              y={12}
              fontSize="10"
              fill="var(--text-faint)"
            >
              {month}
            </text>
          ))}

          {/* Day labels */}
          {showDays && DAYS.map((d, i) => d ? (
            <text
              key={i}
              x={0}
              y={labelsH + i * cellStep + cellSize - 1}
              fontSize="9"
              fill="var(--text-faint)"
            >
              {d}
            </text>
          ) : null)}

          {/* Cells */}
          {grid.map((col, w) =>
            col.map((cell, d) => {
              if (!cell) return null

              const t     = maxValue > 0 ? cell.value / maxValue : 0
              const color = cell.value === 0
                ? emptyColor
                : interpolateColor(minColor, maxColor, Math.max(t, 0.15))

              const x = labelsW + w * cellStep
              const y = labelsH + d * cellStep

              const tip = formatTooltip
                ? formatTooltip(cell)
                : `${cell.date}: ${cell.value}`

              return (
                <Tooltip.Root key={`${w}-${d}`}>
                  <Tooltip.Trigger asChild>
                    <rect
                      x={x}
                      y={y}
                      width={cellSize}
                      height={cellSize}
                      rx={3}
                      fill={color}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      onClick={() => onCellClick?.(cell)}
                      role={onCellClick ? 'button' : undefined}
                      aria-label={tip}
                    />
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="top"
                      className={cn(
                        'rounded-[var(--radius)] px-2 py-1 text-xs',
                        'bg-[var(--bg-card)] border border-[var(--border)]',
                        'text-[var(--text)] shadow-3',
                        'z-[var(--z-tooltip)]'
                      )}
                    >
                      {tip}
                      <Tooltip.Arrow className="fill-[var(--border)]" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              )
            })
          )}
        </svg>
      </div>
    </Tooltip.Provider>
  )
}

export { HeatmapChart }
export type { HeatmapChartProps, HeatmapCell }
