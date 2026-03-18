'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import {
  getAllWodRecords,
  getWodRecords,
  createWodRecord,
  deleteWodRecord,
  NAMED_WOD_PRESETS,
} from '@/lib/api/wod'
import type { WodRecord, ScoreType } from '@/lib/api/wod'
import WodRecordModal from './WodRecordModal'
import WodHistoryModal from './WodHistoryModal'
import OpenWodAddModal from './OpenWodAddModal'

interface WodTabProps {
  userId: string
}

interface SelectedWod {
  name: string
  description?: string
  scoreType: ScoreType
  wodType: 'named' | 'open'
}

const SCORE_TYPE_LABELS: Record<ScoreType, string> = {
  time: 'For Time',
  amrap: 'AMRAP',
  reps: 'Reps',
}

function formatBestScore(records: WodRecord[]): string {
  if (records.length === 0) return '—'

  const scoreType = records[0].score_type

  switch (scoreType) {
    case 'time': {
      let best = Infinity
      for (const r of records) {
        if (r.time_seconds != null && r.time_seconds < best) best = r.time_seconds
      }
      if (best === Infinity) return '—'
      const m = Math.floor(best / 60)
      const s = best % 60
      return `${m}:${s.toString().padStart(2, '0')}`
    }
    case 'amrap': {
      let bestVal = -1
      let bestRecord: WodRecord | null = null
      for (const r of records) {
        if (r.rounds == null) continue
        const val = r.rounds * 1000 + (r.extra_reps ?? 0)
        if (val > bestVal) {
          bestVal = val
          bestRecord = r
        }
      }
      if (!bestRecord || bestRecord.rounds == null) return '—'
      return bestRecord.extra_reps
        ? `${bestRecord.rounds}+${bestRecord.extra_reps}`
        : `${bestRecord.rounds} rds`
    }
    case 'reps': {
      let best = -1
      for (const r of records) {
        if (r.reps != null && r.reps > best) best = r.reps
      }
      return best >= 0 ? `${best} reps` : '—'
    }
    default:
      return '—'
  }
}

