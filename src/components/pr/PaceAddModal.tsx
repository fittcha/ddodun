'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

const DEFAULT_EQUIPMENT = ['Rowing', 'Running']
const DISTANCE_BY_EQUIPMENT: Record<string, string[]> = {
  'Rowing': ['2K', '5K'],
  'Running': ['5K', '10K'],
}

interface PaceAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (equipment: string, distance: string, timeSeconds: number) => void
}

export default function PaceAddModal({ isOpen, onClose, onSave }: PaceAddModalProps) {
  const [equipment, setEquipment] = useState('')
  const [distance, setDistance] = useState('')
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')

  if (!isOpen) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!equipment || !distance || !minutes) return
    const totalSeconds = parseInt(minutes) * 60 + (parseInt(seconds) || 0)
    onSave(equipment, distance, totalSeconds)
    setEquipment('')
    setDistance('')
    setMinutes('')
    setSeconds('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface rounded-t-2xl p-6 pb-8 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">페이스 기록 추가</h3>
          <button onClick={onClose} className="p-1 text-text-secondary" aria-label="닫기"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">종목 *</label>
            <div className="flex gap-2">
              {DEFAULT_EQUIPMENT.map(eq => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => { setEquipment(eq); setDistance('') }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    equipment === eq ? 'bg-accent text-white' : 'bg-background border border-border text-foreground'
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">거리 *</label>
            <div className="flex gap-2">
              {(DISTANCE_BY_EQUIPMENT[equipment] || ['2K', '5K']).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDistance(d)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    distance === d ? 'bg-accent text-white' : 'bg-background border border-border text-foreground'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">총 시간 (mm:ss) *</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={minutes}
                onChange={e => setMinutes(e.target.value)}
                required
                placeholder="분"
                min="0"
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-center focus:outline-none focus:border-accent"
              />
              <span className="text-lg font-bold">:</span>
              <input
                type="number"
                value={seconds}
                onChange={e => setSeconds(e.target.value)}
                placeholder="초"
                min="0"
                max="59"
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-center focus:outline-none focus:border-accent"
              />
            </div>
            {equipment && distance && minutes && (() => {
              const total = parseInt(minutes) * 60 + (parseInt(seconds) || 0)
              if (total <= 0) return null
              const splits = equipment === 'Rowing'
                ? (parseInt(distance) * 1000) / 500
                : parseInt(distance)
              const paceSeconds = total / splits
              const pm = Math.floor(paceSeconds / 60)
              const ps = paceSeconds % 60
              const label = equipment === 'Rowing' ? '/500m' : '/km'
              return (
                <p className="text-sm text-accent font-medium mt-2 text-center">
                  페이스: {pm}:{ps.toFixed(1).padStart(4, '0')}{label}
                </p>
              )
            })()}
          </div>
          <button
            type="submit"
            disabled={!equipment || !distance || !minutes}
            className="w-full py-2.5 rounded-lg bg-accent text-white font-medium disabled:opacity-50"
          >
            저장
          </button>
        </form>
      </div>
    </div>
  )
}
