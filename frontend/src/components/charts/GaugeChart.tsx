'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'

interface GaugeChartProps {
  value:        number
  min?:         number
  max?:         number
  label?:       string
  sublabel?:    string
  size?:        number
  strokeWidth?: number
  color?:       string
  trackColor?:  string
  showValue?:   boolean
  formatValue?: (v: number) => string
  className?:   string
  thresholds?:  { value: number; color: string }[]
}

function GaugeChart({
  value,
  min = 0,
  max = 100,
  label,
  sublabel,
  size = 160,
  strokeWidth = 12,
  color,
  trackColor,
  showValue = true,
  formatValue,
  className,
  thresholds,
}: GaugeChartProps) {
  const pct = Math.min(Math.max((value - min) / (max - min), 0), 1)

  /* 220-degree arc from -200deg to 40deg (left to right across bottom) */
  const startAngle = -200
  const totalAngle = 220
  const angle      = startAngle + pct * totalAngle

  const cx = size / 2
  const cy = size / 2
  const r  = (size - strokeWidth * 2) / 2

  const toRad = (deg: number) => (deg * Math.PI) / 180

  function arc(startDeg: number, endDeg: number) {
    const s  = toRad(startDeg)
    const e  = toRad(endDeg)
    const x1 = cx + r * Math.cos(s)
    const y1 = cy + r * Math.sin(s)
    const x2 = cx + r * Math.cos(e)
    const y2 = cy + r * Math.sin(e)
    const largeArc = endDeg - startDeg > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
  }

  /* Resolve fill color */
  let fillColor = color ?? 'var(--primary)'
  if (thresholds?.length) {
    const match = [...thresholds].reverse().find(t => pct * (max - min) + min >= t.value)
    if (match) fillColor = match.color
  }

  /* Needle tip */
  const needleRad   = toRad(angle)
  const needleLen   = r - 4
  const needleTipX  = cx + needleLen * Math.cos(needleRad)
  const needleTipY  = cy + needleLen * Math.sin(needleRad)

  const displayValue = formatValue ? formatValue(value) : `${Math.round(value)}`

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div style={{ width: size, height: size }} className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={label}>
          {/* Track */}
          <path
            d={arc(startAngle, startAngle + totalAngle)}
            fill="none"
            stroke={trackColor ?? 'var(--bg-raised)'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Fill */}
          <path
            d={arc(startAngle, startAngle + pct * totalAngle)}
            fill="none"
            stroke={fillColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${fillColor}66)`,
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.25,0.46,0.45,0.94)',
            }}
          />
          {/* Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={needleTipX}
            y2={needleTipY}
            stroke={fillColor}
            strokeWidth={2}
            strokeLinecap="round"
            style={{ transition: 'x2 0.8s ease-out, y2 0.8s ease-out' }}
          />
          <circle cx={cx} cy={cy} r={4} fill={fillColor} />
          {/* Center value */}
          {showValue && (
            <text
              x={cx}
              y={cy + strokeWidth * 2 + 10}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="20"
              fontWeight="700"
              fill="var(--text)"
            >
              {displayValue}
            </text>
          )}
        </svg>
      </div>
      {label && (
        <p className="text-sm font-medium text-[var(--text)] text-center">{label}</p>
      )}
      {sublabel && (
        <p className="text-xs text-[var(--text-muted)] text-center">{sublabel}</p>
      )}
    </div>
  )
}

export { GaugeChart }
export type { GaugeChartProps }
