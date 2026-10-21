'use client'

import { useState } from 'react'
import { WEEK_DAY_LABELS } from '@/lib/date-utils'
import type { WeekSwapState } from '@/lib/api/day-swaps'

interface DaySwapPopoverProps {
  date: string
  weekDays: string[]
  state: WeekSwapState
  align: 'left' | 'center' | 'right'
  onPick: (target: string) => void
  onClose: () => void
}

const ALIGN = {
  left: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  right: 'right-0',
}

/** 주간 스트립에서 요일을 길게 눌렀을 때 그 요일 아래에 뜨는 "바꿀 날" 팝업. */
export default function DaySwapPopover({ date, weekDays, state, align, onPick, onClose }: DaySwapPopoverProps) {
  const [picking, setPicking] = useState(false)
  const label = (d: string) => WEEK_DAY_LABELS[weekDays.indexOf(d)]
  const coach = new Set(state.coachDates)
  const records = new Set(state.recordDates)
  const selfReason = !coach.has(date)
    ? '운동이 없는 날은 바꿀 수 없어요'
    : records.has(date)
      ? '기록이 있는 날은 바꿀 수 없어요'
      : null

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className={`absolute top-full mt-1.5 z-50 ${ALIGN[align]} bg-surface border border-border rounded-xl shadow-lg px-3 py-2.5 whitespace-nowrap`}>
        {selfReason ? (
          <p className="text-xs">{selfReason}</p>
        ) : !picking ? (
          <button onClick={() => setPicking(true)} className="text-xs font-medium">
            ⇄ 날짜 바꾸기
          </button>
        ) : (
          <>
          <p className="text-[11px] text-text-secondary mb-2">
            {label(date)}({parseInt(date.slice(8, 10))})과 바꿀 날
          </p>
          <div className="flex gap-1">
            {weekDays.filter(d => d !== date).map(d => {
              const disabled = !coach.has(d) || records.has(d)
              return (
                <button
                  key={d}
                  disabled={disabled}
                  onClick={() => onPick(d)}
                  className={`min-w-[30px] px-1.5 py-1 rounded-md border text-xs font-medium ${
                    disabled ? 'border-border text-text-secondary/40' : 'border-border active:bg-accent active:text-white'
                  }`}
                >
                  {label(d)}
                </button>
              )
            })}
          </div>
          </>
        )}
      </div>
    </>
  )
}
