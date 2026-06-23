"use client";

import { motion, useReducedMotion } from "framer-motion";
import type React from "react";
import { useMemo, useState } from "react";

export interface ContributionData {
  count: number;
  date: string;
  level: number;
}

export interface ContributionGraphProps {
  className?: string;
  data?: ContributionData[];
  showLegend?: boolean;
  showTooltips?: boolean;
  year?: number;
}

const WEEKS_IN_YEAR = 53;
const DAYS_IN_WEEK = 7;
const JANUARY_MONTH = 0;
const DECEMBER_MONTH = 11;
const SUNDAY_DAY = 0;
const MIN_WEEKS_FOR_DECEMBER_HEADER = 2;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const LEVEL_COLORS = [
  { bg: 'var(--bg-raised)', border: 'var(--border)' },
  { bg: 'rgba(66,132,117,0.25)', border: 'transparent' },
  { bg: 'rgba(66,132,117,0.5)',  border: 'transparent' },
  { bg: 'rgba(66,132,117,0.75)', border: 'transparent' },
  { bg: '#428475',               border: 'transparent' },
]

const isDateInValidRange = (
  currentDate: Date, startDate: Date, endDate: Date, targetYear: number
) => {
  const isInRange = currentDate >= startDate && currentDate <= endDate;
  const isPreviousYearDecember = currentDate.getFullYear() === targetYear - 1 && currentDate.getMonth() === DECEMBER_MONTH;
  const isNextYearJanuary = currentDate.getFullYear() === targetYear + 1 && currentDate.getMonth() === JANUARY_MONTH;
  return isInRange || isPreviousYearDecember || isNextYearJanuary;
};

const createDayData = (currentDate: Date, data: ContributionData[]): ContributionData => {
  const dateString = currentDate.toISOString().split("T")[0];
  const existing = data.find((d) => d.date === dateString);
  return { date: dateString, count: existing?.count ?? 0, level: existing?.level ?? 0 };
};

interface MonthHeaderCheck { currentMonth: number; currentYear: number; startDateDay: number; targetYear: number; weekCount: number; }
const shouldShowMonthHeader = ({ currentYear, targetYear, currentMonth, startDateDay, weekCount }: MonthHeaderCheck) =>
  currentYear === targetYear ||
  (currentYear === targetYear - 1 && currentMonth === DECEMBER_MONTH && startDateDay !== SUNDAY_DAY && weekCount >= MIN_WEEKS_FOR_DECEMBER_HEADER);

const calculateMonthHeaders = (targetYear: number) => {
  const headers: { month: string; colspan: number; startWeek: number }[] = [];
  const startDate = new Date(targetYear, JANUARY_MONTH, 1);
  const firstSunday = new Date(startDate);
  firstSunday.setDate(startDate.getDate() - startDate.getDay());
  let currentMonth = -1, currentYear = -1, monthStartWeek = 0, weekCount = 0;
  for (let w = 0; w < WEEKS_IN_YEAR; w++) {
    const wd = new Date(firstSunday);
    wd.setDate(firstSunday.getDate() + w * DAYS_IN_WEEK);
    const mk = wd.getMonth(), yk = wd.getFullYear();
    if (mk !== currentMonth || yk !== currentYear) {
      if (currentMonth !== -1 && shouldShowMonthHeader({ currentYear, targetYear, currentMonth, startDateDay: startDate.getDay(), weekCount })) {
        headers.push({ month: MONTHS[currentMonth], colspan: weekCount, startWeek: monthStartWeek });
      }
      currentMonth = mk; currentYear = yk; monthStartWeek = w; weekCount = 1;
    } else { weekCount++; }
  }
  if (currentMonth !== -1 && shouldShowMonthHeader({ currentYear, targetYear, currentMonth, startDateDay: startDate.getDay(), weekCount })) {
    headers.push({ month: MONTHS[currentMonth], colspan: weekCount, startWeek: monthStartWeek });
  }
  return headers;
};

