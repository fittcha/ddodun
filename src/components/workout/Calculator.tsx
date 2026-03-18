'use client'

import { useEffect, useState } from 'react'
import { getAll1RM, type OneRM } from '@/lib/api/pr'

const DEFAULT_EXERCISES = [
  'Back Squat', 'Front Squat', 'Deadlift', 'Bench Press',
  'Shoulder Press', 'Clean', 'Snatch',
  'Power Clean', 'Power Snatch', 'Clean & Jerk',
  'Push Press', 'Thruster',
]

interface CalculatorProps {
  userId: string
}

export default function Calculator({ userId }: CalculatorProps) {
  const [mode, setMode] = useState<'direct' | '1rm'>('direct')
  const [records, setRecords] = useState<OneRM[]>([])
  const [selectedExercise, setSelectedExercise] = useState('')
  const [inputWeight, setInputWeight] = useState<string>('')
  const [percent, setPercent] = useState<string>('')

  useEffect(() => {
    async function load() {
      if (!userId) return
      try {
        const data = await getAll1RM(userId)
        const withWeight = data.filter(r => r.weight && r.weight > 0)
        const sorted = [
          ...DEFAULT_EXERCISES.filter(name => withWeight.some(r => r.exercise_name === name))
            .map(name => withWeight.find(r => r.exercise_name === name)!),
          ...withWeight.filter(r => !DEFAULT_EXERCISES.includes(r.exercise_name)),
        ]
        setRecords(sorted)
        if (sorted.length > 0) setSelectedExercise(sorted[0].exercise_name)
      } catch (err) {
        console.error('Failed to load 1RM:', err)
      }
    }
    load()
  }, [userId])

  const selected1RM = records.find(r => r.exercise_name === selectedExercise)
  const baseWeight = mode === '1rm' ? (selected1RM?.weight ?? 0) : (parseFloat(inputWeight) || 0)
  const pct = parseFloat(percent) || 0
  const result = baseWeight * pct / 100

  return (
    <div className="space-y-2">
      {/* Row 1: Radio + Select */}
      <div className="flex items-center gap-3 h-7">
        <button onClick={() => setMode('direct')} className="flex items-center gap-1.5 shrink-0">
          <span className={`w-2.5 h-2.5 rounded-full ${mode === 'direct' ? 'bg-accent' : 'bg-text-secondary/40'}`} />
          <span className={`text-sm ${mode === 'direct' ? 'text-accent font-medium' : 'text-text-secondary'}`}>직접입력</span>
        </button>
        <button onClick={() => setMode('1rm')} className="flex items-center gap-1.5 shrink-0">
          <span className={`w-2.5 h-2.5 rounded-full ${mode === '1rm' ? 'bg-accent' : 'bg-text-secondary/40'}`} />
          <span className={`text-sm ${mode === '1rm' ? 'text-accent font-medium' : 'text-text-secondary'}`}>1RM</span>
        </button>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className={`border border-border rounded-lg px-2 py-1 text-sm bg-background w-1/2 min-w-0 ${mode === '1rm' ? '' : 'invisible'}`}
        >
          {records.length === 0 && <option value="">1RM 미등록</option>}
          {records.map(r => (
            <option key={r.exercise_name} value={r.exercise_name}>
              {r.exercise_name} ({r.weight}{r.weight_unit})
            </option>
          ))}
        </select>
      </div>

      {/* Row 2: [weight] × [n]% = result */}
      <div className="flex items-center gap-1.5">
        {mode === 'direct' ? (
          <input
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={inputWeight}
            onChange={(e) => { if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) setInputWeight(e.target.value) }}
            className="w-16 border border-border rounded-lg px-1.5 py-1 text-base text-center bg-background"
          />
        ) : (
          <span className="w-16 text-base text-center font-medium">
            {selected1RM?.weight ?? '0'}
          </span>
        )}
        <span className="text-sm text-text-secondary">×</span>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setPercent(String(Math.max(0, (parseFloat(percent) || 0) - 5)))} className="w-6 h-7 rounded bg-border/50 text-sm text-text-secondary active:bg-border">-</button>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={percent}
            onChange={(e) => { if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) setPercent(e.target.value) }}
            className="w-12 border border-border rounded-lg px-1 py-1 text-base text-center bg-background"
          />
          <button onClick={() => setPercent(String((parseFloat(percent) || 0) + 5))} className="w-6 h-7 rounded bg-border/50 text-sm text-text-secondary active:bg-border">+</button>
        </div>
        <span className="text-sm text-text-secondary">%</span>
        <span className="text-sm text-text-secondary">=</span>
        <span className={`px-2.5 py-0.5 rounded-lg text-base font-bold ${result > 0 ? 'text-accent bg-accent/10' : 'text-text-secondary'}`}>
          {result > 0 ? (result % 1 === 0 ? result.toString() : result.toFixed(1)) : '0'}
        </span>
      </div>
    </div>
  )
}