export default function WodTab({ userId }: WodTabProps) {
  const [allRecords, setAllRecords] = useState<WodRecord[]>([])
  const [historyRecords, setHistoryRecords] = useState<WodRecord[]>([])
  const [selectedWod, setSelectedWod] = useState<SelectedWod | null>(null)

  // Modal states
  const [historyOpen, setHistoryOpen] = useState(false)
  const [recordModalOpen, setRecordModalOpen] = useState(false)
  const [openAddOpen, setOpenAddOpen] = useState(false)
  const [namedAddOpen, setNamedAddOpen] = useState(false)

  // Custom named add form
  const [customName, setCustomName] = useState('')
  const [customScoreType, setCustomScoreType] = useState<ScoreType>('time')

  const loadAllRecords = useCallback(async () => {
    try {
      const records = await getAllWodRecords(userId)
      setAllRecords(records)
    } catch (err) {
      console.error('Failed to load WOD records:', err)
    }
  }, [userId])

  useEffect(() => {
    loadAllRecords()
  }, [loadAllRecords])

  // Group records by wod_name
  const recordsByName: Record<string, WodRecord[]> = {}
  for (const r of allRecords) {
    if (!recordsByName[r.wod_name]) recordsByName[r.wod_name] = []
    recordsByName[r.wod_name].push(r)
  }

  // Preset names set
  const presetNames = new Set(NAMED_WOD_PRESETS.map(p => p.name))

  // Custom Named WODs (wod_type === 'named' and not in presets)
  const customNamedWods: { name: string; scoreType: ScoreType }[] = []
  const seenCustom = new Set<string>()
  for (const r of allRecords) {
    if (r.wod_type === 'named' && !presetNames.has(r.wod_name) && !seenCustom.has(r.wod_name)) {
      seenCustom.add(r.wod_name)
      customNamedWods.push({ name: r.wod_name, scoreType: r.score_type })
    }
  }

  // Open WODs
  const openWods: { name: string; scoreType: ScoreType }[] = []
  const seenOpen = new Set<string>()
  for (const r of allRecords) {
    if (r.wod_type === 'open' && !seenOpen.has(r.wod_name)) {
      seenOpen.add(r.wod_name)
      openWods.push({ name: r.wod_name, scoreType: r.score_type })
    }
  }

  // --- Handlers ---

  async function handleTapWod(wod: SelectedWod) {
    setSelectedWod(wod)
    try {
      const records = await getWodRecords(userId, wod.name)
      setHistoryRecords(records)
      setHistoryOpen(true)
    } catch (err) {
      console.error('Failed to load WOD history:', err)
    }
  }

  function handleHistoryAdd() {
    setHistoryOpen(false)
    setRecordModalOpen(true)
  }

  async function handleHistoryDelete(id: string) {
    try {
      await deleteWodRecord(id)
      await loadAllRecords()
      if (selectedWod) {
        const records = await getWodRecords(userId, selectedWod.name)
        setHistoryRecords(records)
      }
    } catch (err) {
      console.error('Failed to delete record:', err)
    }
  }

  async function handleRecordSave(data: {
    score_type: ScoreType
    time_seconds: number | null
    rounds: number | null
    extra_reps: number | null
    reps: number | null
    memo: string | null
    recorded_at: string
  }) {
    if (!selectedWod) return
    try {
      await createWodRecord(userId, {
        wod_type: selectedWod.wodType,
        wod_name: selectedWod.name,
        ...data,
      })
      setRecordModalOpen(false)
      await loadAllRecords()
      // Reopen history
      const records = await getWodRecords(userId, selectedWod.name)
      setHistoryRecords(records)
      setHistoryOpen(true)
    } catch (err) {
      console.error('Failed to save record:', err)
    }
  }

  function handleOpenWodAdd(wodName: string, scoreType: ScoreType) {
    setOpenAddOpen(false)
    setSelectedWod({ name: wodName, scoreType, wodType: 'open' })
    setRecordModalOpen(true)
  }

  function handleNamedAddSubmit() {
    const trimmed = customName.trim()
    if (!trimmed) return
    setNamedAddOpen(false)
    setSelectedWod({ name: trimmed, scoreType: customScoreType, wodType: 'named' })
    setCustomName('')
    setCustomScoreType('time')
    setRecordModalOpen(true)
  }

  // --- All named WODs: presets + custom ---
  const allNamedWods: { name: string; description?: string; scoreType: ScoreType }[] = [
    ...NAMED_WOD_PRESETS.map(p => ({ name: p.name, description: p.description, scoreType: p.scoreType })),
    ...customNamedWods,
  ]

  return (
    <div className="space-y-6">
      {/* Named WOD Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold">Named WOD</h3>
          <button
            onClick={() => setNamedAddOpen(true)}
            className="flex items-center gap-1 text-sm text-accent font-medium"
          >
            <Plus size={16} />
            추가
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {allNamedWods.map(wod => {
            const records = recordsByName[wod.name] || []
            const hasRecords = records.length > 0
            return (
              <button
                key={wod.name}
                onClick={() => handleTapWod({
                  name: wod.name,
                  description: wod.description,
                  scoreType: wod.scoreType,
                  wodType: 'named',
                })}
                className={`p-3 rounded-lg text-left border ${
                  hasRecords
                    ? 'border-accent/50 bg-accent/5'
                    : 'border-border bg-background'
                }`}
              >
                <div className="font-bold text-sm truncate">{wod.name}</div>
                <div className="text-xs text-text-secondary mt-0.5">
                  {formatBestScore(records)}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Open WOD Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold">Open WOD</h3>
          <button
            onClick={() => setOpenAddOpen(true)}
            className="flex items-center gap-1 text-sm text-accent font-medium"
          >
            <Plus size={16} />
            추가
          </button>
        </div>

        {openWods.length === 0 ? (
          <p className="text-center text-text-secondary text-sm py-6">
            아직 등록된 Open WOD가 없습니다
          </p>
        ) : (
          <div className="space-y-2">
            {openWods.map(wod => {
              const records = recordsByName[wod.name] || []
              return (
                <button
                  key={wod.name}
                  onClick={() => handleTapWod({
                    name: wod.name,
                    scoreType: wod.scoreType,
                    wodType: 'open',
                  })}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-background"
                >
                  <span className="font-bold text-sm">{wod.name}</span>
                  <span className="text-sm text-text-secondary">
                    {formatBestScore(records)}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Named WOD Add Modal (inline) */}
      {namedAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setNamedAddOpen(false)} />
          <div className="relative w-full max-w-lg bg-surface rounded-t-2xl p-6 pb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Named WOD 추가</h3>
              <button onClick={() => setNamedAddOpen(false)} className="p-1 text-text-secondary" aria-label="닫기">
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="WOD 이름"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex gap-2 mb-6">
              {(['time', 'amrap', 'reps'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCustomScoreType(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    customScoreType === t
                      ? 'bg-accent text-white'
                      : 'bg-background border border-border text-foreground'
                  }`}
                >
                  {SCORE_TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            <button
              onClick={handleNamedAddSubmit}
              disabled={!customName.trim()}
              className="w-full py-2.5 rounded-lg bg-accent text-white font-medium disabled:opacity-50"
            >
              추가 후 기록 입력
            </button>
          </div>
        </div>
      )}

      {/* Open WOD Add Modal */}
      <OpenWodAddModal
        isOpen={openAddOpen}
        onClose={() => setOpenAddOpen(false)}
        onSave={handleOpenWodAdd}
      />

      {/* History Modal */}
      <WodHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onAdd={handleHistoryAdd}
        onDelete={handleHistoryDelete}
        wodName={selectedWod?.name || ''}
        description={selectedWod?.description}
        records={historyRecords}
      />

      {/* Record Modal */}
      <WodRecordModal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        onSave={handleRecordSave}
        wodName={selectedWod?.name || ''}
        description={selectedWod?.description}
        defaultScoreType={selectedWod?.scoreType || 'time'}
        allowScoreTypeChange={false}
      />
    </div>
  )
}
