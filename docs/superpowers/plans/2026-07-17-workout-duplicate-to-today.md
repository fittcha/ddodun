# 운동 그룹 "오늘 운동에 복제" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 운동 섹션 카드의 복사 아이콘을 팝업(「내용 복사」/「오늘 운동에 복제」)으로 확장하고, 복제 시 오늘 날짜에 "추가운동" 카드로 그대로 복제·기록·삭제할 수 있게 한다.

**Architecture:** 복제본을 기존 `ddodun.workout_templates` 테이블에 마커 컬럼 2개(`extra_group_id`, `extra_order`)와 함께 새 행으로 저장한다. 조회 시 코치 원본(`extra_group_id IS NULL`)과 복제본을 분리해, 복제본은 `WorkoutSection`을 "추가운동" 라벨로 재사용해 렌더한다. 기록은 복제본의 새 `template_id`로 `workout_logs`에 독립 저장된다.

**Tech Stack:** Next.js 16 (App Router, `'use client'`), React 19, TypeScript, Supabase (`@supabase/supabase-js`, schema `ddodun`), Tailwind v4.

## Global Constraints

- 이 프로젝트에는 **테스트 프레임워크가 없다.** 각 태스크의 자동 검증은 `npx tsc --noEmit`(타입 체크) + 필요 시 `npm run build`이며, 기능 검증은 `npm run dev` 후 브라우저 수동 확인이다. 새 테스트 프레임워크를 도입하지 말 것.
- 모든 사용자에게 동일 데이터가 보여도 무방한 **단일 사용자 앱**. `user_id` 스코핑 불필요.
- Supabase 클라이언트는 `src/lib/supabase.ts`에서 `{ db: { schema: 'ddodun' } }`로 스코프됨. 모든 쿼리는 `ddodun` 스키마 대상.
- 복제본 행의 `section` 값 = 문자열 `"추가운동"`. 헤더 표시 라벨도 `"추가운동"`.
- 복제는 **처방(템플릿)만** 복사한다. 원본 로그(무게/완료)는 복사하지 않는다.
- 복제 대상 날짜는 항상 **오늘**(`getToday()`), 현재 보고 있는 날짜와 무관.
- 기존 코치 A~F 렌더링·기록 동작을 **회귀시키지 말 것**.
- **⚠️ 선행 사용자 액션**: Task 1의 마이그레이션 SQL을 Supabase에서 실행해야 복제/조회가 동작한다. 코드 배포와 별개로 반드시 실행되어야 함(Task 5 E2E 검증 전).

---

## File Structure

- `docs/sql/migration-extra-workout.sql` (신규) — 컬럼 2개 추가 마이그레이션.
- `src/lib/api/workout-templates.ts` (수정) — `WorkoutTemplate` 필드 2개, `getTemplatesByDate` 필터, 신규 `getExtraTemplatesByDate`/`duplicateSectionToToday`/`deleteExtraGroup`.
- `src/components/workout/WorkoutSection.tsx` (수정) — props 3개, 복사 팝오버, 문자열 빌더 추출, 토스트 메시지화, displayName, X 삭제 버튼, memo 비교.
- `src/app/workout/page.tsx` (수정) — extras 로드/그룹화/렌더, 복제·삭제 핸들러, 캐시 확장.

---

## Task 1: DB 마이그레이션 SQL + 인터페이스 필드 + 코치 조회 필터

**Files:**
- Create: `docs/sql/migration-extra-workout.sql`
- Modify: `src/lib/api/workout-templates.ts:3-18` (인터페이스), `:48-58` (`getTemplatesByDate`)

**Interfaces:**
- Produces: `WorkoutTemplate`에 `extra_group_id: string | null`, `extra_order: number | null` 필드. `getTemplatesByDate(date)`는 이제 코치 원본만 반환.

- [ ] **Step 1: 마이그레이션 SQL 파일 생성**

Create `docs/sql/migration-extra-workout.sql`:

```sql
-- "오늘 운동에 복제" 기능용 마커 컬럼 추가
-- Supabase SQL Editor에서 1회 실행 필요
ALTER TABLE ddodun.workout_templates
  ADD COLUMN IF NOT EXISTS extra_group_id uuid,
  ADD COLUMN IF NOT EXISTS extra_order    int;

-- 복제본 조회 성능용 부분 인덱스
CREATE INDEX IF NOT EXISTS idx_workout_templates_extra
  ON ddodun.workout_templates (date, extra_order)
  WHERE extra_group_id IS NOT NULL;
```

