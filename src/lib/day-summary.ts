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

/**
 * 그룹 키: 코치 섹션은 section("A"..), 추가운동은 extra_group_id로 구분
 * (모든 추가운동이 section='추가운동'이라 section으로 묶으면 하나로 합쳐져 헤더가 1개만 생김).
 */
const groupKeyOf = (t: WorkoutTemplate): string => t.extra_group_id ?? t.section
/** 정렬 키(ASCII로 충돌 없이): 코치 섹션 먼저('0'+section), 그 뒤 추가운동을 extra_order 순('1'+order)으로. */
const orderKeyOf = (t: WorkoutTemplate): string =>
  t.extra_group_id
    ? '1' + String(t.extra_order ?? 0).padStart(6, '0') + t.extra_group_id
    : '0' + t.section

/** stored를 base로, 현재 templates/logs를 반영한 새 문서를 반환(멱등). */
export function reconcileSummary(
  stored: DaySummary | null,
  templates: WorkoutTemplate[],
  logs: WorkoutLog[],
): DaySummary {
  const templateById = new Map(templates.map(t => [t.id, t] as const))
  const logByTemplate = new Map<string, WorkoutLog>()
  for (const l of logs) if (l.template_id) logByTemplate.set(l.template_id, l)
  // 한 템플릿에 로그 행이 둘 이상 있으면(동시 저장 경쟁으로 실제 발생) 같은 id 가 두 번
  // 들어와 요약 블록에 섹션이 중복 출력된다. 중복을 제거한다.
  const completedIds = [...new Set(
    logs
      .filter(l => l.template_id && l.completed && templateById.has(l.template_id))
      .map(l => l.template_id as string),
  )]

  // 문서 없음 → 완료된 것만으로 전체 생성 (리셋과 동일). 그룹 단위(코치 섹션/추가운동 그룹)로 분리.
  if (!stored) {
    const groups = new Map<string, string[]>()
    for (const id of completedIds) {
      const k = groupKeyOf(templateById.get(id)!)
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k)!.push(id)
    }
    const ordered = [...groups.entries()].sort((a, b) =>
      orderKeyOf(templateById.get(a[1][0])!).localeCompare(orderKeyOf(templateById.get(b[1][0])!)))
    const blocks: DaySummaryBlock[] = []
    const parts: string[] = []
    for (const [k, idsRaw] of ordered) {
      const ids = idsRaw.sort((x, y) => templateById.get(x)!.sort_order - templateById.get(y)!.sort_order)
      const t0 = templateById.get(ids[0])!
      const header = t0.section
      const order = orderKeyOf(t0)
      const snippet = genSectionBlock(header, ids, templateById, logByTemplate)
      parts.push(snippet)
      blocks.push({ key: k, header, order, template_ids: ids, sig: sigOf(ids, logByTemplate), auto_snippet: snippet })
    }
    return { text: parts.join('\n\n'), blocks }
  }

  let text = stored.text
  const blocks: DaySummaryBlock[] = stored.blocks.map(b => ({ ...b, template_ids: [...b.template_ids] }))
  let dirty = false
  // 구버전 블록(order 없음) 호환: 템플릿에서 정렬 키를 일관되게 유도
  const orderOf = (b: DaySummaryBlock): string => {
    if (b.order != null) return b.order
    const t = templateById.get(b.template_ids[0])
    return t ? orderKeyOf(t) : b.key
  }

  // 1) 신규 완료 흡수 (그룹 단위, 정렬 순서 삽입)
  const reflected = new Set(blocks.flatMap(b => b.template_ids))
  const newIds = completedIds.filter(id => !reflected.has(id))
  const byGroup = new Map<string, string[]>()
  for (const id of newIds) {
    const k = groupKeyOf(templateById.get(id)!)
    if (!byGroup.has(k)) byGroup.set(k, [])
    byGroup.get(k)!.push(id)
  }
  for (const [k, ids] of byGroup) {
    const existing = blocks.find(b => b.key === k)
    if (existing) {
      existing.template_ids.push(...ids) // 멤버십 증가 → 2단계에서 재생성
      continue
    }
    const t0 = templateById.get(ids[0])!
    const header = t0.section
    const order = orderKeyOf(t0)
    const snippet = genSectionBlock(header, ids, templateById, logByTemplate)
    const block: DaySummaryBlock = { key: k, header, order, template_ids: ids, sig: sigOf(ids, logByTemplate), auto_snippet: snippet }
    dirty = true
    const laterIdx = blocks.findIndex(b => orderOf(b).localeCompare(order) > 0)
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

  // 2) 데이터 변경/멤버십 증가 블록 재생성 (데이터가 이김)
  for (const b of blocks) {
    const newSig = sigOf(b.template_ids, logByTemplate)
    if (newSig === b.sig) continue
    const newSnippet = genSectionBlock(b.header ?? b.key, b.template_ids, templateById, logByTemplate)
    if (newSnippet !== b.auto_snippet) {
      const pos = text.indexOf(b.auto_snippet)
      if (pos !== -1) {
        text = text.slice(0, pos) + newSnippet + text.slice(pos + b.auto_snippet.length)
      } else {
        text = text ? text + '\n\n' + newSnippet : newSnippet
      }
      b.auto_snippet = newSnippet
      dirty = true
    }
    b.sig = newSig
  }

  // 3) 과도한 빈 줄 정리 (실제로 text를 바꿨을 때만 — 사용자 공백 편집 보존)
  if (dirty) text = text.replace(/\n{3,}/g, '\n\n').trim()

  return { text, blocks }
}
