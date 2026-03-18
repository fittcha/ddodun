'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { ScoreType } from '@/lib/api/wod'

interface OpenWodAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (wodName: string, scoreType: ScoreType) => void
}

const SCORE_TYPE_LABELS: Record<ScoreType, string> = {
  time: 'For Time',
  amrap: 'AMRAP',
  reps: 'Reps',
}

export default function OpenWodAddModal({ isOpen, onClose, onSave }: OpenWodAddModalProps) {
  const [name, setName] = useState('')
  const [scoreType, setScoreType] = useState<ScoreType>('time')

  if (!isOpen) return null

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave(trimmed, scoreType)
    setName('')
    setScoreType('time')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface rounded-t-2xl p-6 pb-8 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Open WOD 추가</h3>
          <button onClick={onClose} className="p-1 text-text-secondary" aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        {/* Name input */}
        <div className="mb-4">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="WOD 이름 (예: 25.1)"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-accent"
          />
        </div>

        {/* Score type buttons */}
        <div className="flex gap-2 mb-6">
          {(['time', 'amrap', 'reps'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setScoreType(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                scoreType === t
                  ? 'bg-accent text-white'
                  : 'bg-background border border-border text-foreground'
              }`}
            >
              {SCORE_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full py-2.5 rounded-lg bg-accent text-white font-medium disabled:opacity-50"
        >
          추가
        </button>
      </div>
    </div>
  )
}