- [ ] **Step 2: `WorkoutTemplate` 인터페이스에 필드 추가**

In `src/lib/api/workout-templates.ts`, replace the interface (lines 3-18):

```ts
export interface WorkoutTemplate {
  id: string
  date: string
  day_of_week: string
  section: string
  workout_type: string
  title: string | null
  description: string | null
  prescribed_sets: number | null
  prescribed_reps: string | null
  prescribed_weight: string | null
  prescribed_time: string | null
  rest_seconds: number | null
  notes: string | null
  sort_order: number
  extra_group_id: string | null
  extra_order: number | null
}
```

- [ ] **Step 3: `getTemplatesByDate`에 코치 원본 필터 추가**

Replace `getTemplatesByDate` (lines 48-58):

```ts
export async function getTemplatesByDate(date: string): Promise<WorkoutTemplate[]> {
  const { data, error } = await supabase
    .from('workout_templates')
    .select('*')
    .eq('date', date)
    .is('extra_group_id', null)
    .order('section')
    .order('sort_order')

  if (error) throw error
  return data || []
}
```

- [ ] **Step 4: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0).

- [ ] **Step 5: 커밋**

```bash
git add docs/sql/migration-extra-workout.sql src/lib/api/workout-templates.ts
git commit -m "feat(workout): 추가운동 복제용 마커 컬럼 + 코치 조회 필터"
```

---

## Task 2: 복제/조회/삭제 API 함수

**Files:**
- Modify: `src/lib/api/workout-templates.ts` (파일 끝에 함수 추가, 상단 import 추가)

**Interfaces:**
- Consumes: `WorkoutTemplate`, `getToday` from `@/lib/date-utils`, `supabase`.
- Produces:
  - `getExtraTemplatesByDate(date: string): Promise<WorkoutTemplate[]>` — 그 날짜의 복제본만, `extra_order`→`sort_order` 순.
  - `duplicateSectionToToday(templates: WorkoutTemplate[]): Promise<WorkoutTemplate[]>` — insert된 새 행들 반환.
  - `deleteExtraGroup(extraGroupId: string): Promise<void>`.

- [ ] **Step 1: `getToday` import 추가**

At top of `src/lib/api/workout-templates.ts`, after line 1 (`import { supabase } ...`):

```ts
import { getToday } from '@/lib/date-utils'
```

- [ ] **Step 2: `getExtraTemplatesByDate` 추가**

Append to `src/lib/api/workout-templates.ts`:

```ts
export async function getExtraTemplatesByDate(date: string): Promise<WorkoutTemplate[]> {
  const { data, error } = await supabase
    .from('workout_templates')
    .select('*')
    .eq('date', date)
    .not('extra_group_id', 'is', null)
    .order('extra_order')
    .order('sort_order')

  if (error) throw error
  return data || []
}
```

- [ ] **Step 3: `duplicateSectionToToday` 추가**

Append:

```ts
const DOW_CODES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export async function duplicateSectionToToday(
  templates: WorkoutTemplate[]
): Promise<WorkoutTemplate[]> {
  if (templates.length === 0) return []
  const today = getToday()
  const dow = DOW_CODES[new Date(today + 'T00:00:00').getDay()]

  // 오늘의 기존 추가운동 중 최대 extra_order → 다음 순서
  const { data: existing, error: exErr } = await supabase
    .from('workout_templates')
    .select('extra_order')
    .eq('date', today)
    .not('extra_group_id', 'is', null)
    .order('extra_order', { ascending: false })
    .limit(1)
  if (exErr) throw exErr
  const nextOrder = (existing?.[0]?.extra_order ?? 0) + 1

  const extraGroupId = crypto.randomUUID()

  const rows = templates.map(t => ({
    date: today,
    day_of_week: dow,
    section: '추가운동',
    workout_type: t.workout_type,
    title: t.title,
    description: t.description,
    prescribed_sets: t.prescribed_sets,
    prescribed_reps: t.prescribed_reps,
    prescribed_weight: t.prescribed_weight,
    prescribed_time: t.prescribed_time,
    rest_seconds: t.rest_seconds,
    notes: t.notes,
    sort_order: t.sort_order,
    extra_group_id: extraGroupId,
    extra_order: nextOrder,
  }))

  const { data, error } = await supabase
    .from('workout_templates')
    .insert(rows)
    .select()
  if (error) throw error
  return data || []
}
```

