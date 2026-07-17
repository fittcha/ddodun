# 편집 가능·증분 누적 "오늘 운동 요약" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈 "오늘 운동 요약"을 사용자 소유 문서로 전환 — 편집 유지, 신규 완료는 섹션 순서에 맞게 삽입, 무게/메모 변경 시 해당 섹션만 재생성(데이터가 이김), Supabase 저장으로 새로고침·기기 간 유지.

**Architecture:** 순수 로직(요약 텍스트 생성 + reconcile)을 신규 모듈 `src/lib/day-summary.ts`로 분리한다. Supabase 신규 테이블 `workout_day_summaries`에 `{text, blocks}`를 저장하고(API는 `src/lib/api/day-summaries.ts`), 홈 페이지가 로드해 `TodaySummary`에 전달한다. `TodaySummary`는 reconcile 결과 표시 + 디바운스 저장 + 재생성 버튼만 담당한다.

**Tech Stack:** Next.js 16 (App Router, `'use client'`), React 19, TypeScript, Supabase (schema `ddodun`), Tailwind v4.

## Global Constraints

- 이 프로젝트에는 **테스트 프레임워크가 없다.** 자동 검증 = `npx tsc --noEmit`(exit 0) + `npm run build`(성공; 기존 lockfile-root 경고는 무해). 새 테스트 프레임워크 도입 금지.
- Supabase 클라이언트는 `src/lib/supabase.ts`에서 `{ db: { schema: 'ddodun' } }`로 스코프됨. `.from()`에 스키마 프리픽스 없음.
- 단일 사용자 앱. `user_id`는 로그인 사용자(`getLoggedInUser()?.id`).
- **데이터가 이김**: 무게/메모/결과 변경된 섹션은 재생성해 교체. 미변경 섹션 편집·자유 메모는 유지.
- **완료 해제는 요약에서 제거하지 않음.**
- **신규 완료는 섹션 순서(`localeCompare`, A→F→"추가운동")에 맞는 위치에 삽입.**
- **폴백**: `getDaySummary`/`upsertDaySummary` 실패(테이블 부재 등) 시 홈은 안 깨지고 자동생성 요약을 보여준다(저장만 조용히 실패).
- ⚠️ 마이그레이션(`docs/sql/migration-day-summaries.sql`)은 코드 배포 전 Supabase에서 직접 실행. (단 폴백이 있어 미실행 시에도 홈은 정상, 저장/증분만 동작 안 함.)
- 스펙: `docs/superpowers/specs/2026-07-17-editable-incremental-day-summary-design.md`.

---

## File Structure

- `docs/sql/migration-day-summaries.sql` (신규) — 테이블 생성 SQL.
- `src/lib/api/day-summaries.ts` (신규) — 타입 `DaySummaryBlock`/`DaySummary`, `getDaySummary`, `upsertDaySummary`.
- `src/lib/day-summary.ts` (신규) — 순수 로직: `parseDetail`/`getWeightText`/`getResultText`/`combineResult`/`buildSectionBlock`/`genSectionBlock`/`sigOf`/`reconcileSummary` (+ 기존 `TodaySummary`에서 이관).
- `src/components/home/TodaySummary.tsx` (수정) — 이관 후 helper 제거, reconcile+저장+재생성 배선.
- `src/app/page.tsx` (수정) — day summary 로드, `TodaySummary`에 `stored`/`onSave` 전달.

---

## Task 1: 마이그레이션 SQL + day-summaries API

**Files:**
- Create: `docs/sql/migration-day-summaries.sql`
- Create: `src/lib/api/day-summaries.ts`

**Interfaces:**
- Produces: `DaySummaryBlock`, `DaySummary` 타입; `getDaySummary(userId,date): Promise<DaySummary|null>`; `upsertDaySummary(userId,date,text,blocks): Promise<void>`.

- [ ] **Step 1: 마이그레이션 SQL 생성**

Create `docs/sql/migration-day-summaries.sql`:

```sql
-- 편집 가능·증분 누적 오늘 운동 요약 저장 테이블
-- Supabase SQL Editor에서 1회 실행 필요
CREATE TABLE IF NOT EXISTS ddodun.workout_day_summaries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  date date NOT NULL,
  text text NOT NULL DEFAULT '',
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
```

- [ ] **Step 2: API 모듈 생성**

Create `src/lib/api/day-summaries.ts`:

