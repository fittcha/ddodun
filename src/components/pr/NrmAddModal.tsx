'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

const DEFAULT_EXERCISES = [
  'Back Squat', 'Front Squat', 'Deadlift', 'Bench Press',
  'Shoulder Press', 'Push Press', 'Clean', 'Power Clean',
  'Clean & Jerk', 'Push Jerk', 'Snatch', 'Power Snatch',
]

interface NrmAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (exercise: string, repMax: number, weight: number, unit: string) => void
  customExercises?: string[]
}

export default function NrmAddModal({ isOpen, onClose, onSave, customExercises = [] }: NrmAddModalProps) {
  const [exercise, setExercise] = useState('')
  const [repMax, setRepMax] = useState(2)
  const [weight, setWeight] = useState('')
  const [unit, setUnit] = useState('lb')

  if (!isOpen) return null

  const allExercises = [...DEFAULT_EXERCISES, ...customExercises.filter(e => !DEFAULT_EXERCISES.includes(e))]

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!exercise || !weight) return
    onSave(exercise, repMax, parseFloat(weight), unit)
    setExercise('')
    setWeight('')
    setRepMax(2)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface rounded-t-2xl p-6 pb-8 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">nRM 추가</h3>
          <button onClick={onClose} className="p-1 text-text-secondary" aria-label="닫기"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">운동 *</label>
            <select
              value={exercise}
              onChange={e => setExercise(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-accent"
            >
              <option value="">선택</option>
              {allExercises.map(ex => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">n값 (2~10) *</label>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: 9 }, (_, i) => i + 2).map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRepMax(n)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium ${
                    repMax === n ? 'bg-accent text-white' : 'bg-background border border-border text-foreground'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm text-text-secondary mb-1">무게 *</label>
              <input
                type="number"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                required
                step="0.5"
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">단위</label>
              <div className="flex">
                {(['lb', 'kg'] as const).map(u => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`px-3 py-2 text-sm font-medium first:rounded-l-lg last:rounded-r-lg border ${
                      unit === u ? 'bg-accent text-white border-accent' : 'bg-background border-border text-foreground'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={!exercise || !weight}
            className="w-full py-2.5 rounded-lg bg-accent text-white font-medium disabled:opacity-50"
          >
            저장
          </button>
        </form>
      </div>
    </div>
  )
}
