'use client'

import { Trash2, Trophy } from 'lucide-react'
import type { WodRecord } from '@/lib/api/wod'

interface WodHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: () => void
  onDelete: (id: string) => void
  wodName: string
  description?: string
  records: WodRecord[]
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatScore(record: WodRecord): string {
  switch (record.score_type) {
    case 'time':
      return record.time_seconds != null ? formatTime(record.time_seconds) : '-'
    case 'amrap':
      if (record.rounds == null) return '-'
      return record.extra_reps ? `${record.rounds}+${record.extra_reps}` : `${record.rounds} rds`
    case 'reps':
      return record.reps != null ? `${record.reps} reps` : '-'
    default:
      return '-'
  }
}

function findPrId(records: WodRecord[]): string | null {
  if (records.length === 0) return null

  const scoreType = records[0].score_type
  let prRecord: WodRecord | null = null
  let prValue = scoreType === 'time' ? Infinity : -Infinity

  for (const r of records) {
    let value: number | null = null

    switch (scoreType) {
      case 'time':
        value = r.time_seconds
        if (value != null && value < prValue) {
          prValue = value
          prRecord = r
        }
        break
      case 'amrap':
        value = r.rounds != null ? r.rounds * 1000 + (r.extra_reps ?? 0) : null
        if (value != null && value > prValue) {
          prValue = value
          prRecord = r
        }
        break
      case 'reps':
        value = r.reps
        if (value != null && value > prValue) {
          prValue = value
          prRecord = r
        }
        break
    }
  }

  return prRecord?.id ?? null
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`
}

export default function WodHistoryModal({ isOpen, onClose, onAdd, onDelete, wodName, description, records }: WodHistoryModalProps) {
  if (!isOpen) return null

  const prId = findPrId(records)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface rounded-t-2xl flex flex-col max-h-[70vh] animate-slide-up">
        {/* Header */}
        <div className="p-6 pb-3">
          <h3 className="text-lg font-bold">{wodName}</h3>
          {description && (
            <p className="text-sm text-text-secondary mt-1">{description}</p>
          )}
        </div>

        {/* Record list */}
        <div className="flex-1 overflow-y-auto px-6">
          {records.length === 0 ? (
            <p className="text-center text-text-secondary py-8">아직 기록이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {records.map(record => {
                const isPr = record.id === prId
                return (
                  <div
                    key={record.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isPr
                        ? 'border-accent/50 bg-accent/5'
                        : 'border-border bg-background'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isPr && <Trophy size={16} className="text-accent shrink-0" />}
                      <div className="min-w-0">
                        <span className="font-semibold">{formatScore(record)}</span>
                        <span className="text-sm text-text-secondary ml-2">{formatDate(record.recorded_at)}</span>
                        {record.memo && (
                          <p className="text-xs text-text-secondary truncate">{record.memo}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onDelete(record.id)}
                      className="p-1.5 text-text-secondary hover:text-red-500 shrink-0"
                      aria-label="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Bottom button */}
        <div className="p-6 pt-4">
          <button
            onClick={onAdd}
            className="w-full py-2.5 rounded-lg bg-accent text-white font-medium"
          >
            기록 추가
          </button>
        </div>
      </div>
    </div>
  )
}
