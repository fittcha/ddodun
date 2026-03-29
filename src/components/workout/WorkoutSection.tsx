'use client'

import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react'
import type { WorkoutTemplate } from '@/lib/api/workout-templates'
import type { WorkoutLog } from '@/lib/api/workout-logs'
import { upsertLog } from '@/lib/api/workout-logs'
import WeightSetsInput, { type WeightSetsData } from './WeightSetsInput'
import ResultInput, { type ResultData, type ResultType } from './ResultInput'
import EmomBuilder, { type EmomData } from './EmomBuilder'

type InputMode = 'weight' | ResultType  // 'weight' | 'rounds' | 'reps' | 'time'

interface WorkoutSectionProps {
  userId: string
  section: string
  templates: WorkoutTemplate[]
  logs: WorkoutLog[]
  date: string
  onLogUpdate: (log: WorkoutLog) => void
}

function parseDetail(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return {} }
  }
  return {}
}

function isEmomType(template: WorkoutTemplate): boolean {
  return template.title?.toLowerCase().includes('emom') || template.workout_type === 'emom'
}

type LineType = 'exercise' | 'note' | 'subheader'

function parseDescription(desc: string | null): {
  setInfo: string | null
  exercises: string[]
  notes: string[]
  orderedLines: { text: string; type: LineType }[]
} {
  if (!desc) return { setInfo: null, exercises: [], notes: [], orderedLines: [] }
  const lines = desc.split('\n').map(l => l.trim()).filter(Boolean)
  let setInfo: string | null = null
  const exercises: string[] = []
  const notes: string[] = []
  const orderedLines: { text: string; type: LineType }[] = []

  for (const line of lines) {
    if (!setInfo && /^\d+\s*(sets?|x\s*\d+)/i.test(line)) {
      setInfo = line
    } else if (!setInfo && /^every\s+/i.test(line)) {
      setInfo = line
    } else if (!setInfo && /^\d+\s+rounds?/i.test(line)) {
      setInfo = line
    } else if (!setInfo && /^EMOM\s+\d+/i.test(line)) {
      setInfo = line
    } else if (setInfo && exercises.length === 0 && line.startsWith('(')) {
      setInfo = `${setInfo} · ${line}`
    } else if (/^\d+(-\d+)+$/.test(line) || /^\d+\s+rounds?\s+for/i.test(line)) {
      orderedLines.push({ text: line, type: 'subheader' })
    } else if (
      line.startsWith('*') || line.startsWith('@') || line.startsWith('- Rest')
      || /^Rest\s+/i.test(line) || line === '+'
      || /^\d+\s*x\s*\(/.test(line)
      || /^\d+(-\d+)+\s*,/.test(line)
    ) {
      notes.push(line)
      orderedLines.push({ text: line, type: 'note' })
    } else {
      exercises.push(line)
      orderedLines.push({ text: line, type: 'exercise' })
    }
  }
  return { setInfo, exercises, notes, orderedLines }
}

// Titles that are section-level labels, not exercise names
function isSectionTitle(title: string | null): boolean {
  if (!title) return false
  return /^(amrap|emom|e\d+mom|for\s+time)/i.test(title)
}

// Extract label for section header: section-level title or set info from description
function extractSectionLabel(templates: WorkoutTemplate[]): string | null {
  // First check for section-level titles (AMRAP 9, EMOM 40, etc.)
  for (const t of templates) {
    if (isSectionTitle(t.title)) return t.title!
  }
  // Then check description for set info (only first template's)
  if (templates.length > 0) {
    const parsed = parseDescription(templates[0].description)
    if (parsed.setInfo) return parsed.setInfo
  }
  return null
}

// Reusable weight button (collapsed/expanded)
function WeightButton({ isOpen, onOpen, onClose, weight, unit, onAdjust, onSet, onToggleUnit }: {
  weightKey: string
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  weight: number | null
  unit: string
  onAdjust: (delta: number) => void
  onSet: (v: number | null) => void
  onToggleUnit: () => void
}) {
  if (isOpen) {
    return (
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button onClick={() => onAdjust(-5)} className="w-6 h-6 rounded border border-border bg-background flex items-center justify-center text-text-secondary/50 text-xs active:bg-accent/10">−</button>
        <input
          type="number"
          inputMode="decimal"
          value={weight ?? ''}
          onChange={e => onSet(e.target.value ? parseFloat(e.target.value) : null)}
          placeholder="—"
          className="w-12 text-center text-xs rounded border border-border bg-background py-1 text-foreground placeholder:text-text-secondary/20 focus:outline-none focus:border-accent"
        />
        <button onClick={() => onAdjust(5)} className="w-6 h-6 rounded border border-border bg-background flex items-center justify-center text-text-secondary/50 text-xs active:bg-accent/10">+</button>
        <button onClick={onToggleUnit} className="text-[10px] font-bold text-accent w-5 text-center">{unit}</button>
        <button onClick={onClose} className="text-text-secondary/30 text-[10px] ml-0.5">✕</button>
      </div>
    )
  }
  return (
    <button onClick={onOpen} className="w-5 h-5 rounded-full border border-text-secondary/30 text-[8px] font-bold text-text-secondary flex-shrink-0 flex items-center justify-center">
      {unit}
    </button>
  )
}

interface TemplateGroup {
  templates: WorkoutTemplate[]
  anchorId: string
  hasEmom: boolean
  separatorData: {
    restNote: string | null
    leadingRest: string | null
    setInfo: string | null
  } | null
}

function computeGroups(templates: WorkoutTemplate[]): TemplateGroup[] {
  const groups: TemplateGroup[] = []
  let current: WorkoutTemplate[] = []

  for (let idx = 0; idx < templates.length; idx++) {
    const parsed = parseDescription(templates[idx].description)
    const showSeparator = idx > 0 && parsed.setInfo

    if (showSeparator && current.length > 0) {
      // Finalize previous group
      groups.push({
        templates: current,
        anchorId: current[0].id,
        hasEmom: current.some(isEmomType),
        separatorData: null,
      })

      // Compute separator data for this new group
      const prevTemplate = templates[idx - 1]
      const prevParsed = parseDescription(prevTemplate.description)
      const restNote = prevParsed.notes.find(n => /rest\s+as\s+needed/i.test(n)) || null
      const leadingRest = parsed.orderedLines.length > 0 && parsed.orderedLines[0].type === 'note' && /^Rest\s+/i.test(parsed.orderedLines[0].text)
        ? parsed.orderedLines[0].text : null

      current = [templates[idx]]
      // We'll store separator data on this new group
      groups.push({
        templates: [], // placeholder, will be filled
        anchorId: templates[idx].id,
        hasEmom: false,
        separatorData: { restNote, leadingRest, setInfo: parsed.setInfo },
      })
      // Remove the placeholder and start properly
      groups.pop()
      current = [templates[idx]]
      // Store separator info to apply when we finalize this group
      ;(current as unknown as { _sep: TemplateGroup['separatorData'] })._sep = { restNote, leadingRest, setInfo: parsed.setInfo }
    } else {
      current.push(templates[idx])
    }
  }

  if (current.length > 0) {
    const sep = (current as unknown as { _sep: TemplateGroup['separatorData'] })._sep || null
    groups.push({
      templates: current,
      anchorId: current[0].id,
      hasEmom: current.some(isEmomType),
      separatorData: sep,
    })
  }

  return groups
}

function WorkoutSectionInner({ userId, section, templates, logs, date, onLogUpdate }: WorkoutSectionProps) {
  const [localLogs, setLocalLogs] = useState<Record<string, WorkoutLog>>({})
  // Per-group toggles (keyed by group anchor template id)
  const [resultOpen, setResultOpen] = useState<Record<string, boolean>>({})
  const [memoOpen, setMemoOpen] = useState<Record<string, boolean>>({})
  const [resultMode, setResultMode] = useState<Record<string, InputMode>>({})
  const [sectionMemo, setSectionMemo] = useState<Record<string, string>>({})
  // Per-exercise weight
  const [weightOpen, setWeightOpen] = useState<Record<string, boolean>>({})
  const [units, setUnits] = useState<Record<string, 'lb' | 'kg'>>({})
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const pendingSavesRef = useRef<Record<string, () => void>>({})
  const localLogsRef = useRef<Record<string, WorkoutLog>>({})

  // Memoize expensive parsing — only recompute when templates change
  const parsedDescriptions = useMemo(() => {
    const map = new Map<string, ReturnType<typeof parseDescription>>()
    for (const t of templates) {
      map.set(t.id, parseDescription(t.description))
    }
    return map
  }, [templates])

  const templateGroups = useMemo(() => computeGroups(templates), [templates])

  const initializedRef = useRef(false)

  useEffect(() => {
    const map: Record<string, WorkoutLog> = {}
    const unitMap: Record<string, 'lb' | 'kg'> = {}
    const wOpen: Record<string, boolean> = {}
    const rOpen: Record<string, boolean> = {}
    const mOpen: Record<string, boolean> = {}
    const rMode: Record<string, InputMode> = {}
    const memos: Record<string, string> = {}

    for (const log of logs) {
      if (log.template_id) {
        map[log.template_id] = log
        const detail = parseDetail(log.sets_detail)
        if (detail.weight_unit) unitMap[log.template_id] = detail.weight_unit as 'lb' | 'kg'
        if (detail.weight != null) wOpen[log.template_id] = true

        // Restore exercise-level weight buttons and units (for section-title templates)
        if (detail.exercise_weights && typeof detail.exercise_weights === 'object') {
          const ew = detail.exercise_weights as Record<string, { weight?: number | null; unit?: 'lb' | 'kg' }>
          for (const [idx, v] of Object.entries(ew)) {
            const exKey = `${log.template_id}_${idx}`
            if (v.weight != null) wOpen[exKey] = true
            if (v.unit) unitMap[exKey] = v.unit
          }
        }

        // Restore result mode (but not open state — that's explicit)
        if (detail.result_type) {
          rMode[log.template_id] = detail.result_type as InputMode
        } else if (detail.sets) {
          rMode[log.template_id] = 'weight'
        }
        // Restore open/closed state from persisted flags
        if (detail._result_open === true) rOpen[log.template_id] = true
        if (detail._memo_open === true) {
          mOpen[log.template_id] = true
        }
        if (log.memo) {
          memos[log.template_id] = log.memo
        }
      }
    }

    if (!initializedRef.current) {
      // First load: set all states from persisted data
      setLocalLogs(map)
      setWeightOpen(wOpen)
      setUnits(unitMap)
      setResultOpen(rOpen)
      setMemoOpen(mOpen)
      setResultMode(rMode)
      setSectionMemo(memos)
      initializedRef.current = true
    } else {
      // Subsequent updates: merge without overwriting in-flight local changes
      setLocalLogs(prev => {
        const next = { ...prev }
        for (const [tid, log] of Object.entries(map)) {
          // Only update from server if no pending save for this template
          if (!pendingSavesRef.current[tid]) {
            next[tid] = log
          }
        }
        return next
      })
      setWeightOpen(prev => ({ ...prev, ...wOpen }))
      setUnits(prev => ({ ...prev, ...unitMap }))
      setResultOpen(prev => ({ ...prev, ...rOpen }))
      setMemoOpen(prev => ({ ...prev, ...mOpen }))
      setResultMode(prev => ({ ...prev, ...rMode }))
      setSectionMemo(prev => ({ ...prev, ...memos }))
    }
  }, [logs])

  // Keep ref in sync for use in saveLog (avoids stale closure)
  localLogsRef.current = localLogs

  function getLog(templateId: string): WorkoutLog | null {
    return localLogs[templateId] || logs.find(l => l.template_id === templateId) || null
  }

  const saveLog = useCallback(async (templateId: string, sec: string, updates: Partial<WorkoutLog>) => {
    const existing = localLogsRef.current[templateId] || logs.find(l => l.template_id === templateId)
    try {
      const saved = await upsertLog(userId, {
        ...(existing?.id ? { id: existing.id } : {}),
        date,
        template_id: templateId,
        section: sec,
        is_custom: false,
        completed: updates.completed ?? existing?.completed ?? false,
        sets_detail: updates.sets_detail ?? existing?.sets_detail ?? null,
        memo: updates.memo ?? existing?.memo ?? null,
      })
      setLocalLogs(prev => ({ ...prev, [templateId]: saved }))
      onLogUpdate(saved)
    } catch (err) {
      console.error('Failed to save log:', err)
    }
  }, [logs, date, onLogUpdate])

  function debouncedSave(templateId: string, sec: string, updates: Partial<WorkoutLog>) {
    if (debounceRef.current[templateId]) clearTimeout(debounceRef.current[templateId])
    const doSave = () => {
      delete pendingSavesRef.current[templateId]
      saveLog(templateId, sec, updates)
    }
    pendingSavesRef.current[templateId] = doSave
    debounceRef.current[templateId] = setTimeout(doSave, 800)
  }

  // Flush all pending debounced saves on unmount
  useEffect(() => {
    return () => {
      for (const timer of Object.values(debounceRef.current)) clearTimeout(timer)
      for (const flush of Object.values(pendingSavesRef.current)) flush()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // === Per-exercise: completion toggle ===
  function handleToggle(templateId: string, sec: string) {
    const log = getLog(templateId)
    const next = !(log?.completed ?? false)
    setLocalLogs(prev => ({
      ...prev,
      [templateId]: { ...(prev[templateId] || log || {} as WorkoutLog), completed: next }
    }))
    saveLog(templateId, sec, { completed: next })
  }

  function handleGroupToggle() {
    const allCompleted = templates.every(t => getLog(t.id)?.completed)
    const next = !allCompleted
    for (const t of templates) {
      setLocalLogs(prev => ({
        ...prev,
        [t.id]: { ...(prev[t.id] || getLog(t.id) || {} as WorkoutLog), completed: next }
      }))
      saveLog(t.id, t.section, { completed: next })
    }
  }

  // === Per-exercise: inline weight ===
  function getWeight(templateId: string): number | null {
    const detail = parseDetail(getLog(templateId)?.sets_detail)
    return (detail.weight as number) ?? null
  }

  function getUnit(key: string): 'lb' | 'kg' {
    return units[key] || 'lb'
  }

  function setWeight(templateId: string, sec: string, weight: number | null) {
    const unit = getUnit(templateId)
    const existing = getLog(templateId)
    const detail = { ...parseDetail(existing?.sets_detail), weight, weight_unit: unit }
    setLocalLogs(prev => ({
      ...prev,
      [templateId]: { ...(prev[templateId] || {} as WorkoutLog), sets_detail: detail }
    }))
    debouncedSave(templateId, sec, { sets_detail: detail as unknown })
  }

  function adjustWeight(templateId: string, sec: string, delta: number) {
    const current = getWeight(templateId) ?? 0
    const next = Math.max(0, current + delta)
    setWeight(templateId, sec, next === 0 ? null : next)
  }

  // === Per-exercise weight (for section-title templates, indexed by exIdx) ===
  function getExWeight(templateId: string, exIdx: number): number | null {
    const detail = parseDetail(getLog(templateId)?.sets_detail)
    const ew = detail.exercise_weights as Record<string, { weight: number | null }> | undefined
    return ew?.[String(exIdx)]?.weight ?? null
  }

  function setExWeight(templateId: string, sec: string, exIdx: number, weight: number | null) {
    const exKey = `${templateId}_${exIdx}`
    const existing = getLog(templateId)
    const detail = parseDetail(existing?.sets_detail)
    const ew = (detail.exercise_weights as Record<string, unknown>) || {}
    ew[String(exIdx)] = { weight, unit: getUnit(exKey) }
    const next = { ...detail, exercise_weights: ew }
    setLocalLogs(prev => ({
      ...prev,
      [templateId]: { ...(prev[templateId] || {} as WorkoutLog), sets_detail: next }
    }))
    debouncedSave(templateId, sec, { sets_detail: next as unknown })
  }

  function adjustExWeight(templateId: string, sec: string, exIdx: number, delta: number) {
    const current = getExWeight(templateId, exIdx) ?? 0
    const next = Math.max(0, current + delta)
    setExWeight(templateId, sec, exIdx, next === 0 ? null : next)
  }

  function toggleUnit(templateId: string, sec: string, exIdx?: number) {
    const key = exIdx != null ? `${templateId}_${exIdx}` : templateId
    const next = getUnit(key) === 'lb' ? 'kg' : 'lb'
    setUnits(prev => ({ ...prev, [key]: next }))
    const existing = getLog(templateId)
    if (exIdx != null) {
      // Per-exercise unit: update inside exercise_weights
      const detail = parseDetail(existing?.sets_detail)
      const ew = (detail.exercise_weights as Record<string, Record<string, unknown>>) || {}
      const prev = ew[String(exIdx)] || {}
      ew[String(exIdx)] = { ...prev, unit: next }
      const nextDetail = { ...detail, exercise_weights: ew }
      debouncedSave(templateId, sec, { sets_detail: nextDetail as unknown })
    } else {
      const detail = { ...parseDetail(existing?.sets_detail), weight_unit: next }
      debouncedSave(templateId, sec, { sets_detail: detail as unknown })
    }
  }

  // === Per-group: weight sets (climbing) ===
  function getWeightSetsDataFor(anchorId: string): WeightSetsData {
    const detail = parseDetail(getLog(anchorId)?.sets_detail)
    return {
      weight_unit: (detail.weight_unit as 'lb' | 'kg') || 'lb',
      sets: Array.isArray(detail.sets) ? detail.sets : [{ weight: null }],
    }
  }

  function handleWeightSetsChangeFor(anchorId: string, data: WeightSetsData) {
    const existing = getLog(anchorId)
    const detail = { ...parseDetail(existing?.sets_detail), weight_unit: data.weight_unit, sets: data.sets, result_type: 'weight' }
    setLocalLogs(prev => ({
      ...prev,
      [anchorId]: { ...(prev[anchorId] || {} as WorkoutLog), sets_detail: detail }
    }))
    debouncedSave(anchorId, section, { sets_detail: detail as unknown })
  }

  // === Per-group: result ===
  function getResultDataFor(anchorId: string): ResultData {
    const detail = parseDetail(getLog(anchorId)?.sets_detail)
    const mode = resultMode[anchorId] || 'weight'
    const rt = mode === 'weight' ? 'rounds' : mode as ResultType
    return {
      result_type: rt,
      rounds: detail.rounds as number | null ?? null,
      extra_reps: detail.extra_reps as number | null ?? null,
      reps: detail.reps as number | null ?? null,
      cal: detail.cal as number | null ?? null,
      minutes: detail.minutes as number | null ?? null,
      seconds: detail.seconds as number | null ?? null,
      result_sets: Array.isArray(detail.result_sets) ? detail.result_sets : undefined,
    }
  }

  function handleResultChangeFor(anchorId: string, data: ResultData) {
    setResultMode(prev => ({ ...prev, [anchorId]: data.result_type }))
    const existing = getLog(anchorId)
    const detail = { ...parseDetail(existing?.sets_detail), ...data }
    setLocalLogs(prev => ({
      ...prev,
      [anchorId]: { ...(prev[anchorId] || {} as WorkoutLog), sets_detail: detail }
    }))
    debouncedSave(anchorId, section, { sets_detail: detail as unknown })
  }

  // === Per-group: EMOM ===
  function getEmomDataFor(anchorId: string): EmomData {
    const detail = parseDetail(getLog(anchorId)?.sets_detail)
    return {
      entries: Array.isArray(detail.emom) ? detail.emom : [{ name: '', value: null, measure: 'reps', weight: null, weight_unit: 'lb' }],
    }
  }

  function handleEmomChangeFor(anchorId: string, data: EmomData) {
    const existing = getLog(anchorId)
    const detail = { ...parseDetail(existing?.sets_detail), emom: data.entries }
    setLocalLogs(prev => ({
      ...prev,
      [anchorId]: { ...(prev[anchorId] || {} as WorkoutLog), sets_detail: detail }
    }))
    debouncedSave(anchorId, section, { sets_detail: detail as unknown })
  }

  // === Per-group: memo ===
  function handleMemoChangeFor(anchorId: string, value: string) {
    setSectionMemo(prev => ({ ...prev, [anchorId]: value }))
    setLocalLogs(prev => ({
      ...prev,
      [anchorId]: { ...(prev[anchorId] || {} as WorkoutLog), memo: value || null }
    }))
    debouncedSave(anchorId, section, { memo: value || null })
  }

  // === Toggle result/memo panels with persistence ===
  function toggleResultPanel(anchorId: string) {
    setResultOpen(prev => {
      const next = !prev[anchorId]
      // Persist open/closed flag
      const existing = getLog(anchorId)
      const detail = { ...parseDetail(existing?.sets_detail), _result_open: next }
      setLocalLogs(p => ({
        ...p,
        [anchorId]: { ...(p[anchorId] || {} as WorkoutLog), sets_detail: detail }
      }))
      debouncedSave(anchorId, section, { sets_detail: detail as unknown })
      return { ...prev, [anchorId]: next }
    })
  }

  function toggleMemoPanel(anchorId: string) {
    setMemoOpen(prev => {
      const next = !prev[anchorId]
      const existing = getLog(anchorId)
      const detail = { ...parseDetail(existing?.sets_detail), _memo_open: next }
      setLocalLogs(p => ({
        ...p,
        [anchorId]: { ...(p[anchorId] || {} as WorkoutLog), sets_detail: detail }
      }))
      debouncedSave(anchorId, section, { sets_detail: detail as unknown })
      return { ...prev, [anchorId]: next }
    })
  }

  const [copyToast, setCopyToast] = useState(false)

  const allCompleted = templates.length > 0 && templates.every(t => getLog(t.id)?.completed)
  const someCompleted = templates.some(t => getLog(t.id)?.completed)
  const sectionLabel = extractSectionLabel(templates)

  const firstGroupAnchor = templateGroups[0]?.anchorId
  const firstGResultOpen = !!resultOpen[firstGroupAnchor]
  const firstGMemoOpen = !!memoOpen[firstGroupAnchor]

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden relative">
      {/* Section header — includes first group's result/memo buttons */}
      <div className="px-4 py-2 bg-background border-b border-border flex items-center gap-2">
        <button
          onClick={handleGroupToggle}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            allCompleted ? 'bg-success border-success text-white'
              : someCompleted ? 'border-success/50 bg-success/10'
              : 'border-border'
          }`}
        >
          {allCompleted && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {someCompleted && !allCompleted && (
            <div className="w-2 h-0.5 bg-success rounded" />
          )}
        </button>
        <span className="text-xs font-bold text-accent">{section}</span>
        {sectionLabel && (
          <span className="text-xs font-medium text-text-secondary">{sectionLabel}</span>
        )}

        {/* Copy raw text + First group's result/memo buttons */}
        {firstGroupAnchor && (
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => {
                const text = templates.map(t => {
                  const parts: string[] = []
                  if (t.title) parts.push(t.title)
                  // If EMOM template with logged entries, format as MIN lines
                  if (isEmomType(t)) {
                    const log = getLog(t.id)
                    const detail = parseDetail(log?.sets_detail)
                    if (Array.isArray(detail.emom) && detail.emom.length > 0) {
                      detail.emom.forEach((e: { name?: string; value?: number | null; measure?: string; weight?: number | null; weight_unit?: string }, i: number) => {
                        const minNum = i + 1
                        let line = `${minNum}MIN: `
                        if (e.value != null) line += e.measure === 'cal' ? `${e.value}cal ` : `${e.value} `
                        line += e.name || ''
                        if (e.weight != null) line += ` @${e.weight}${e.weight_unit || 'lb'}`
                        parts.push(line.trimEnd())
                      })
                    }
                  } else {
                    if (t.description) parts.push(t.description)
                  }
                  return parts.join('\n')
                }).join('\n\n')
                navigator.clipboard.writeText(text)
                setCopyToast(true)
                setTimeout(() => setCopyToast(false), 1000)
              }}
              className="w-6 h-6 rounded flex items-center justify-center text-text-secondary/50 active:text-accent"
              title="원본 텍스트 복사"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
            <button
              onClick={() => toggleResultPanel(firstGroupAnchor)}
              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                firstGResultOpen ? 'bg-accent border-accent text-white' : 'border-text-secondary/30 bg-surface'
              }`}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button
              onClick={() => toggleMemoPanel(firstGroupAnchor)}
              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                firstGMemoOpen ? 'bg-accent border-accent text-white' : 'border-text-secondary/30 bg-surface'
              }`}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="14" y2="17" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Render by groups */}
      {templateGroups.map((group, groupIdx) => {
        const gAnchor = group.anchorId
        const gResultOpen = !!resultOpen[gAnchor]
        const gMemoOpen = !!memoOpen[gAnchor]
        const gHasEmom = group.hasEmom
        const gMode = resultMode[gAnchor] || 'weight'
        const gMemo = sectionMemo[gAnchor] || ''

        return (
          <div key={gAnchor}>
            {/* Separator between groups — with result/memo buttons on the right */}
            {groupIdx > 0 && group.separatorData && (
              <>
                {(group.separatorData.restNote || group.separatorData.leadingRest) ? (
                  <div className="px-4 py-1.5 bg-background border-t border-border">
                    <p className="text-[10px] text-text-secondary italic text-center">
                      {(group.separatorData.restNote || group.separatorData.leadingRest)!.replace(/^\*\s*/, '')}
                    </p>
                  </div>
                ) : (
                  <div className="h-2 bg-background border-t border-border" />
                )}
                {group.separatorData.setInfo && (
                  <div className="pl-6 pr-4 py-2 bg-background border-t border-border flex items-center gap-2">
                    <p className="text-xs font-medium text-text-secondary">{group.separatorData.setInfo}</p>
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        onClick={() => toggleResultPanel(gAnchor)}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                          gResultOpen ? 'bg-accent border-accent text-white' : 'border-text-secondary/30 bg-surface'
                        }`}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                      <button
                        onClick={() => toggleMemoPanel(gAnchor)}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                          gMemoOpen ? 'bg-accent border-accent text-white' : 'border-text-secondary/30 bg-surface'
                        }`}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="4" y1="7" x2="20" y2="7" />
                          <line x1="4" y1="12" x2="20" y2="12" />
                          <line x1="4" y1="17" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                {!group.separatorData.setInfo && (
                  <div className="px-4 py-1.5 bg-background border-t border-border flex items-center justify-end gap-1">
                    <button
                      onClick={() => toggleResultPanel(gAnchor)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        gResultOpen ? 'bg-accent border-accent text-white' : 'border-text-secondary/30 bg-surface'
                      }`}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                    <button
                      onClick={() => toggleMemoPanel(gAnchor)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        gMemoOpen ? 'bg-accent border-accent text-white' : 'border-text-secondary/30 bg-surface'
                      }`}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="4" y1="7" x2="20" y2="7" />
                        <line x1="4" y1="12" x2="20" y2="12" />
                        <line x1="4" y1="17" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
            {groupIdx > 0 && !group.separatorData && (
              <div className="px-4 py-1.5 bg-background border-t border-border flex items-center justify-end gap-1">
                <button
                  onClick={() => toggleResultPanel(gAnchor)}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                    gResultOpen ? 'bg-accent border-accent text-white' : 'border-text-secondary/30 bg-surface'
                  }`}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <button
                  onClick={() => toggleMemoPanel(gAnchor)}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                    gMemoOpen ? 'bg-accent border-accent text-white' : 'border-text-secondary/30 bg-surface'
                  }`}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="17" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            )}

            {/* Templates in this group */}
            {group.templates.map((template, idx) => {
              const log = getLog(template.id)
              const completed = log?.completed ?? false
              const parsed = parsedDescriptions.get(template.id)!
              const weight = getWeight(template.id)
              const unit = getUnit(template.id)

              const titleIsSection = isSectionTitle(template.title)
              const leadingRest = parsed.orderedLines.length > 0 && parsed.orderedLines[0].type === 'note' && /^Rest\s+/i.test(parsed.orderedLines[0].text)
                ? parsed.orderedLines[0].text : null

              return (
                <div key={template.id}>
                  {idx > 0 && <div className="border-t border-border" />}

                  {titleIsSection ? (
                    /* Section-level title (AMRAP, For Time, etc.) — render lines in order */
                    <div>
                      {(() => {
                        let lines = [...parsed.orderedLines]
                        if (leadingRest) lines = lines.filter(l => l.text !== leadingRest)
                        // Group: each exercise + following notes together
                        const groups: { exercise?: { text: string; idx: number }; notes: string[]; subheader?: string }[] = []
                        let exIdx = 0
                        for (const line of lines) {
                          if (line.type === 'exercise') {
                            groups.push({ exercise: { text: line.text, idx: exIdx++ }, notes: [] })
                          } else if (line.type === 'subheader') {
                            groups.push({ notes: [], subheader: line.text })
                          } else {
                            // Attach note to previous exercise group if exists
                            const last = groups[groups.length - 1]
                            if (last && last.exercise) {
                              last.notes.push(line.text)
                            } else {
                              groups.push({ notes: [line.text] })
                            }
                          }
                        }
                        return groups.map((g, i) => {
                          if (g.subheader) {
                            return (
                              <div key={i} className="pl-6 pr-4 py-2 bg-background border-t border-border">
                                <p className="text-xs font-medium text-text-secondary">{g.subheader}</p>
                              </div>
                            )
                          }
                          if (g.exercise) {
                            const curIdx = g.exercise.idx
                            const exKey = `${template.id}_${curIdx}`
                            const exWeight = getExWeight(template.id, curIdx)
                            const exUnit = getUnit(exKey)
                            const exOpen = !!weightOpen[exKey]
                            return (
                              <div key={i} className={`pl-6 pr-4 py-2 ${curIdx > 0 ? 'border-t border-border' : ''}`}>
                                <div className="flex items-center gap-2">
                                  <p className={`flex-1 min-w-0 text-sm ${completed ? 'line-through opacity-50' : ''}`}>{g.exercise.text}</p>
                                  <WeightButton
                                    weightKey={exKey}
                                    isOpen={exOpen}
                                    onOpen={() => setWeightOpen(prev => ({ ...prev, [exKey]: true }))}
                                    onClose={() => {
                                      setWeightOpen(prev => ({ ...prev, [exKey]: false }))
                                      setExWeight(template.id, template.section, curIdx, null)
                                    }}
                                    weight={exWeight}
                                    unit={exUnit}
                                    onAdjust={(delta) => adjustExWeight(template.id, template.section, curIdx, delta)}
                                    onSet={(v) => setExWeight(template.id, template.section, curIdx, v)}
                                    onToggleUnit={() => toggleUnit(template.id, template.section, curIdx)}
                                  />
                                </div>
                                {g.notes.length > 0 && (
                                  <div className={`mt-0.5 ${completed ? 'opacity-50' : ''}`}>
                                    {g.notes.map((n, ni) => (
                                      <p key={ni} className="text-[10px] text-text-secondary italic leading-tight">{n}</p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          }
                          // Orphan notes (no preceding exercise)
                          return (
                            <div key={i} className={`pl-6 pr-4 pb-1 ${completed ? 'opacity-50' : ''}`}>
                              {g.notes.map((n, ni) => (
                                <p key={ni} className="text-[10px] text-text-secondary italic leading-tight">{n}</p>
                              ))}
                            </div>
                          )
                        })
                      })()}
                    </div>
                  ) : template.title ? (
                    /* Template with title — title is exercise, description is detail text */
                    <div>
                      <div className="pl-6 pr-4 py-2 flex items-center gap-2">
                        <p className={`flex-1 min-w-0 text-sm ${completed ? 'line-through opacity-50' : ''}`}>{template.title}</p>
                        <WeightButton
                          weightKey={template.id}
                          isOpen={!!weightOpen[template.id]}
                          onOpen={() => setWeightOpen(prev => ({ ...prev, [template.id]: true }))}
                          onClose={() => {
                            setWeightOpen(prev => ({ ...prev, [template.id]: false }))
                            setWeight(template.id, template.section, null)
                          }}
                          weight={weight}
                          unit={unit}
                          onAdjust={(delta) => adjustWeight(template.id, template.section, delta)}
                          onSet={(v) => setWeight(template.id, template.section, v)}
                          onToggleUnit={() => toggleUnit(template.id, template.section)}
                        />
                      </div>
                      {(() => {
                        const lines = [...parsed.orderedLines]
                        if (lines.length === 0) return null
                        return (
                          <div className={`pl-6 pr-4 pb-2 space-y-0.5 ${completed ? 'opacity-50' : ''}`}>
                            {lines.map((line, i) => (
                              line.type === 'exercise'
                                ? <p key={i} className="text-xs text-foreground/60">{line.text}</p>
                                : <p key={i} className="text-[10px] text-text-secondary italic">{line.text}</p>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  ) : (
                    /* No title — render lines in order, exercises get weight buttons, notes stay inline */
                    <div>
                      {(() => {
                        let lines = [...parsed.orderedLines]
                        if (leadingRest) lines = lines.filter(l => l.text !== leadingRest)
                        if (lines.length === 0 && parsed.setInfo) {
                          return (
                            <div className="pl-6 pr-4 py-2">
                              <p className={`text-sm ${completed ? 'line-through opacity-50' : ''}`}>{parsed.setInfo}</p>
                            </div>
                          )
                        }
                        // Group: each exercise + following notes together
                        const groups: { exercise?: { text: string; idx: number }; notes: string[]; subheader?: string }[] = []
                        let exIdx = 0
                        for (const line of lines) {
                          if (line.type === 'exercise') {
                            groups.push({ exercise: { text: line.text, idx: exIdx++ }, notes: [] })
                          } else if (line.type === 'subheader') {
                            groups.push({ notes: [], subheader: line.text })
                          } else {
                            const last = groups[groups.length - 1]
                            if (last && last.exercise) {
                              last.notes.push(line.text)
                            } else {
                              groups.push({ notes: [line.text] })
                            }
                          }
                        }
                        return groups.map((g, i) => {
                          if (g.subheader) {
                            return (
                              <div key={i} className="pl-6 pr-4 py-2 bg-background border-t border-border">
                                <p className="text-xs font-medium text-text-secondary">{g.subheader}</p>
                              </div>
                            )
                          }
                          if (g.exercise) {
                            const curIdx = g.exercise.idx
                            const exKey = `${template.id}_${curIdx}`
                            const exWeight = getExWeight(template.id, curIdx)
                            const exUnit = getUnit(exKey)
                            const exOpen = !!weightOpen[exKey]
                            return (
                              <div key={i} className={`pl-6 pr-4 py-2 ${curIdx > 0 ? 'border-t border-border' : ''}`}>
                                <div className="flex items-center gap-2">
                                  <p className={`flex-1 min-w-0 text-sm ${completed ? 'line-through opacity-50' : ''}`}>{g.exercise.text}</p>
                                  <WeightButton
                                    weightKey={exKey}
                                    isOpen={exOpen}
                                    onOpen={() => setWeightOpen(prev => ({ ...prev, [exKey]: true }))}
                                    onClose={() => {
                                      setWeightOpen(prev => ({ ...prev, [exKey]: false }))
                                      setExWeight(template.id, template.section, curIdx, null)
                                    }}
                                    weight={exWeight}
                                    unit={exUnit}
                                    onAdjust={(delta) => adjustExWeight(template.id, template.section, curIdx, delta)}
                                    onSet={(v) => setExWeight(template.id, template.section, curIdx, v)}
                                    onToggleUnit={() => toggleUnit(template.id, template.section, curIdx)}
                                  />
                                </div>
                                {g.notes.length > 0 && (
                                  <div className={`mt-0.5 ${completed ? 'opacity-50' : ''}`}>
                                    {g.notes.map((n, ni) => (
                                      <p key={ni} className="text-[10px] text-text-secondary italic leading-tight">{n}</p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          }
                          return (
                            <div key={i} className={`pl-6 pr-4 pb-1 ${completed ? 'opacity-50' : ''}`}>
                              {g.notes.map((n, ni) => (
                                <p key={ni} className="text-[10px] text-text-secondary italic leading-tight">{n}</p>
                              ))}
                            </div>
                          )
                        })
                      })()}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Per-group result panel */}
            {gResultOpen && (
              <div className="px-4 py-2 border-t border-border">
                {gHasEmom ? (
                  <EmomBuilder
                    data={getEmomDataFor(gAnchor)}
                    onChange={(data) => handleEmomChangeFor(gAnchor, data)}
                  />
                ) : (
                  <div className="space-y-2">
                      <div className="flex items-center gap-3 justify-end">
                        {([['weight', 'WT'], ['rounds', 'Rounds'], ['reps', 'Reps'], ['cal', 'Cal'], ['time', 'Time']] as const).map(([val, label]) => (
                          <button
                            key={val}
                            onClick={() => {
                              setResultMode(prev => ({ ...prev, [gAnchor]: val as InputMode }))
                              // Persist mode switch so it restores correctly
                              const existing = getLog(gAnchor)
                              const detail = { ...parseDetail(existing?.sets_detail), result_type: val }
                              setLocalLogs(prev => ({
                                ...prev,
                                [gAnchor]: { ...(prev[gAnchor] || {} as WorkoutLog), sets_detail: detail }
                              }))
                              debouncedSave(gAnchor, section, { sets_detail: detail as unknown })
                            }}
                            className={`text-[11px] font-semibold transition-colors ${
                              gMode === val ? 'text-accent' : 'text-text-secondary/30'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {gMode === 'weight' ? (
                        <WeightSetsInput
                          data={getWeightSetsDataFor(gAnchor)}
                          onChange={(data) => handleWeightSetsChangeFor(gAnchor, data)}
                        />
                      ) : (
                        <ResultInput
                          data={getResultDataFor(gAnchor)}
                          onChange={(data) => handleResultChangeFor(gAnchor, data)}
                        />
                      )}
                  </div>
                )}
              </div>
            )}

            {/* Per-group memo panel */}
            {gMemoOpen && (
              <div className="px-4 py-2 border-t border-border">
                <input
                  type="text"
                  value={gMemo}
                  onChange={e => handleMemoChangeFor(gAnchor, e.target.value)}
                  placeholder="메모"
                  className="w-full px-2 py-1 text-xs rounded border border-border bg-background text-foreground placeholder:text-text-secondary/40 focus:outline-none focus:border-accent"
                />
              </div>
            )}
          </div>
        )
      })}
      {/* Copy toast */}
      {copyToast && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="bg-foreground/80 text-white text-xs px-3 py-1.5 rounded-full">복사됨</span>
        </div>
      )}
    </div>
  )
}

function logsEqual(a: WorkoutLog[], b: WorkoutLog[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].completed !== b[i].completed) return false
  }
  return true
}

const WorkoutSection = memo(WorkoutSectionInner, (prev, next) => {
  return (
    prev.userId === next.userId &&
    prev.section === next.section &&
    prev.date === next.date &&
    prev.templates.length === next.templates.length &&
    prev.templates.every((t, i) => t.id === next.templates[i].id) &&
    logsEqual(prev.logs, next.logs)
  )
})

export default WorkoutSection