- [ ] **Step 4: `deleteExtraGroup` 추가**

Append:

```ts
export async function deleteExtraGroup(extraGroupId: string): Promise<void> {
  // 1) 그룹의 template id 조회
  const { data: rows, error: selErr } = await supabase
    .from('workout_templates')
    .select('id')
    .eq('extra_group_id', extraGroupId)
  if (selErr) throw selErr

  const ids = (rows || []).map(r => r.id)

  // 2) 연결된 로그 삭제
  if (ids.length > 0) {
    const { error: logErr } = await supabase
      .from('workout_logs')
      .delete()
      .in('template_id', ids)
    if (logErr) throw logErr
  }

  // 3) 템플릿 행 삭제
  const { error: tplErr } = await supabase
    .from('workout_templates')
    .delete()
    .eq('extra_group_id', extraGroupId)
  if (tplErr) throw tplErr
}
```

- [ ] **Step 5: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 6: 커밋**

```bash
git add src/lib/api/workout-templates.ts
git commit -m "feat(workout): 추가운동 복제/조회/삭제 API 함수"
```

---

## Task 3: WorkoutSection — 복사 팝오버 + displayName + X 삭제

**Files:**
- Modify: `src/components/workout/WorkoutSection.tsx` (props `:14-21`, state `:576`, header 라벨 `:607`, 복사 버튼 `:615-650`, 버튼 클러스터 `:673-674`, 토스트 `:1087-1091`, memo `:1109-1118`, 컴포넌트 본문에 함수/팝오버 추가)

**Interfaces:**
- Consumes: `WorkoutTemplate` (with `extra_group_id`/`extra_order` fields from Task 1).
- Produces: `WorkoutSection`가 아래 선택적 props를 받는다:
  - `displayName?: string` — 헤더 라벨 override.
  - `onDelete?: () => void` — 있으면 X 삭제 버튼 표시.
  - `onDuplicateToToday?: (templates: WorkoutTemplate[]) => Promise<void> | void` — 있으면 팝오버에 「오늘 운동에 복제」 버튼 표시.

- [ ] **Step 1: props 인터페이스 확장**

Replace `WorkoutSectionProps` (lines 14-21):

```ts
interface WorkoutSectionProps {
  userId: string
  section: string
  templates: WorkoutTemplate[]
  logs: WorkoutLog[]
  date: string
  onLogUpdate: (log: WorkoutLog) => void
  displayName?: string
  onDelete?: () => void
  onDuplicateToToday?: (templates: WorkoutTemplate[]) => Promise<void> | void
}
```

Then update the function signature that destructures props (find `function WorkoutSectionInner({ userId, section, templates, logs, date, onLogUpdate }: WorkoutSectionProps)` near line 212) to:

```ts
function WorkoutSectionInner({ userId, section, templates, logs, date, onLogUpdate, displayName, onDelete, onDuplicateToToday }: WorkoutSectionProps) {
```

- [ ] **Step 2: 토스트 상태를 메시지 기반으로 교체 + 팝오버 상태 추가**

Replace line 576 (`const [copyToast, setCopyToast] = useState(false)`):

```ts
  const [copyMenuOpen, setCopyMenuOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 1000)
  }

  function buildCopyText(): string {
    return templates.map(t => {
      const parts: string[] = []
      if (t.title) parts.push(t.title)
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
  }
```

- [ ] **Step 3: 헤더 라벨을 displayName override로 변경**

Replace line 607 (`<span className="text-xs font-bold text-accent">{section}</span>`):

```tsx
        <span className="text-xs font-bold text-accent">{displayName ?? section}</span>
```

- [ ] **Step 4: 복사 버튼 onClick을 팝오버 오픈으로 변경**

Replace the copy `<button>` (lines 615-650) — keep the same SVG icon, change `onClick`:

```tsx
            <button
              onClick={() => setCopyMenuOpen(true)}
              className="w-6 h-6 rounded flex items-center justify-center text-text-secondary/50 active:text-accent"
              title="운동 복사"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
```

- [ ] **Step 5: 버튼 클러스터 끝에 X 삭제 버튼 추가**

In the `ml-auto` cluster, immediately before its closing `</div>` (currently line 674, right after the memo toggle button that ends at line 673), add:

```tsx
            {onDelete && (
              <button
                onClick={onDelete}
                className="w-6 h-6 rounded flex items-center justify-center text-text-secondary/50 active:text-danger"
                title="추가운동 삭제"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
```

