'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Copy, Check, RotateCcw } from 'lucide-react'
import type { WorkoutTemplate } from '@/lib/api/workout-templates'
import type { WorkoutLog } from '@/lib/api/workout-logs'
import type { DaySummary, DaySummaryBlock } from '@/lib/api/day-summaries'
import { reconcileSummary } from '@/lib/day-summary'

interface TodaySummaryProps {
  templates: WorkoutTemplate[]
  logs: WorkoutLog[]
  stored: DaySummary | null
  onSave: (text: string, blocks: DaySummaryBlock[]) => void
}

export default function TodaySummary({ templates, logs, stored, onSave }: TodaySummaryProps) {
  const [doc, setDoc] = useState<DaySummary | null>(stored)
  const docRef = useRef<DaySummary | null>(stored)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 데이터 변경 시 reconcile (편집 중이 아닐 때). base = 현재 문서(편집 반영) ?? stored.
  useEffect(() => {
    if (editing) return
    const base = docRef.current ?? stored
    const next = reconcileSummary(base, templates, logs)
    const changed = !base
      || next.text !== base.text
      || JSON.stringify(next.blocks) !== JSON.stringify(base.blocks)
    docRef.current = next
    setDoc(next)
    if (changed && next.text) onSave(next.text, next.blocks)
  }, [templates, logs, stored, editing, onSave])

  const displayText = doc?.text ?? ''

  function handleEdit(v: string) {
    const next: DaySummary = { text: v, blocks: docRef.current?.blocks ?? [] }
    docRef.current = next
    setDoc(next)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => onSave(next.text, next.blocks), 800)
  }

  function handleReset() {
    const next = reconcileSummary(null, templates, logs)
    docRef.current = next
    setDoc(next)
    setEditing(false)
    onSave(next.text, next.blocks)
  }

  function handleCopy() {
    navigator.clipboard.writeText(displayText)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (!displayText && !editing) return null

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold">오늘 운동 요약</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="text-text-secondary active:text-accent"
            title="처음부터 다시 생성"
          >
            <RotateCcw size={15} />
          </button>
          <button
            onClick={() => setEditing(!editing)}
            className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
              editing ? 'bg-accent text-white' : 'text-text-secondary'
            }`}
          >
            {editing ? '완료' : '수정'}
          </button>
          <button
            onClick={handleCopy}
            className="text-text-secondary active:text-accent"
          >
            {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {editing ? (
        <textarea
          value={displayText}
          onChange={e => handleEdit(e.target.value)}
          className="w-full min-h-[200px] text-xs leading-relaxed bg-background border border-border rounded-lg p-3 text-foreground resize-y focus:outline-none focus:border-accent"
        />
      ) : (
        <pre className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">{displayText}</pre>
      )}
    </div>
  )
}
