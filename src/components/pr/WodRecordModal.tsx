'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

function getToday(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

type ScoreType = 'time' | 'amrap' | 'reps'

interface WodRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    score_type: ScoreType
    time_seconds: number | null
    rounds: number | null
    extra_reps: number | null
    reps: number | null
    memo: string | null
    recorded_at: string
  }) => void
  wodName: string
  description?: string
  defaultScoreType: ScoreType
  allowScoreTypeChange?: boolean
}

export default function WodRecordModal({
  isOpen,
  onClose,
  onSave,
  wodName,
  description,
  defaultScoreType,
  allowScoreTypeChange = false,
}: WodRecordModalProps) {
  const [scoreType, setScoreType] = useState<ScoreType>(defaultScoreType)
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')
  const [rounds, setRounds] = useState('')
  const [extraReps, setExtraReps] = useState('')
  const [reps, setReps] = useState('')
  const [memo, setMemo] = useState('')
  const [recordedAt, setRecordedAt] = useState(getToday())

  if (!isOpen) return null

  function resetForm() {
    setScoreType(defaultScoreType)
    setMinutes('')
    setSeconds('')
    setRounds('')
    setExtraReps('')
    setReps('')
    setMemo('')
    setRecordedAt(getToday())
  }

  function hasScore(): boolean {
    switch (scoreType) {
      case 'time':
        return !!minutes || !!seconds
      case 'amrap':
        return !!rounds
      case 'reps':
        return !!reps
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hasScore()) return

    const data = {
      score_type: scoreType,
      time_seconds: scoreType === 'time'
        ? (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0)
        : null,
      rounds: scoreType === 'amrap' ? (parseInt(rounds) || 0) : null,
      extra_reps: scoreType === 'amrap' ? (parseInt(extraReps) || 0) : null,
      reps: scoreType === 'reps' ? (parseInt(reps) || 0) : null,
      memo: memo.trim() || null,
      recorded_at: recordedAt,
    }

    onSave(data)
    resetForm()
  }

  const SCORE_TYPE_LABELS: Record<ScoreType, string> = {
    time: 'For Time',
    amrap: 'AMRAP',
    reps: 'Reps',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface rounded-t-2xl p-6 pb-8 animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 mr-2">
            <h3 className="text-lg font-bold truncate">{wodName}</h3>
            {description && (
              <p className="text-sm text-text-secondary mt-0.5 line-clamp-2">{description}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-text-secondary flex-shrink-0" aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Score type selector */}
          {allowScoreTypeChange && (
            <div>
              <label className="block text-sm text-text-secondary mb-1">스코어 타입</label>
              <div className="flex gap-2">
                {(['time', 'amrap', 'reps'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setScoreType(t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                      scoreType === t ? 'bg-accent text-white' : 'bg-background border border-border text-foreground'
                    }`}
                  >
                    {SCORE_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Score input */}
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              {scoreType === 'time' ? '기록 (mm:ss) *' : scoreType === 'amrap' ? '라운드 + 렙 *' : '총 렙 *'}
            </label>

            {scoreType === 'time' && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={minutes}
                  onChange={e => setMinutes(e.target.value)}
                  placeholder="mm"
                  min="0"
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-center focus:outline-none focus:border-accent"
                />
                <span className="text-lg font-bold">:</span>
                <input
                  type="number"
                  value={seconds}
                  onChange={e => setSeconds(e.target.value)}
                  placeholder="ss"
                  min="0"
                  max="59"
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-center focus:outline-none focus:border-accent"
                />
              </div>
            )}

            {scoreType === 'amrap' && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={rounds}
                  onChange={e => setRounds(e.target.value)}
                  placeholder="Rounds"
                  min="0"
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-center focus:outline-none focus:border-accent"
                />
                <span className="text-lg font-bold">+</span>
                <input
                  type="number"
                  value={extraReps}
                  onChange={e => setExtraReps(e.target.value)}
                  placeholder="Reps"
                  min="0"
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-center focus:outline-none focus:border-accent"
                />
              </div>
            )}

            {scoreType === 'reps' && (
              <input
                type="number"
                value={reps}
                onChange={e => setReps(e.target.value)}
                placeholder="Total Reps"
                min="0"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-center focus:outline-none focus:border-accent"
              />
            )}
          </div>

          {/* Date input */}
          <div>
            <label className="block text-sm text-text-secondary mb-1">날짜</label>
            <input
              type="date"
              value={recordedAt}
              onChange={e => setRecordedAt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-accent"
            />
          </div>

          {/* Memo */}
          <div>
            <label className="block text-sm text-text-secondary mb-1">메모</label>
            <input
              type="text"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="메모 (선택)"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-accent"
            />
          </div>

          {/* Save button */}
          <button
            type="submit"
            disabled={!hasScore()}
            className="w-full py-2.5 rounded-lg bg-accent text-white font-medium disabled:opacity-50"
          >
            저장
          </button>
        </form>
      </div>
    </div>
  )
}
