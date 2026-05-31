# Benchmark WOD 기록 기능 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** PR 탭에 WOD 서브탭을 추가하여 Named WOD / Open WOD 기록을 히스토리로 관리한다.

**Architecture:** PR 페이지에 서브탭([기록] / [WOD]) 추가. WOD 탭은 Named/Open 섹션으로 나뉘며, 각 WOD의 기록 히스토리를 모달로 조회/추가/삭제. DB는 단일 `wod_records` 테이블.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Supabase (ddodun schema)

---

### Task 1: DB 테이블 생성

**Files:**
- SQL (Supabase SQL Editor에서 실행)

**Step 1: Supabase SQL Editor에서 wod_records 테이블 생성**

```sql
CREATE TABLE ddodun.wod_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ddodun.users(id),
  wod_type TEXT NOT NULL CHECK (wod_type IN ('named', 'open')),
  wod_name TEXT NOT NULL,
  score_type TEXT NOT NULL CHECK (score_type IN ('time', 'amrap', 'reps')),
  time_seconds INT,
  rounds INT,
  extra_reps INT,
  reps INT,
  memo TEXT,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- service_role 권한
GRANT ALL ON ddodun.wod_records TO service_role;
GRANT ALL ON ddodun.wod_records TO anon;
GRANT ALL ON ddodun.wod_records TO authenticated;
```

유저에게 SQL 실행을 요청한다.

---

### Task 2: WOD API 레이어

**Files:**
- Create: `app/src/lib/api/wod.ts`

**Step 1: WOD API 작성**

```typescript
import { supabase } from '@/lib/supabase'

export interface WodRecord {
  id: string
  user_id: string
  wod_type: 'named' | 'open'
  wod_name: string
  score_type: 'time' | 'amrap' | 'reps'
  time_seconds: number | null
  rounds: number | null
  extra_reps: number | null
  reps: number | null
  memo: string | null
  recorded_at: string
  created_at: string
}

export type ScoreType = 'time' | 'amrap' | 'reps'

export interface WodPreset {
  name: string
  category: 'girl' | 'hero'
  scoreType: ScoreType
  description: string
}

export const NAMED_WOD_PRESETS: WodPreset[] = [
  // Girl WODs
  { name: 'Fran', category: 'girl', scoreType: 'time', description: '21-15-9: Thrusters (95/65lb) & Pull-ups' },
  { name: 'Grace', category: 'girl', scoreType: 'time', description: '30 Clean & Jerks (135/95lb)' },
  { name: 'Isabel', category: 'girl', scoreType: 'time', description: '30 Snatches (135/95lb)' },
  { name: 'Diane', category: 'girl', scoreType: 'time', description: '21-15-9: Deadlifts (225/155lb) & HSPU' },
  { name: 'Helen', category: 'girl', scoreType: 'time', description: '3 Rds: 400m Run, 21 KB Swings, 12 Pull-ups' },
  { name: 'Jackie', category: 'girl', scoreType: 'time', description: '1000m Row, 50 Thrusters (45/35lb), 30 Pull-ups' },
  { name: 'Karen', category: 'girl', scoreType: 'time', description: '150 Wall Ball Shots (20/14lb)' },
  { name: 'Annie', category: 'girl', scoreType: 'time', description: '50-40-30-20-10: DU & Sit-ups' },
  { name: 'Nancy', category: 'girl', scoreType: 'time', description: '5 Rds: 400m Run, 15 OHS (95/65lb)' },
  { name: 'Cindy', category: 'girl', scoreType: 'amrap', description: 'AMRAP 20: 5 Pull-ups, 10 Push-ups, 15 Squats' },
  { name: 'Mary', category: 'girl', scoreType: 'amrap', description: 'AMRAP 20: 5 HSPU, 10 Pistols, 15 Pull-ups' },
  // Hero WODs
  { name: 'Murph', category: 'hero', scoreType: 'time', description: '1mi Run, 100 PU, 200 Push-ups, 300 Squats, 1mi Run' },
  { name: 'DT', category: 'hero', scoreType: 'time', description: '5 Rds: 12 DL, 9 HPC, 6 PJ (155/105lb)' },
  { name: 'JT', category: 'hero', scoreType: 'time', description: '21-15-9: HSPU, Ring Dips, Push-ups' },
]

export async function getWodRecords(userId: string, wodName: string): Promise<WodRecord[]> {
  const { data, error } = await supabase
    .from('wod_records')
    .select('*')
    .eq('user_id', userId)
    .eq('wod_name', wodName)
    .order('recorded_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getAllWodRecords(userId: string): Promise<WodRecord[]> {
  const { data, error } = await supabase
    .from('wod_records')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createWodRecord(
  userId: string,
  record: Omit<WodRecord, 'id' | 'user_id' | 'created_at'>
): Promise<WodRecord> {
  const { data, error } = await supabase
    .from('wod_records')
    .insert({ ...record, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteWodRecord(id: string) {
  const { error } = await supabase.from('wod_records').delete().eq('id', id)
  if (error) throw error
}
```