```ts
import { supabase } from '@/lib/supabase'

export interface DaySummaryBlock {
  key: string
  template_ids: string[]
  sig: string
  auto_snippet: string
}

export interface DaySummary {
  text: string
  blocks: DaySummaryBlock[]
}

export async function getDaySummary(userId: string, date: string): Promise<DaySummary | null> {
  const { data, error } = await supabase
    .from('workout_day_summaries')
    .select('text, blocks')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return { text: data.text ?? '', blocks: (data.blocks as DaySummaryBlock[]) ?? [] }
}

export async function upsertDaySummary(
  userId: string,
  date: string,
  text: string,
  blocks: DaySummaryBlock[],
): Promise<void> {
  const { error } = await supabase
    .from('workout_day_summaries')
    .upsert(
      { user_id: userId, date, text, blocks, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' },
    )
  if (error) throw error
}
```

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add docs/sql/migration-day-summaries.sql src/lib/api/day-summaries.ts
git commit -m "feat(home): 오늘 운동 요약 저장 테이블 + API"
```

---

## Task 2: 순수 로직 모듈 `day-summary.ts` (이관 + reconcile)

**Files:**
- Create: `src/lib/day-summary.ts`
- Modify: `src/components/home/TodaySummary.tsx` (이관된 helper/`generateSummaryText` 정의 삭제, 모듈에서 import — **동작 불변**)

**Interfaces:**
- Consumes: `WorkoutTemplate`, `WorkoutLog`, `DaySummary`/`DaySummaryBlock` (Task 1).
- Produces: `reconcileSummary(stored: DaySummary | null, templates: WorkoutTemplate[], logs: WorkoutLog[]): DaySummary`; `generateSummaryText(templates, logs): string` (기존 동작 유지, Task 3 전까지 `TodaySummary`가 사용).

- [ ] **Step 1: `day-summary.ts` 생성**

Create `src/lib/day-summary.ts` (helper 4개는 `TodaySummary.tsx:13-98`에서 그대로 이관, `buildSectionBlock`은 기존 섹션 렌더 로직 추출, 이후 신규 함수 추가):

```ts
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
```

- [ ] **Step 2: `TodaySummary.tsx`에서 이관된 정의 삭제 + import 교체**

In `src/components/home/TodaySummary.tsx`:
- Remove the local definitions of `parseDetail`, `getWeightText`, `getResultText`, `combineResult`, and `generateSummaryText` (lines 13-179).
- Add import near the top (after existing imports):

```ts
import { generateSummaryText } from '@/lib/day-summary'
```

- Leave the rest of the component unchanged for now (it still calls `generateSummaryText(templates, logs)` in the `useMemo` at what was line 182). Behavior identical.

- [ ] **Step 3: 타입 체크 + 빌드**

Run: `npx tsc --noEmit`  → 에러 없음.
Run: `npm run build`  → 성공.

- [ ] **Step 4: 수동 확인 (동작 불변)**

`npm run dev` 후 홈에서 "오늘 운동 요약"이 이전과 **동일하게** 렌더되는지 확인(리팩터라 출력 불변이어야 함). 브라우저 구동이 어려우면 `generateSummaryText` 본문이 이관 전과 토큰 단위로 동일한지 재확인.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/day-summary.ts src/components/home/TodaySummary.tsx
git commit -m "refactor(home): 요약 로직 day-summary 모듈로 분리 + reconcile 추가"
```

---

## Task 3: TodaySummary 배선(reconcile+저장+재생성) + 홈 페이지 로드

**Files:**
- Modify: `src/components/home/TodaySummary.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: Task 1 `getDaySummary`/`upsertDaySummary`/`DaySummary`/`DaySummaryBlock`; Task 2 `reconcileSummary`.
- Produces: 편집 유지 + 증분 누적 + 저장 동작(end-to-end).

- [ ] **Step 1: `TodaySummary.tsx` 재작성**

Replace the component body (props interface + `export default function TodaySummary`) — the top imports become:

```ts
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Copy, Check, RotateCcw } from 'lucide-react'
import type { WorkoutTemplate } from '@/lib/api/workout-templates'
import type { WorkoutLog } from '@/lib/api/workout-logs'
import type { DaySummary, DaySummaryBlock } from '@/lib/api/day-summaries'
import { reconcileSummary } from '@/lib/day-summary'
```

(Remove the now-unused `generateSummaryText` import and the old `useMemo` import if unused.)

Replace the props interface and component with:

```tsx
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
```

- [ ] **Step 2: `src/app/page.tsx` — day summary 로드 + props 전달**

Add imports (merge into existing lines):

```ts
import { getDaySummary, upsertDaySummary, type DaySummary, type DaySummaryBlock } from '@/lib/api/day-summaries'
```

Add state after `todayLogs` (near line 34):

```ts
  const [todaySummary, setTodaySummary] = useState<DaySummary | null>(null)
