'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { upsertLog, type WorkoutLog } from '@/lib/api/workout-logs'

interface CustomWorkoutFormProps {
  userId: string
  date: string
  onAdd: (log: WorkoutLog) => void
}

export default function CustomWorkoutForm({ userId, date, onAdd }: CustomWorkoutFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [result, setResult] = useState('')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const log = await upsertLog(userId, {
        date,
        is_custom: true,
        exercise_name: name.trim(),
        result_value: result.trim() || null,
        memo: memo.trim() || null,
        completed: true,
      })
      onAdd(log)
      setName('')
      setResult('')
      setMemo('')
      setIsOpen(false)
    } catch (err) {
      console.error('Failed to add custom workout:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 rounded-lg border-2 border-dashed border-border text-text-secondary text-sm flex items-center justify-center gap-1"
      >
        <Plus size={16} />
        운동 추가
      </button>
    )
  }

  return (
    <div className="bg-surface rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">개인 운동 추가</span>
        <button onClick={() => setIsOpen(false)} className="p-1 text-text-secondary">
          <X size={16} />
        </button>
      </div>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="운동명 *"
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background placeholder:text-text-secondary focus:outline-none focus:border-accent"
      />
      <input
        type="text"
        value={result}
        onChange={e => setResult(e.target.value)}
        placeholder="결과 (무게, 시간 등)"
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background placeholder:text-text-secondary focus:outline-none focus:border-accent"
      />
      <input
        type="text"
        value={memo}
        onChange={e => setMemo(e.target.value)}
        placeholder="메모"
        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background placeholder:text-text-secondary focus:outline-none focus:border-accent"
      />
      <button
        onClick={handleSubmit}
        disabled={!name.trim() || saving}
        className="w-full py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50"
      >
        {saving ? '저장 중...' : '추가'}
      </button>
    </div>
  )
}