**Step 2: 빌드 확인**

Run: `cd /Users/chacha/lab/ddodun/app && npx next build`

**Step 3: Commit**

```bash
git add app/src/lib/api/wod.ts
git commit -m "feat: add WOD records API layer"
```

---

### Task 3: PR 페이지 서브탭 구조 리팩터

**Files:**
- Modify: `app/src/app/pr/page.tsx`

기존 PR 페이지 내용을 "기록" 탭 컨텐츠로 감싸고, 상단에 [기록] [WOD] 탭 토글을 추가한다. WOD 탭은 일단 placeholder.

**Step 1: 서브탭 상태 추가 및 UI 분리**

`pr/page.tsx` 상단에 `activeTab` 상태를 추가하고, 기존 return JSX를 `activeTab === 'records'` 조건으로 감싼다.

```tsx
// 기존 state 옆에 추가
const [activeTab, setActiveTab] = useState<'records' | 'wod'>('records')

// return 내부 최상단에 탭 네비게이션 추가
<div className="px-4 space-y-6">
  {/* Sub-tab navigation */}
  <div className="flex gap-4 border-b border-border">
    <button
      onClick={() => setActiveTab('records')}
      className={`pb-2 text-sm font-bold transition-colors ${
        activeTab === 'records'
          ? 'text-accent border-b-2 border-accent'
          : 'text-text-secondary'
      }`}
    >
      기록
    </button>
    <button
      onClick={() => setActiveTab('wod')}
      className={`pb-2 text-sm font-bold transition-colors ${
        activeTab === 'wod'
          ? 'text-accent border-b-2 border-accent'
          : 'text-text-secondary'
      }`}
    >
      WOD
    </button>
  </div>

  {activeTab === 'records' ? (
    <>
      {/* 기존 1RM / nRM / 페이스 섹션 전체 */}
    </>
  ) : (
    <div className="text-center text-text-secondary text-sm py-8">
      WOD 기록 (준비 중)
    </div>
  )}

  {/* Modals - 탭 밖에 위치 */}
</div>
```

**Step 2: 빌드 확인**

Run: `cd /Users/chacha/lab/ddodun/app && npx next build`

**Step 3: Commit**

```bash
git add app/src/app/pr/page.tsx
git commit -m "feat: add sub-tab navigation to PR page (기록/WOD)"
```

---

### Task 4: WOD 기록 추가 모달

**Files:**
- Create: `app/src/components/pr/WodRecordModal.tsx`

Named WOD 탭/Open WOD 추가 버튼에서 열리는 모달. WOD 정보 + 결과 입력 + 날짜 + 메모.

**Step 1: WodRecordModal 컴포넌트 작성**

