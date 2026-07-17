import type { WorkoutTemplate } from '@/lib/api/workout-templates'
import type { WorkoutLog } from '@/lib/api/workout-logs'
import type { DaySummary, DaySummaryBlock } from '@/lib/api/day-summaries'

export function parseDetail(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return {} }
  }
  return {}
}

function getWeightText(detail: Record<string, unknown>): string {
  if (Array.isArray(detail.sets) && detail.sets.length > 0) {
    const unit = (detail.weight_unit as string) || 'lb'
    const weights = detail.sets
      .map((s: { weight?: number | null }) => s.weight != null ? `${s.weight}${unit}` : null)
      .filter(Boolean)
    if (weights.length > 0) return weights.join(' - ')
  }
  if (detail.weight != null) {
    const unit = (detail.weight_unit as string) || 'lb'
    return `${detail.weight}${unit}`
  }
  if (detail.exercise_weights && typeof detail.exercise_weights === 'object') {
    const ew = detail.exercise_weights as Record<string, { weight?: number | null; unit?: string }>
    const parts = Object.values(ew)
      .filter(v => v.weight != null)
      .map(v => `${v.weight}${v.unit || 'lb'}`)
    if (parts.length > 0) return parts.join(' / ')
  }
  return ''
}

function getResultText(detail: Record<string, unknown>): string {
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

function combineResult(weight: string, result: string): string {
  if (weight && result) {
    if (result.startsWith('\n')) return `${weight}${result}`
    return `${weight} / ${result}`
  }
  return weight || result
}

/** 한 섹션 블록 텍스트. logMap은 완료 여부와 무관하게 template_id→log. */
function buildSectionBlock(section: string, items: WorkoutTemplate[], logMap: Map<string, WorkoutLog>): string {
  const lines: string[] = [`${section}.`]
  const entries = items
    .filter(t => logMap.has(t.id))
    .map(t => {
      const log = logMap.get(t.id)!
      const detail = parseDetail(log.sets_detail)
      return { template: t, log, weight: getWeightText(detail), result: getResultText(detail) }
    })
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]
    if (e.result && !e.weight) {
      for (let j = i + 1; j < entries.length; j++) {
        if (entries[j].weight && !entries[j].result) { entries[j].result = e.result; e.result = ''; break }
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
      if (combined.startsWith('\n')) lines.push(combined.trimStart())
      else lines.push(`→ ${combined}`)
    }
    if (e.log.memo) lines.push(`📝 ${e.log.memo}`)
  })
  return lines.join('\n')
}

/** 기존 전체 요약 텍스트(완료된 것만). 동작 불변. */
export function generateSummaryText(templates: WorkoutTemplate[], logs: WorkoutLog[]): string {
  const logMap = new Map<string, WorkoutLog>()
  for (const l of logs) if (l.template_id && l.completed) logMap.set(l.template_id, l)
  const completed = templates
    .filter(t => logMap.has(t.id))
    .sort((a, b) => a.section.localeCompare(b.section) || a.sort_order - b.sort_order)
  if (completed.length === 0) return ''
  const sections: { section: string; items: WorkoutTemplate[] }[] = []
  for (const t of completed) {
    const last = sections[sections.length - 1]
    if (last && last.section === t.section) last.items.push(t)
    else sections.push({ section: t.section, items: [t] })
  }
  return sections.map(s => buildSectionBlock(s.section, s.items, logMap)).join('\n\n')
}

// ---- 증분 reconcile ----

function genSectionBlock(
  section: string, includedIds: string[],
  templateById: Map<string, WorkoutTemplate>, logByTemplate: Map<string, WorkoutLog>,
): string {
  const items = includedIds
    .map(id => templateById.get(id))
    .filter((t): t is WorkoutTemplate => !!t)
    .sort((a, b) => a.sort_order - b.sort_order)
  return buildSectionBlock(section, items, logByTemplate)
}

function sigOf(includedIds: string[], logByTemplate: Map<string, WorkoutLog>): string {
  const entries = [...includedIds].sort().map(id => {
    const log = logByTemplate.get(id)
    const detail = parseDetail(log?.sets_detail)
    return [id, getWeightText(detail), getResultText(detail), log?.memo || '']
  })
  return JSON.stringify(entries)
}