- [ ] **Step 6: 복사 팝오버 + 토스트 렌더 교체**

Replace the toast block (lines 1087-1091) with the popover + message-based toast:

```tsx
      {/* Copy menu popover */}
      {copyMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setCopyMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-[280px] bg-surface rounded-2xl p-5 shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-center mb-4">운동 복사</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(buildCopyText())
                  setCopyMenuOpen(false)
                  showToast('복사됨')
                }}
                className="w-full py-2.5 rounded-lg border border-border bg-background text-foreground font-medium"
              >
                내용 복사
              </button>
              {onDuplicateToToday && (
                <button
                  onClick={async () => {
                    setCopyMenuOpen(false)
                    try {
                      await onDuplicateToToday(templates)
                      showToast('오늘 운동에 추가됨')
                    } catch {
                      showToast('복제 실패')
                    }
                  }}
                  className="w-full py-2.5 rounded-lg bg-accent text-white font-medium"
                >
                  오늘 운동에 복제
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Toast */}
      {toastMsg && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="bg-foreground/80 text-white text-xs px-3 py-1.5 rounded-full">{toastMsg}</span>
        </div>
      )}
```

- [ ] **Step 7: memo 비교 함수에 신규 props 반영**

Replace the memo comparator (lines 1109-1118):

```tsx
const WorkoutSection = memo(WorkoutSectionInner, (prev, next) => {
  return (
    prev.userId === next.userId &&
    prev.section === next.section &&
    prev.displayName === next.displayName &&
    prev.date === next.date &&
    !!prev.onDelete === !!next.onDelete &&
    !!prev.onDuplicateToToday === !!next.onDuplicateToToday &&
    prev.templates.length === next.templates.length &&
    prev.templates.every((t, i) => t.id === next.templates[i].id) &&
    logsEqual(prev.logs, next.logs)
  )
})
```

- [ ] **Step 8: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 9: 수동 확인 (복사 팝오버 단독 동작)**

Run: `npm run dev`, 브라우저에서 오늘 운동 페이지 열기.
- 섹션 카드의 복사 아이콘 클릭 → 중앙에 "운동 복사" 팝오버 + 「내용 복사」 버튼 표시.
- (이 시점엔 페이지가 `onDuplicateToToday`를 아직 안 넘기므로 「오늘 운동에 복제」 버튼은 안 보이는 게 정상.)
- 「내용 복사」 클릭 → 클립보드에 기존과 동일 문자열 복사 + "복사됨" 토스트.
- 배경 클릭 시 팝오버 닫힘.

- [ ] **Step 10: 커밋**

```bash
git add src/components/workout/WorkoutSection.tsx
git commit -m "feat(workout): 복사 팝오버 + 추가운동 라벨/삭제 버튼 지원"
```

---

## Task 4: 운동 페이지 통합 (extras 로드·렌더·복제·삭제)

**Files:**
- Modify: `src/app/workout/page.tsx` (import `:9`, dateCache 타입 `:18-23`, state `:30-33`, `loadData` `:49-87`, memo 추가 `:145` 이후, 코치 섹션 렌더 `:277-285`, 섹션 컨테이너 `:262-293`)

**Interfaces:**
- Consumes: Task 2의 `getExtraTemplatesByDate`, `duplicateSectionToToday`, `deleteExtraGroup`; Task 3의 `WorkoutSection` props(`displayName`/`onDelete`/`onDuplicateToToday`).
- Produces: 화면상 A~F 아래 "추가운동" 카드 렌더 + 복제/삭제 end-to-end 동작.

- [ ] **Step 1: import 확장**

Replace line 9:

```ts
import { getTemplatesByDate, getTemplateDatesByRange, getExtraTemplatesByDate, duplicateSectionToToday, deleteExtraGroup, type WorkoutTemplate } from '@/lib/api/workout-templates'
```

- [ ] **Step 2: dateCache 타입에 extras 추가**

Replace the `dateCache` declaration (lines 18-23):

```ts
const dateCache = new Map<string, {
  templates: WorkoutTemplate[]
  extras: WorkoutTemplate[]
  logs: WorkoutLog[]
  customLogs: WorkoutLog[]
  competition: Competition | null
}>()
```

- [ ] **Step 3: extras state 추가**

After line 30 (`const [templates, setTemplates] = useState<WorkoutTemplate[]>([])`), add:

```ts
  const [extras, setExtras] = useState<WorkoutTemplate[]>([])
```

