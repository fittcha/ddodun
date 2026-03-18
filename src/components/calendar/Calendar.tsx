'use client'

import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthDays, formatDate, getToday, DAY_LABELS } from '@/lib/date-utils'

interface CalendarProps {
  year: number
  month: number
  onMonthChange: (year: number, month: number) => void
  onDateSelect: (date: string) => void
  templateDates: Set<string>
  logDates: Set<string>
  competitionDates: Set<string>
}

export default function Calendar({
  year, month, onMonthChange, onDateSelect,
  templateDates, logDates, competitionDates,
}: CalendarProps) {
  const today = getToday()
  const days = useMemo(() => getMonthDays(year, month), [year, month])

  function prevMonth() {
    if (month === 1) onMonthChange(year - 1, 12)
    else onMonthChange(year, month - 1)
  }

  function nextMonth() {
    if (month === 12) onMonthChange(year + 1, 1)
    else onMonthChange(year, month + 1)
  }

  function goToday() {
    const now = new Date()
    onMonthChange(now.getFullYear(), now.getMonth() + 1)
  }

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 text-text-secondary" aria-label="이전 달">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold">{year}년 {month}월</span>
          <button
            onClick={goToday}
            className="text-xs px-2 py-0.5 rounded-full bg-warm/40 text-accent font-medium"
          >
            오늘
          </button>
        </div>
        <button onClick={nextMonth} className="p-1 text-text-secondary" aria-label="다음 달">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(label => (
          <div key={label} className="text-center text-xs text-text-secondary py-1">
            {label}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          if (day === null) return <div key={`blank-${idx}`} />

          const dateStr = formatDate(year, month, day)
          const isToday = dateStr === today
          const hasLog = logDates.has(dateStr)
          const hasTemplate = templateDates.has(dateStr)
          const hasComp = competitionDates.has(dateStr)

          return (
            <button
              key={dateStr}
              onClick={() => onDateSelect(dateStr)}
              className="flex flex-col items-center py-1.5 rounded-lg transition-colors active:bg-accent-light"
            >
              <span
                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${
                  isToday
                    ? 'bg-accent text-white font-bold'
                    : 'text-foreground'
                }`}
              >
                {day}
              </span>
              <div className="flex gap-0.5 h-2 items-center mt-1">
                {hasLog && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                )}
                {!hasLog && hasTemplate && (
                  <span className="w-1.5 h-1.5 rounded-full bg-border" />
                )}
                {hasComp && (
                  <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