```

Replace the `todayPromise` block (currently added in the prior feature, around lines 55-64) with the version that also loads the day summary:

```ts
    const todayPromise = Promise.all([
      getTemplatesByDate(todayStr),
      getExtraTemplatesByDate(todayStr),
      getLogsByDate(userId, todayStr),
      getDaySummary(userId, todayStr).catch(() => null),
    ]).then(([tTemplates, tExtras, tLogs, tSummary]) => {
      setTodayTemplates([...tTemplates, ...tExtras])
      setTodayLogs(tLogs)
      setTodaySummary(tSummary)
    }).catch(err => {
      console.error('Failed to load today summary:', err)
    })
```

Add a stable save callback (after `todayStr` is defined, e.g. near line 36):

```ts
  const handleSummarySave = useCallback((text: string, blocks: DaySummaryBlock[]) => {
    upsertDaySummary(userId, todayStr, text, blocks).catch(err =>
      console.error('Failed to save day summary:', err))
  }, [userId, todayStr])
```

(`useCallback` is already imported in page.tsx.)

Replace the `TodaySummary` render (currently `<TodaySummary templates={todayTemplates} logs={todayLogs} />`, ~line 178):

```tsx
      <TodaySummary
        templates={todayTemplates}
        logs={todayLogs}
        stored={todaySummary}
        onSave={handleSummarySave}
      />
```

- [ ] **Step 3: 타입 체크 + 빌드**

Run: `npx tsc --noEmit`  → 에러 없음.
Run: `npm run build`  → 성공.

- [ ] **Step 4: 커밋**

```bash
git add src/components/home/TodaySummary.tsx src/app/page.tsx
git commit -m "feat(home): 오늘 운동 요약 편집 유지·증분 누적·저장 배선"
```

---

## Task 4: 마이그레이션 실행 + E2E 수동 검증

**Files:** 없음 (검증 전용). 스펙 §9 대응.

- [ ] **Step 1: ⚠️ 마이그레이션 실행 (사용자 액션)**

`docs/sql/migration-day-summaries.sql`를 Supabase(`qaiammqgkrrgfstqadef`) SQL Editor에서 실행. 확인:
```sql
SELECT to_regclass('ddodun.workout_day_summaries');  -- non-null이면 존재
```

- [ ] **Step 2: E2E 검증 (`npm run dev` + 브라우저 / 라이브 DB)**

스펙 §9 항목: (1) 완료없음→미표시, (2) A완료→표시·저장, (3) B완료→A유지+B append, (3b) A·C 후 B완료→A·C 사이 삽입, (4) A편집→C완료→A편집 유지+C append, (5) 미편집 B 무게변경→B만 재생성, (6) B완료해제→변화없음, (7) 편집한 A 무게변경→A 재생성(데이터가 이김), (8) 새로고침 유지, (9) 처음부터 버튼, (10) 테이블 부재 폴백, (11) 추가운동 완료→"추가운동" 블록.

- [ ] **Step 3: 검증 완료 (코드 변경 시 커밋)**

버그 발견 시 해당 태스크로 돌아가 수정 후 재검증.

---

## Self-Review

**Spec coverage:**
- 저장 테이블/스키마 → Task 1. ✓
- 순수 로직(생성/genSectionBlock/sigOf/reconcile) → Task 2. ✓
- 신규 완료 섹션순서 삽입 → `reconcileSummary` 1단계. ✓
- 완료해제 제거 안 함 → sig 불변 시 미변경(2단계 continue). ✓
- 무게/메모 변경 시 섹션 재생성(데이터가 이김) → 2단계. ✓
- 미변경 섹션·자유 메모 유지 → sig 불변 미터치 + 어느 스니펫에도 없는 텍스트 미터치. ✓
- 편집 디바운스 저장 → Task 3 `handleEdit`. ✓
- 재생성 버튼 → `handleReset`. ✓
- 저장/기기 간 유지 → Supabase upsert + 홈 로드. ✓
- 폴백 → `getDaySummary(...).catch(()=>null)` + onSave catch. ✓
- 마이그레이션 선행 → Task 1 + Task 4. ✓

**Placeholder scan:** TBD/TODO 없음, 모든 코드 스텝에 실제 코드. ✓

**Type consistency:** `DaySummary`/`DaySummaryBlock`(Task 1) → Task 2/3 사용 일치. `reconcileSummary(stored, templates, logs): DaySummary`(Task 2 정의) → Task 3 사용 일치. `getDaySummary`/`upsertDaySummary` 시그니처 일치. `onSave(text, blocks)` 시그니처 컴포넌트↔홈 일치. ✓