- [ ] **Step 4: `loadData`에서 extras 로드**

Replace the body of `loadData` (lines 49-87) with the version that loads/caches extras:

```ts
  const loadData = useCallback(async () => {
    const cached = dateCache.get(date)
    if (cached) {
      setTemplates(cached.templates)
      setExtras(cached.extras)
      setLogs(cached.logs)
      setCustomLogs(cached.customLogs)
      setCompetition(cached.competition)
    }

    setLoading(!cached)
    try {
      const [tpls, ext, lgs, comp] = await Promise.all([
        getTemplatesByDate(date),
        getExtraTemplatesByDate(date),
        getLogsByDate(userId, date),
        getCompetitionByDate(userId, date),
      ])
      const templateLogs = lgs.filter(l => !l.is_custom)
      const custom = lgs.filter(l => l.is_custom)

      dateCache.set(date, { templates: tpls, extras: ext, logs: templateLogs, customLogs: custom, competition: comp })

      setTemplates(tpls)
      setExtras(ext)
      setLogs(templateLogs)
      setCustomLogs(custom)
      setCompetition(comp)
    } catch (err) {
      console.error('Failed to load workout data:', err)
      if (!cached) {
        setTemplates([])
        setExtras([])
        setLogs([])
        setCustomLogs([])
        setCompetition(null)
      }
    } finally {
      setLoading(false)
    }
  }, [date])
```

- [ ] **Step 5: extra 그룹화 + 로그 매핑 memo 추가**

After the `sectionLogs` memo (ends line 155), add:

```ts
  // Group extras by extra_group_id (already ordered by extra_order → sort_order)
  const extraGroups = useMemo(() => {
    const result: { extraGroupId: string; templates: WorkoutTemplate[] }[] = []
    const map = new Map<string, WorkoutTemplate[]>()
    for (const t of extras) {
      const key = t.extra_group_id as string
      if (!map.has(key)) {
        const items: WorkoutTemplate[] = []
        map.set(key, items)
        result.push({ extraGroupId: key, templates: items })
      }
      map.get(key)!.push(t)
    }
    return result
  }, [extras])

  const extraLogs = useMemo(() => {
    const result = new Map<string, WorkoutLog[]>()
    for (const g of extraGroups) {
      const ids = new Set(g.templates.map(t => t.id))
      result.set(g.extraGroupId, logs.filter(l => l.template_id && ids.has(l.template_id)))
    }
    return result
  }, [extraGroups, logs])
```

- [ ] **Step 6: 복제/삭제 핸들러 추가**

After `handleCustomAdd` (ends line 130), add:

```ts
  const handleDuplicateToToday = useCallback(async (tpls: WorkoutTemplate[]) => {
    const created = await duplicateSectionToToday(tpls)
    const today = getToday()
    if (date === today) {
      setExtras(prev => {
        const next = [...prev, ...created]
        const cached = dateCache.get(date)
        if (cached) dateCache.set(date, { ...cached, extras: next })
        return next
      })
    } else {
      dateCache.delete(today)
    }
  }, [date])

  const handleExtraDelete = useCallback(async (groupId: string) => {
    const snapshot = extras
    setExtras(prev => {
      const next = prev.filter(t => t.extra_group_id !== groupId)
      const cached = dateCache.get(date)
      if (cached) dateCache.set(date, { ...cached, extras: next })
      return next
    })
    try {
      await deleteExtraGroup(groupId)
    } catch (err) {
      console.error('Failed to delete extra group:', err)
      setExtras(snapshot)
      const cached = dateCache.get(date)
      if (cached) dateCache.set(date, { ...cached, extras: snapshot })
    }
  }, [extras, date])
```

- [ ] **Step 7: 코치 섹션에 onDuplicateToToday 전달**

In the coach section render (lines 277-285), add the prop:

```tsx
            <WorkoutSection
              key={section}
              userId={userId}
              section={section}
              templates={sectionTemplates}
              logs={sectionLogs.get(section) ?? emptyLogs}
              date={date}
              onLogUpdate={handleLogUpdate}
              onDuplicateToToday={handleDuplicateToToday}
            />
```

- [ ] **Step 8: extra 카드 렌더 추가**