/** stored를 base로, 현재 templates/logs를 반영한 새 문서를 반환(멱등). */
export function reconcileSummary(
  stored: DaySummary | null,
  templates: WorkoutTemplate[],
  logs: WorkoutLog[],
): DaySummary {
  const templateById = new Map(templates.map(t => [t.id, t] as const))
  const logByTemplate = new Map<string, WorkoutLog>()
  for (const l of logs) if (l.template_id) logByTemplate.set(l.template_id, l)
  const completedIds = logs
    .filter(l => l.template_id && l.completed && templateById.has(l.template_id))
    .map(l => l.template_id as string)
  const cmp = (a: string, b: string) => a.localeCompare(b)

  // 문서 없음 → 완료된 것만으로 전체 생성 (리셋과 동일)
  if (!stored) {
    const sections = [...new Set(completedIds.map(id => templateById.get(id)!.section))].sort(cmp)
    const blocks: DaySummaryBlock[] = []
    const parts: string[] = []
    for (const s of sections) {
      const ids = completedIds
        .filter(id => templateById.get(id)!.section === s)
        .sort((a, b) => templateById.get(a)!.sort_order - templateById.get(b)!.sort_order)
      const snippet = genSectionBlock(s, ids, templateById, logByTemplate)
      parts.push(snippet)
      blocks.push({ key: s, template_ids: ids, sig: sigOf(ids, logByTemplate), auto_snippet: snippet })
    }
    return { text: parts.join('\n\n'), blocks }
  }

  let text = stored.text
  const blocks: DaySummaryBlock[] = stored.blocks.map(b => ({ ...b, template_ids: [...b.template_ids] }))

  // 1) 신규 완료 흡수 (섹션 순서 삽입)
  const reflected = new Set(blocks.flatMap(b => b.template_ids))
  const newIds = completedIds.filter(id => !reflected.has(id))
  const bySection = new Map<string, string[]>()
  for (const id of newIds) {
    const s = templateById.get(id)!.section
    if (!bySection.has(s)) bySection.set(s, [])
    bySection.get(s)!.push(id)
  }
  for (const [s, ids] of bySection) {
    const existing = blocks.find(b => b.key === s)
    if (existing) {
      existing.template_ids.push(...ids) // 멤버십 증가 → 2단계에서 재생성
      continue
    }
    const snippet = genSectionBlock(s, ids, templateById, logByTemplate)
    const block: DaySummaryBlock = { key: s, template_ids: ids, sig: sigOf(ids, logByTemplate), auto_snippet: snippet }
    const laterIdx = blocks.findIndex(b => cmp(b.key, s) > 0)
    if (laterIdx === -1) {
      text = text ? text + '\n\n' + snippet : snippet
      blocks.push(block)
    } else {
      const later = blocks[laterIdx]
      const pos = text.indexOf(later.auto_snippet)
      if (pos !== -1) {
        text = text.slice(0, pos) + snippet + '\n\n' + text.slice(pos)
      } else {
        text = text ? text + '\n\n' + snippet : snippet
      }
      blocks.splice(laterIdx, 0, block)
    }
  }

  // 2) 데이터 변경/멤버십 증가 섹션 재생성 (데이터가 이김)
  for (const b of blocks) {
    const newSig = sigOf(b.template_ids, logByTemplate)
    if (newSig === b.sig) continue
    const newSnippet = genSectionBlock(b.key, b.template_ids, templateById, logByTemplate)
    if (newSnippet !== b.auto_snippet) {
      const pos = text.indexOf(b.auto_snippet)
      if (pos !== -1) {
        text = text.slice(0, pos) + newSnippet + text.slice(pos + b.auto_snippet.length)
      } else {
        text = text ? text + '\n\n' + newSnippet : newSnippet
      }
      b.auto_snippet = newSnippet
    }
    b.sig = newSig
  }

  // 3) 과도한 빈 줄 정리
  text = text.replace(/\n{3,}/g, '\n\n').trim()

  return { text, blocks }
}