```tsx
'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { ScoreType } from '@/lib/api/wod'

interface WodRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    score_type: ScoreType
    time_seconds: number | null
    rounds: number | null
    extra_reps: number | null
    reps: number | null
    memo: string | null
    recorded_at: string
  }) => void
  wodName: string
  description?: string
  defaultScoreType: ScoreType
  /** true면 score_type 변경 가능 (Open WOD) */
  allowScoreTypeChange?: boolean
}

function getToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function WodRecordModal({
  isOpen, onClose, onSave, wodName, description, defaultScoreType, allowScoreTypeChange
}: WodRecordModalProps) {
  const [scoreType, setScoreType] = useState<ScoreType>(defaultScoreType)
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')
  const [rounds, setRounds] = useState('')
  const [extraReps, setExtraReps] = useState('')
  const [reps, setReps] = useState('')
  const [memo, setMemo] = useState('')
  const [recordedAt, setRecordedAt] = useState(getToday())
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  function reset() {
    setScoreType(defaultScoreType)
    setMinutes(''); setSeconds(''); setRounds(''); setExtraReps(''); setReps(''); setMemo('')
    setRecordedAt(getToday())
  }

  async function handleSave() {
    setSaving(true)
    try {
      const data = {
        score_type: scoreType,
        time_seconds: scoreType === 'time' && (minutes || seconds)
          ? (parseInt(minutes || '0') * 60 + parseInt(seconds || '0'))
          : null,
        rounds: scoreType === 'amrap' && rounds ? parseInt(rounds) : null,
        extra_reps: scoreType === 'amrap' && extraReps ? parseInt(extraReps) : null,
        reps: scoreType === 'reps' && reps ? parseInt(reps) : null,
        memo: memo.trim() || null,
        recorded_at: recordedAt,
      }
      await onSave(data)
      reset()
    } finally {
      setSaving(false)
    }
  }

  const canSave = scoreType === 'time' ? (minutes || seconds)
    : scoreType === 'amrap' ? rounds
    : reps

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg bg-surface rounded-t-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">{wodName}</h3>
            {description && <p className="text-xs text-text-secondary mt-0.5">{description}</p>}
          </div>
          <button onClick={onClose} className="p-1 text-text-secondary"><X size={18} /></button>
        </div>

        {/* Score type selector (Open WOD) */}
        {allowScoreTypeChange && (
          <div className="flex gap-2">
            {(['time', 'amrap', 'reps'] as const).map(t => (
              <button
                key={t}
                onClick={() => setScoreType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  scoreType === t ? 'bg-accent text-white' : 'bg-background border border-border text-text-secondary'
                }`}
              >
                {t === 'time' ? 'For Time' : t === 'amrap' ? 'AMRAP' : 'Reps'}
              </button>
            ))}
          </div>
        )}

        {/* Score input */}
        {scoreType === 'time' && (
          <div className="flex items-center gap-2">
            <input
              type="text" inputMode="numeric" placeholder="mm"
              value={minutes} onChange={e => /^\d*$/.test(e.target.value) && setMinutes(e.target.value)}
              className="w-16 text-center text-lg font-bold border border-border rounded-lg py-2 bg-background"
            />
            <span className="text-lg font-bold text-text-secondary">:</span>
            <input
              type="text" inputMode="numeric" placeholder="ss" maxLength={2}
              value={seconds} onChange={e => /^\d*$/.test(e.target.value) && setSeconds(e.target.value)}
              className="w-16 text-center text-lg font-bold border border-border rounded-lg py-2 bg-background"
            />
          </div>
        )}
        {scoreType === 'amrap' && (
          <div className="flex items-center gap-2">
            <input
              type="text" inputMode="numeric" placeholder="Rounds"
              value={rounds} onChange={e => /^\d*$/.test(e.target.value) && setRounds(e.target.value)}
              className="w-20 text-center text-lg font-bold border border-border rounded-lg py-2 bg-background"
            />
            <span className="text-sm text-text-secondary">+</span>
            <input
              type="text" inputMode="numeric" placeholder="Reps"
              value={extraReps} onChange={e => /^\d*$/.test(e.target.value) && setExtraReps(e.target.value)}
              className="w-20 text-center text-lg font-bold border border-border rounded-lg py-2 bg-background"
            />
          </div>
        )}
        {scoreType === 'reps' && (
          <input
            type="text" inputMode="numeric" placeholder="Total Reps"
            value={reps} onChange={e => /^\d*$/.test(e.target.value) && setReps(e.target.value)}
            className="w-full text-center text-lg font-bold border border-border rounded-lg py-2 bg-background"
          />
        )}

        {/* Date */}
        <input
          type="date" value={recordedAt} onChange={e => setRecordedAt(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
        />

        {/* Memo */}
        <input
          type="text" value={memo} onChange={e => setMemo(e.target.value)} placeholder="메모"
          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background placeholder:text-text-secondary/40"
        />

        <button
          onClick={handleSave} disabled={!canSave || saving}
          className="w-full py-2.5 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50"
        >
          {saving ? '저장 중...' : '기록 저장'}
        </button>
      </div>
    </div>
  )
}
```

**Step 2: 빌드 확인**

Run: `cd /Users/chacha/lab/ddodun/app && npx next build`

**Step 3: Commit**

```bash
git add app/src/components/pr/WodRecordModal.tsx
git commit -m "feat: add WOD record input modal"
```

---

### Task 5: WOD 히스토리 모달

**Files:**
- Create: `app/src/components/pr/WodHistoryModal.tsx`

WOD 이름을 탭하면 열리는 히스토리 모달. 전체 기록 목록 + PR 하이라이트 + 삭제.

**Step 1: WodHistoryModal 컴포넌트 작성**

```tsx
'use client'