export function ContributionGraph({ data = [], year = new Date().getFullYear(), className = "", showLegend = true, showTooltips = true }: ContributionGraphProps) {
  const [hoveredDay, setHoveredDay] = useState<ContributionData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const shouldReduceMotion = useReducedMotion();

  const yearData = useMemo(() => {
    const startDate = new Date(year, JANUARY_MONTH, 1);
    const endDate = new Date(year, DECEMBER_MONTH, 31);
    const days: ContributionData[] = [];
    const firstSunday = new Date(startDate);
    firstSunday.setDate(startDate.getDate() - startDate.getDay());
    for (let w = 0; w < WEEKS_IN_YEAR; w++) {
      for (let d = 0; d < DAYS_IN_WEEK; d++) {
        const cur = new Date(firstSunday);
        cur.setDate(firstSunday.getDate() + w * DAYS_IN_WEEK + d);
        if (isDateInValidRange(cur, startDate, endDate, year)) {
          days.push(createDayData(cur, data));
        } else {
          days.push({ date: "", count: 0, level: 0 });
        }
      }
    }
    return days;
  }, [data, year]);

  const monthHeaders = useMemo(() => calculateMonthHeaders(year), [year]);

  const formatDate = (ds: string) => {
    if (!ds) return "";
    return new Date(ds).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <div className={`contribution-graph ${className}`}>
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-1 text-xs">
          <caption className="sr-only">Contribution Graph for {year}</caption>
          <thead>
            <tr className="h-3">
              <td className="w-7 min-w-7" />
              {monthHeaders.map((h) => (
                <td className="relative text-left" colSpan={h.colspan} key={`${h.month}-${h.startWeek}`}>
                  <span className="absolute top-0 left-1 text-[9px]" style={{ color: 'var(--text-faint)' }}>{h.month}</span>
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: DAYS_IN_WEEK }, (_, dayIndex) => (
              <tr className="h-2.5" key={DAYS[dayIndex]}>
                <td className="relative w-7 min-w-7">
                  {dayIndex % 2 === 0 && (
                    <span className="absolute -bottom-0.5 left-0 text-[8px]" style={{ color: 'var(--text-faint)' }}>{DAYS[dayIndex]}</span>
                  )}
                </td>
                {Array.from({ length: WEEKS_IN_YEAR }, (_, w) => {
                  const day = yearData[w * DAYS_IN_WEEK + dayIndex];
                  const key = `${day?.date ?? "e"}-${w}-${dayIndex}`;
                  if (!day?.date) return <td className="h-2.5 w-2.5 p-0" key={key}><div className="h-2.5 w-2.5" /></td>;
                  const lv = Math.min(day.level, 4);
                  return (
                    <td
                      className="h-2.5 w-2.5 cursor-pointer p-0"
                      key={key}
                      onMouseEnter={(e) => { if (showTooltips) { setHoveredDay(day); setTooltipPos({ x: e.clientX, y: e.clientY }); } }}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-sm transition-transform hover:scale-125"
                        style={{ background: LEVEL_COLORS[lv].bg, border: `1px solid ${LEVEL_COLORS[lv].border}` }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showTooltips && hoveredDay && (
        <motion.div
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          className="pointer-events-none fixed z-50 rounded-lg border px-3 py-2 text-sm shadow-lg"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
          style={{ left: tooltipPos.x + 10, top: tooltipPos.y - 40, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.15 }}
        >
          <div className="font-semibold text-xs">
            {hoveredDay.count === 0 ? "No activity" : `${hoveredDay.count} ${hoveredDay.count === 1 ? "habit" : "habits"}`}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatDate(hoveredDay.date)}</div>
        </motion.div>
      )}

      {showLegend && (
        <div className="mt-3 flex items-center justify-end gap-1.5 text-[9px]" style={{ color: 'var(--text-faint)' }}>
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div key={level} className="w-2.5 h-2.5 rounded-sm" style={{ background: LEVEL_COLORS[level].bg, border: `1px solid ${LEVEL_COLORS[level].border}` }} />
          ))}
          <span>More</span>
        </div>
      )}
    </div>
  );
}

export default ContributionGraph;