Inside the `<div className={space-y-4 ...}>` container, immediately after the coach sections block closes (after line 292 `)}`, before the container's closing `</div>` at line 293), add:

```tsx
      {extraGroups.map(g => (
        <WorkoutSection
          key={g.extraGroupId}
          userId={userId}
          section="추가운동"
          displayName="추가운동"
          templates={g.templates}
          logs={extraLogs.get(g.extraGroupId) ?? emptyLogs}
          date={date}
          onLogUpdate={handleLogUpdate}
          onDuplicateToToday={handleDuplicateToToday}
          onDelete={() => handleExtraDelete(g.extraGroupId)}
        />
      ))}
```

- [ ] **Step 9: 타입 체크 + 빌드**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

Run: `npm run build`
Expected: 빌드 성공.

- [ ] **Step 10: 커밋**

```bash
git add src/app/workout/page.tsx
git commit -m "feat(workout): 오늘 운동에 복제 - 추가운동 카드 렌더/복제/삭제 통합"
```

---

## Task 5: 마이그레이션 실행 + E2E 수동 검증

**Files:** 없음 (검증 전용). 스펙 §9 테스트 계획 대응.

- [ ] **Step 1: ⚠️ 마이그레이션 실행 (사용자 액션)**

`docs/sql/migration-extra-workout.sql` 내용을 Supabase 프로젝트(`qaiammqgkrrgfstqadef`)의 SQL Editor에서 실행. 실행 전에는 복제/조회가 "column does not exist" 에러를 낸다.

확인 쿼리:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'ddodun' AND table_name = 'workout_templates'
  AND column_name IN ('extra_group_id', 'extra_order');
```
Expected: 2행 반환.

- [ ] **Step 2: E2E 검증 (`npm run dev` 후 브라우저)**

스펙 §9 항목을 순서대로 확인:
1. 오늘 보기에서 섹션 A 복사 아이콘 → 「오늘 운동에 복제」 → A~F 아래 "추가운동" 카드 즉시 표시.
2. 다른 섹션도 복제 → 복제 순서대로 카드 누적.
3. 추가운동 카드에서 완료 체크/무게/결과/메모 입력 → 새로고침 후에도 유지.
4. 추가운동 X 버튼 → 카드+로그 제거, 새로고침 후에도 유지.
5. 복제 원본 날짜 재확인 → 원본 그대로, 추가운동은 오늘에만 존재.
6. 과거 날짜 보기에서 복제 → "오늘 운동에 추가됨" 토스트만, 오늘로 이동 시 카드 표시.
7. 「내용 복사」 → 기존과 동일 문자열 복사.
8. 코치 A~F 정상 렌더(복제본 필터링 정상, 회귀 없음).

- [ ] **Step 3: 검증 완료 커밋 (문서/체크리스트 변경 있을 경우)**

기능 코드 변경이 없으면 생략. 검증 중 발견된 버그는 해당 태스크로 돌아가 수정 후 재검증.

---

## Self-Review

**Spec coverage:**
- 팝업 2버튼 → Task 3 Step 6. ✓
- 「내용 복사」 기존 동작 → Task 3 Step 2/6 (`buildCopyText`는 기존 로직 동일). ✓
- 「오늘 운동에 복제」 → A~F 아래 "추가운동" → Task 2 `duplicateSectionToToday` + Task 4 Step 8. ✓
- 여러 개 복제 순서 유지 → `extra_order`(Task 2) + `extraGroups`(Task 4 Step 5). ✓
- 원본 유지 → insert-only(Task 2), 코치 조회는 `extra_group_id IS NULL`(Task 1). ✓
- 완전한 운동 + 영구 저장 → 복제본이 실제 템플릿 행, `WorkoutSection` 재사용, 로그는 새 `template_id`. ✓
- X 삭제 → Task 3 Step 5 + Task 2 `deleteExtraGroup` + Task 4 Step 6/8. ✓
- 크로스 날짜 토스트/캐시 → Task 4 Step 6. ✓
- 마이그레이션 선행 → Task 1 Step 1 + Task 5 Step 1. ✓

**Placeholder scan:** TBD/TODO 없음. 모든 코드 스텝에 실제 코드 포함. ✓

**Type consistency:** `duplicateSectionToToday(templates)`/`deleteExtraGroup(extraGroupId)`/`getExtraTemplatesByDate(date)` 시그니처가 Task 2 정의와 Task 4 사용처 일치. `WorkoutSection`의 `displayName`/`onDelete`/`onDuplicateToToday`가 Task 3 정의와 Task 4 전달 일치. `extra_group_id`/`extra_order` 필드가 Task 1 인터페이스와 이후 사용 일치. ✓