import { Trash2, Trophy } from 'lucide-react'
import type { WodRecord, ScoreType } from '@/lib/api/wod'

interface WodHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: () => void
  onDelete: (id: string) => void
  wodName: string
  description?: string
  records: WodRecord[]
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatScore(record: WodRecord): string {
  if (record.score_type === 'time' && record.time_seconds != null) {
    return formatTime(record.time_seconds)
  }
  if (record.score_type === 'amrap') {
    const r = record.rounds ?? 0
    const er = record.extra_reps ?? 0
    return er > 0 ? `${r}+${er}` : `${r} rds`
  }
  if (record.score_type === 'reps' && record.reps != null) {
    return `${record.reps} reps`
  }
  return '—'
}

function findPrId(records: WodRecord[]): string | null {
  if (records.length === 0) return null
  const scoreType = records[0].score_type
  let best: WodRecord | null = null
  for (const r of records) {
    if (!best) { best = r; continue }
    if (scoreType === 'time') {
      if (r.time_seconds != null && (best.time_seconds == null || r.time_seconds < best.time_seconds)) best = r
    } else if (scoreType === 'amrap') {
      const rScore = (r.rounds ?? 0) * 1000 + (r.extra_reps ?? 0)
      const bScore = (best.rounds ?? 0) * 1000 + (best.extra_reps ?? 0)
      if (rScore > bScore) best = r
    } else {
      if ((r.reps ?? 0) > (best.reps ?? 0)) best = r
    }
  }
  return best?.id ?? null
}

