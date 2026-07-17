'use client'

import { useState, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import type { WorkoutTemplate } from '@/lib/api/workout-templates'
import type { WorkoutLog } from '@/lib/api/workout-logs'
import { generateSummaryText } from '@/lib/day-summary'

interface TodaySummaryProps {
  templates: WorkoutTemplate[]
  logs: WorkoutLog[]
}

export default function TodaySummary({ templates, logs }: TodaySummaryProps) {
  const generatedText = useMemo(() => generateSummaryText(templates, logs), [templates, logs])
  const [text, setText] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  // Use edited text if user modified, otherwise use generated
  const displayText = text ?? generatedText

  // Reset edited text when generated text changes (new data loaded)
  const [prevGenerated, setPrevGenerated] = useState(generatedText)
  if (generatedText !== prevGenerated) {
    setPrevGenerated(generatedText)
    if (!editing) setText(null)
  }

  function handleCopy() {
    navigator.clipboard.writeText(displayText)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (!generatedText) return null

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold">오늘 운동 요약</h3>
        <div className="flex items-center gap-2">
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
          onChange={e => setText(e.target.value)}
          className="w-full min-h-[200px] text-xs leading-relaxed bg-background border border-border rounded-lg p-3 text-foreground resize-y focus:outline-none focus:border-accent"
        />
      ) : (
        <pre className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">{displayText}</pre>
      )}
    </div>
  )
}
