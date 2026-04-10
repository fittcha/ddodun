'use client'

import { useState, useMemo } from 'react'
import { Copy, Check } from 'lucide-react'
import type { WorkoutTemplate } from '@/lib/api/workout-templates'
import type { WorkoutLog } from '@/lib/api/workout-logs'

interface TodaySummaryProps {
  templates: WorkoutTemplate[]
  logs: WorkoutLog[]
}

function parseDetail(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return {} }
  }
  return {}
}

/** Extract weight text from a log's sets_detail */
function getWeightText(detail: Record<string, unknown>): string {
  // Climbing weight sets
  if (Array.isArray(detail.sets) && detail.sets.length > 0) {
    const unit = (detail.weight_unit as string) || 'lb'
    const weights = detail.sets
      .map((s: { weight?: number | null }) => s.weight != null ? `${s.weight}${unit}` : null)
      .filter(Boolean)
    if (weights.length > 0) return weights.join(' - ')
  }
  // Single weight
  if (detail.weight != null) {
    const unit = (detail.weight_unit as string) || 'lb'
    return `${detail.weight}${unit}`
  }
  // Exercise weights (section-title templates)
  if (detail.exercise_weights && typeof detail.exercise_weights === 'object') {
    const ew = detail.exercise_weights as Record<string, { weight?: number | null; unit?: string }>
    const parts = Object.values(ew)
      .filter(v => v.weight != null)
      .map(v => `${v.weight}${v.unit || 'lb'}`)
    if (parts.length > 0) return parts.join(' / ')
  }
  return ''
}

/** Extract result text (reps/rounds/cal/time/emom) from a log's sets_detail */
function getResultText(detail: Record<string, unknown>): string {
  // EMOM
  if (Array.isArray(detail.emom) && detail.emom.length > 0) {
    const lines = detail.emom.map((e: { name?: string; value?: number | null; measure?: string; weight?: number | null; weight_unit?: string }, i: number) => {
      const minNum = i + 1
      let line = `${minNum}MIN: `
      if (e.value != null) line += e.measure === 'cal' ? `${e.value}cal ` : `${e.value} `
      line += e.name || ''
      if (e.weight != null) line += ` @${e.weight}${e.weight_unit || 'lb'}`
      return line.trimEnd()
    })
    if (lines.length > 0) return '\n' + lines.join('\n')
  }
  // Multi-set results
  if (Array.isArray(detail.result_sets) && detail.result_sets.length > 0) {
    const rt = detail.result_type as string
    const parts = detail.result_sets.map((s: Record<string, unknown>) => {
      if (rt === 'rounds' && s.rounds != null) {
        const extra = s.extra_reps ? ` + ${s.extra_reps}` : ''
        return `${s.rounds}R${extra}`
      }
      if (rt === 'reps' && s.reps != null) return `${s.reps}reps`
      if (rt === 'cal' && s.cal != null) return `${s.cal}cal`
      if (rt === 'time' && (s.minutes != null || s.seconds != null)) {
        return `${s.minutes || 0}:${String(s.seconds || 0).padStart(2, '0')}`
      }
      return null
    }).filter(Boolean)
    if (parts.length > 0) return parts.join(' / ')
  }
  // Legacy single-value
  if (detail.result_type === 'rounds' && detail.rounds != null) {
    const extra = detail.extra_reps ? ` + ${detail.extra_reps}` : ''
    return `${detail.rounds}R${extra}`
  }
  if (detail.result_type === 'reps' && detail.reps != null) return `${detail.reps}reps`
  if (detail.result_type === 'cal' && detail.cal != null) return `${detail.cal}cal`
  if (detail.result_type === 'time' && (detail.minutes != null || detail.seconds != null)) {
    return `${detail.minutes || 0}:${String(detail.seconds || 0).padStart(2, '0')}`
  }
  return ''
}

/** Combine weight + result into display text */
function combineResult(weight: string, result: string): string {
  if (weight && result) {
    if (result.startsWith('\n')) return `${weight}${result}` // EMOM: newlines
    return `${weight} / ${result}`
  }
  return weight || result
}

function generateSummaryText(templates: WorkoutTemplate[], logs: WorkoutLog[]): string {
  // Create log lookup — only completed logs
  const logMap = new Map<string, WorkoutLog>()
  for (const l of logs) {
    if (l.template_id && l.completed) logMap.set(l.template_id, l)
  }

  // Filter templates to only those with completed logs, sorted by section + sort_order
  const completed = templates
    .filter(t => logMap.has(t.id))
    .sort((a, b) => a.section.localeCompare(b.section) || a.sort_order - b.sort_order)

  if (completed.length === 0) return ''

  // Group by section (order preserved from sort)
  const sections: { section: string; items: WorkoutTemplate[] }[] = []
  for (const t of completed) {
    const last = sections[sections.length - 1]
    if (last && last.section === t.section) {
      last.items.push(t)
    } else {
      sections.push({ section: t.section, items: [t] })
    }
  }

  const parts: string[] = []

  for (const { section, items } of sections) {
    const lines: string[] = [`${section}.`]

    // First pass: extract weight/result per template
    const entries = items.map(t => {
      const log = logMap.get(t.id)!
      const detail = parseDetail(log.sets_detail)
      return { template: t, log, weight: getWeightText(detail), result: getResultText(detail) }
    })

    // Second pass: propagate orphan result (from group anchor) to weight-only entries
    // An orphan result = has result but no weight; weight-only = has weight but no result
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i]
      if (e.result && !e.weight) {
        // This is likely a group anchor with result-only — find adjacent weight-only entry to merge
        for (let j = i + 1; j < entries.length; j++) {
          if (entries[j].weight && !entries[j].result) {
            entries[j].result = e.result
            e.result = '' // consumed
            break
          }
        }
      }
    }

    entries.forEach((e, i) => {
      if (i > 0) lines.push('')
      if (e.template.title) lines.push(e.template.title)
      if (e.template.description) {
        const descLines = e.template.description.split('\n')
        for (const dl of descLines) {
          lines.push(dl)
          if (/^rest\s+\d/i.test(dl.trim())) lines.push('')
        }
      }

      const combined = combineResult(e.weight, e.result)
      if (combined) {
        if (combined.startsWith('\n')) {
          lines.push(combined.trimStart())
        } else {
          lines.push(`→ ${combined}`)
        }
      }
      if (e.log.memo) lines.push(`📝 ${e.log.memo}`)
    })

    parts.push(lines.join('\n'))
  }

  return parts.join('\n\n')
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