export default function WodHistoryModal({
  isOpen, onClose, onAdd, onDelete, wodName, description, records,
}: WodHistoryModalProps) {
  if (!isOpen) return null

  const prId = findPrId(records)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg bg-surface rounded-t-2xl p-5 space-y-3 max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div>
          <h3 className="font-bold text-base">{wodName}</h3>
          {description && <p className="text-xs text-text-secondary mt-0.5">{description}</p>}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {records.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-4">아직 기록이 없습니다</p>
          ) : (
            records.map(r => (
              <div key={r.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                r.id === prId ? 'border-accent/50 bg-accent/5' : 'border-border'
              }`}>
                {r.id === prId && <Trophy size={14} className="text-accent shrink-0" />}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold">{formatScore(r)}</span>
                  <span className="text-xs text-text-secondary ml-2">{r.recorded_at}</span>
                  {r.memo && <p className="text-[10px] text-text-secondary truncate">{r.memo}</p>}
                </div>
                <button onClick={() => onDelete(r.id)} className="text-text-secondary/50 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onAdd}
          className="w-full py-2.5 rounded-lg bg-accent text-white text-sm font-medium"
        >
          기록 추가
        </button>
      </div>
    </div>
  )
}
```

**Step 2: 빌드 확인**

Run: `cd /Users/chacha/lab/ddodun/app && npx next build`

**Step 3: Commit**

```bash
git add app/src/components/pr/WodHistoryModal.tsx
git commit -m "feat: add WOD history modal with PR highlight"
```

---

### Task 6: WOD 탭 + Open WOD 추가 모달 통합

**Files:**
- Create: `app/src/components/pr/WodTab.tsx`
- Create: `app/src/components/pr/OpenWodAddModal.tsx`

WOD 탭 전체 UI. Named WOD 그리드 + Open WOD 리스트 + 모달 연결.

**Step 1: OpenWodAddModal 작성**

Open WOD 추가 시 이름(예: "25.1")과 결과타입을 입력받는 간단한 모달.

```tsx
'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { ScoreType } from '@/lib/api/wod'

interface OpenWodAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (wodName: string, scoreType: ScoreType) => void
}

export default function OpenWodAddModal({ isOpen, onClose, onSave }: OpenWodAddModalProps) {
  const [name, setName] = useState('')
  const [scoreType, setScoreType] = useState<ScoreType>('time')

  if (!isOpen) return null

  function handleSave() {
    if (!name.trim()) return
    onSave(name.trim(), scoreType)
    setName('')
    setScoreType('time')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-lg bg-surface rounded-t-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base">Open WOD 추가</h3>
          <button onClick={onClose} className="p-1 text-text-secondary"><X size={18} /></button>
        </div>
        <input
          type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="WOD 이름 (예: 25.1)"
          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background placeholder:text-text-secondary/40"
        />
        <div className="flex gap-2">
          {(['time', 'amrap', 'reps'] as const).map(t => (
            <button
              key={t}
              onClick={() => setScoreType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                scoreType === t ? 'bg-accent text-white' : 'bg-background border border-border text-text-secondary'
              }`}
            >
              {t === 'time' ? 'For Time' : t === 'amrap' ? 'AMRAP' : 'Reps'}
            </button>
          ))}
        </div>
        <button
          onClick={handleSave} disabled={!name.trim()}
          className="w-full py-2.5 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50"
        >
          추가
        </button>
      </div>
    </div>
  )
}
```

**Step 2: WodTab 컴포넌트 작성**

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import {
  getAllWodRecords, getWodRecords, createWodRecord, deleteWodRecord,
  NAMED_WOD_PRESETS, type WodRecord, type ScoreType,
} from '@/lib/api/wod'
import WodRecordModal from './WodRecordModal'
import WodHistoryModal from './WodHistoryModal'
import OpenWodAddModal from './OpenWodAddModal'

interface WodTabProps {
  userId: string
}

function formatBestScore(records: WodRecord[]): string | null {
  if (records.length === 0) return null
  const type = records[0].score_type
  if (type === 'time') {
    const best = records.reduce((min, r) =>
      r.time_seconds != null && (min == null || r.time_seconds < min) ? r.time_seconds : min,
      null as number | null
    )
    if (best == null) return null
    return `${Math.floor(best / 60)}:${String(best % 60).padStart(2, '0')}`
  }
  if (type === 'amrap') {
    let bestR = 0, bestE = 0
    for (const r of records) {
      const score = (r.rounds ?? 0) * 1000 + (r.extra_reps ?? 0)
      if (score > bestR * 1000 + bestE) { bestR = r.rounds ?? 0; bestE = r.extra_reps ?? 0 }
    }
    return bestE > 0 ? `${bestR}+${bestE}` : `${bestR} rds`
  }
  const best = records.reduce((max, r) => (r.reps ?? 0) > max ? (r.reps ?? 0) : max, 0)
  return best > 0 ? `${best} reps` : null
}

export default function WodTab({ userId }: WodTabProps) {
  const [allRecords, setAllRecords] = useState<WodRecord[]>([])
  const [historyRecords, setHistoryRecords] = useState<WodRecord[]>([])
  // Modal states
  const [selectedWod, setSelectedWod] = useState<{ name: string; description?: string; scoreType: ScoreType; wodType: 'named' | 'open' } | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [recordModalOpen, setRecordModalOpen] = useState(false)
  const [openAddOpen, setOpenAddOpen] = useState(false)
  const [namedAddOpen, setNamedAddOpen] = useState(false)
  // Custom named WOD add
  const [customName, setCustomName] = useState('')
  const [customScoreType, setCustomScoreType] = useState<ScoreType>('time')

  const loadAll = useCallback(async () => {
    if (!userId) return
    try {
      const data = await getAllWodRecords(userId)
      setAllRecords(data)
    } catch (err) {
      console.error('Failed to load WOD records:', err)
    }
  }, [userId])

  useEffect(() => { loadAll() }, [loadAll])

  // Group records by wod_name
  const recordsByName = allRecords.reduce<Record<string, WodRecord[]>>((acc, r) => {
    if (!acc[r.wod_name]) acc[r.wod_name] = []
    acc[r.wod_name].push(r)
    return acc
  }, {})

  // Open WODs = records where wod_type === 'open', unique names
  const openWodNames = [...new Set(allRecords.filter(r => r.wod_type === 'open').map(r => r.wod_name))]

  // Custom named WODs = named records not in presets
  const presetNames = new Set(NAMED_WOD_PRESETS.map(p => p.name))
  const customNamedWods = [...new Set(
    allRecords.filter(r => r.wod_type === 'named' && !presetNames.has(r.wod_name)).map(r => r.wod_name)
  )]

  async function openHistory(name: string, description: string | undefined, scoreType: ScoreType, wodType: 'named' | 'open') {
    setSelectedWod({ name, description, scoreType, wodType })
    try {
      const recs = await getWodRecords(userId, name)
      setHistoryRecords(recs)
    } catch { setHistoryRecords([]) }
    setHistoryOpen(true)
  }

  function openRecordModal() {
    setHistoryOpen(false)
    setRecordModalOpen(true)
  }

  async function handleSaveRecord(data: {
    score_type: ScoreType; time_seconds: number | null; rounds: number | null;
    extra_reps: number | null; reps: number | null; memo: string | null; recorded_at: string
  }) {
    if (!selectedWod) return
    await createWodRecord(userId, {
      wod_type: selectedWod.wodType,
      wod_name: selectedWod.name,
      ...data,
    })
    setRecordModalOpen(false)
    loadAll()
    // Reopen history
    const recs = await getWodRecords(userId, selectedWod.name)
    setHistoryRecords(recs)
    setHistoryOpen(true)
  }

  async function handleDelete(id: string) {
    await deleteWodRecord(id)
    loadAll()
    if (selectedWod) {
      const recs = await getWodRecords(userId, selectedWod.name)
      setHistoryRecords(recs)
    }
  }

  function handleOpenWodAdd(wodName: string, scoreType: ScoreType) {
    setOpenAddOpen(false)
    setSelectedWod({ name: wodName, scoreType, wodType: 'open' })
    setRecordModalOpen(true)
  }

  function handleNamedCustomAdd() {
    if (!customName.trim()) return
    setNamedAddOpen(false)
    setSelectedWod({ name: customName.trim(), scoreType: customScoreType, wodType: 'named' })
    setCustomName('')
    setCustomScoreType('time')
    setRecordModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Named WOD */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Named WOD</h2>
          <button onClick={() => setNamedAddOpen(true)} className="text-sm text-accent font-medium flex items-center gap-0.5">
            <Plus size={16} /> 추가
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[...NAMED_WOD_PRESETS.map(p => ({ name: p.name, desc: p.description, scoreType: p.scoreType })),
            ...customNamedWods.map(name => {
              const rec = allRecords.find(r => r.wod_name === name)
              return { name, desc: undefined, scoreType: (rec?.score_type ?? 'time') as ScoreType }
            })
          ].map(wod => {
            const recs = recordsByName[wod.name] || []
            const best = formatBestScore(recs)
            const hasRecord = recs.length > 0
            return (
              <button
                key={wod.name}
                onClick={() => openHistory(wod.name, wod.desc, wod.scoreType, 'named')}
                className={`rounded-lg border py-2.5 px-2 text-center transition-colors ${
                  hasRecord ? 'border-accent/50 bg-accent/5' : 'border-border bg-background'
                }`}
              >
                <p className={`text-sm font-bold ${hasRecord ? 'text-accent' : ''}`}>{wod.name}</p>
                {best && <p className="text-xs text-text-secondary mt-0.5">{best}</p>}
                {!best && <p className="text-[10px] text-text-secondary/40 mt-0.5">—</p>}
              </button>
            )
          })}
        </div>
      </section>

      {/* Open WOD */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Open WOD</h2>
          <button onClick={() => setOpenAddOpen(true)} className="text-sm text-accent font-medium flex items-center gap-0.5">
            <Plus size={16} /> 추가
          </button>
        </div>
        {openWodNames.length === 0 ? (
          <div className="bg-surface rounded-lg border border-border p-6 text-center text-text-secondary text-sm">
            아직 등록된 Open WOD가 없습니다
          </div>
        ) : (
          <div className="space-y-1.5">
            {openWodNames.sort().map(name => {
              const recs = recordsByName[name] || []
              const best = formatBestScore(recs)
              const scoreType = recs[0]?.score_type as ScoreType ?? 'time'
              return (
                <button
                  key={name}
                  onClick={() => openHistory(name, undefined, scoreType, 'open')}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-surface"
                >
                  <span className="text-sm font-bold">{name}</span>
                  <span className="text-sm text-text-secondary">{best || '—'}</span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Named WOD custom add modal (inline simple) */}
      {namedAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setNamedAddOpen(false)}>
          <div className="w-full max-w-lg bg-surface rounded-t-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-base">Named WOD 추가</h3>
            <input
              type="text" value={customName} onChange={e => setCustomName(e.target.value)}
              placeholder="WOD 이름"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background placeholder:text-text-secondary/40"
            />
            <div className="flex gap-2">
              {(['time', 'amrap', 'reps'] as const).map(t => (
                <button key={t} onClick={() => setCustomScoreType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    customScoreType === t ? 'bg-accent text-white' : 'bg-background border border-border text-text-secondary'
                  }`}>
                  {t === 'time' ? 'For Time' : t === 'amrap' ? 'AMRAP' : 'Reps'}
                </button>
              ))}
            </div>
            <button onClick={handleNamedCustomAdd} disabled={!customName.trim()}
              className="w-full py-2.5 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50">
              추가 후 기록 입력
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <WodHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onAdd={openRecordModal}
        onDelete={handleDelete}
        wodName={selectedWod?.name || ''}
        description={selectedWod?.description}
        records={historyRecords}
      />
      <WodRecordModal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        onSave={handleSaveRecord}
        wodName={selectedWod?.name || ''}
        description={selectedWod?.description}
        defaultScoreType={selectedWod?.scoreType || 'time'}
        allowScoreTypeChange={selectedWod?.wodType === 'open'}
      />
      <OpenWodAddModal
        isOpen={openAddOpen}
        onClose={() => setOpenAddOpen(false)}
        onSave={handleOpenWodAdd}
      />
    </div>
  )
}
```

**Step 3: 빌드 확인**

Run: `cd /Users/chacha/lab/ddodun/app && npx next build`

**Step 4: Commit**

```bash
git add app/src/components/pr/WodTab.tsx app/src/components/pr/OpenWodAddModal.tsx
git commit -m "feat: add WOD tab with Named/Open sections"
```

---

### Task 7: PR 페이지에 WOD 탭 연결

**Files:**
- Modify: `app/src/app/pr/page.tsx`

기존 placeholder를 WodTab 컴포넌트로 교체한다.

**Step 1: WodTab import 및 연결**

```tsx
// import 추가
import WodTab from '@/components/pr/WodTab'

// activeTab === 'wod' 분기에서 placeholder 대신:
<WodTab userId={userId} />
```

**Step 2: 빌드 확인**

Run: `cd /Users/chacha/lab/ddodun/app && npx next build`

**Step 3: Commit**

```bash
git add app/src/app/pr/page.tsx
git commit -m "feat: integrate WOD tab into PR page"
```

---

### Task 8: 통합 테스트 및 최종 확인

**Step 1: 로컬 dev 서버에서 전체 플로우 확인**
- PR 탭 → 기록/WOD 서브탭 전환
- Named WOD 그리드 표시
- Named WOD 탭 → 히스토리 모달 → 기록 추가 → 저장 → 히스토리에 표시
- Open WOD 추가 → 기록 입력 → 저장
- PR 하이라이트 확인 (여러 기록 입력 후 최고기록에 트로피)
- 삭제 확인
- 커스텀 Named WOD 추가 확인

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: benchmark WOD record tracking (Named + Open)"
```
