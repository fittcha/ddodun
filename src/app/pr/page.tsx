'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  getAll1RM, upsert1RM, delete1RM, type OneRM,
  getAllNRM, upsertNRM, deleteNRM, type NRM,
  getAllPaceRecords, upsertPaceRecord, deletePaceRecord, type PaceRecord,
} from '@/lib/api/pr'
import { getExerciseIcon, getEquipmentIcon } from '@/components/pr/ExerciseIcons'
import NrmAddModal from '@/components/pr/NrmAddModal'
import PaceAddModal from '@/components/pr/PaceAddModal'
import WodTab from '@/components/pr/WodTab'
import { getLoggedInUser } from '@/lib/auth'

const DEFAULT_1RM = [
  { name: 'Back Squat', label: '백스쿼트' },
  { name: 'Front Squat', label: '프론트스쿼트' },
  { name: 'Deadlift', label: '데드리프트' },
  { name: 'Bench Press', label: '벤치프레스' },
  { name: 'Shoulder Press', label: '숄더프레스' },
  { name: 'Push Press', label: '푸시프레스' },
  { name: 'Clean', label: '클린' },
  { name: 'Power Clean', label: '파워클린' },
  { name: 'Clean & Jerk', label: '클린앤저크' },
  { name: 'Push Jerk', label: '푸시저크' },
  { name: 'Snatch', label: '스내치' },
  { name: 'Power Snatch', label: '파워스내치' },
]

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatPaceWithDecimal(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toFixed(1).padStart(4, '0')}`
}

function getPaceSplits(equipment: string, distance: string): number {
  if (equipment === 'Rowing') {
    // 500m splits
    const meters = parseInt(distance) * 1000
    return meters / 500
  }
  // Running: 1km splits
  const km = parseInt(distance)
  return km
}

function calcPace(equipment: string, distance: string, totalSeconds: number): string {
  const splits = getPaceSplits(equipment, distance)
  const paceSeconds = totalSeconds / splits
  const label = equipment === 'Rowing' ? '/500m' : '/km'
  return `${formatPaceWithDecimal(paceSeconds)}${label}`
}

export default function PRPage() {
  const [subTab, setSubTab] = useState<'records' | 'wod'>('records')
  const [records, setRecords] = useState<OneRM[]>([])
  const [nrmRecords, setNrmRecords] = useState<NRM[]>([])
  const [paceRecords, setPaceRecords] = useState<PaceRecord[]>([])
  const [nrmModalOpen, setNrmModalOpen] = useState(false)
  const [paceModalOpen, setPaceModalOpen] = useState(false)
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const userId = getLoggedInUser()?.id || ''

  const loadData = useCallback(async () => {
    if (!userId) return
    try {
      const [rm, nrm, pace] = await Promise.all([
        getAll1RM(userId),
        getAllNRM(userId),
        getAllPaceRecords(userId),
      ])
      setRecords(rm)
      setNrmRecords(nrm)
      setPaceRecords(pace)
    } catch (err) {
      console.error('Failed to load PR data:', err)
    }
  }, [userId])

  useEffect(() => { loadData() }, [loadData])

  function getWeight(exerciseName: string): string {
    const r = records.find(r => r.exercise_name === exerciseName)
    return r?.weight != null ? String(r.weight) : ''
  }

  function getUnit(exerciseName: string): string {
    const r = records.find(r => r.exercise_name === exerciseName)
    return r?.weight_unit || 'lb'
  }

  function handleWeightChange(exerciseName: string, value: string, unit: string) {
    setRecords(prev => {
      const idx = prev.findIndex(r => r.exercise_name === exerciseName)
      const weight = value ? parseFloat(value) : null
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], weight, weight_unit: unit }
        return next
      }
      return [...prev, { id: '', user_id: userId, exercise_name: exerciseName, weight, weight_unit: unit, updated_at: '' }]
    })

    const key = `1rm-${exerciseName}`
    const existing = debounceTimers.current.get(key)
    if (existing) clearTimeout(existing)
    debounceTimers.current.set(key, setTimeout(async () => {
      try {
        await upsert1RM(userId, exerciseName, value ? parseFloat(value) : null, unit)
      } catch (err) {
        console.error('Failed to save 1RM:', err)
      }
    }, 800))
  }

  async function handleNrmSave(exercise: string, repMax: number, weight: number, unit: string) {
    try {
      const saved = await upsertNRM(userId, exercise, repMax, weight, unit)
      setNrmModalOpen(false)
      setNrmRecords(prev => {
        const idx = prev.findIndex(r => r.id === saved.id)
        if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
        return [...prev, saved]
      })
    } catch (err) {
      console.error('Failed to save nRM:', err)
    }
  }

  async function handleNrmDelete(id: string) {
    try {
      await deleteNRM(id)
      setNrmRecords(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      console.error('Failed to delete nRM:', err)
    }
  }

  async function handlePaceSave(equipment: string, distance: string, timeSeconds: number) {
    try {
      const saved = await upsertPaceRecord(userId, equipment, distance, timeSeconds)
      setPaceModalOpen(false)
      setPaceRecords(prev => {
        const idx = prev.findIndex(r => r.id === saved.id)
        if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
        return [...prev, saved]
      })
    } catch (err) {
      console.error('Failed to save pace:', err)
    }
  }

  async function handlePaceDelete(id: string) {
    try {
      await deletePaceRecord(id)
      setPaceRecords(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      console.error('Failed to delete pace:', err)
    }
  }

  // Group nRM by rep_max
  const nrmGroups = nrmRecords.reduce<Record<number, NRM[]>>((acc, r) => {
    if (!acc[r.rep_max]) acc[r.rep_max] = []
    acc[r.rep_max].push(r)
    return acc
  }, {})

  // Group pace by equipment
  const paceGroups = paceRecords.reduce<Record<string, PaceRecord[]>>((acc, r) => {
    if (!acc[r.equipment]) acc[r.equipment] = []
    acc[r.equipment].push(r)
    return acc
  }, {})

  return (
    <div className="px-4 space-y-8">
      {/* Sub-tab navigation */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setSubTab('records')}
          className={`flex-1 pb-3 text-base font-bold text-center transition-colors ${
            subTab === 'records' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary'
          }`}
        >
          PR
        </button>
        <button
          onClick={() => setSubTab('wod')}
          className={`flex-1 pb-3 text-base font-bold text-center transition-colors ${
            subTab === 'wod' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary'
          }`}
        >
          WOD
        </button>
      </div>

      {subTab === 'records' && (<>
      {/* 1RM Section */}
      <section>
        <h2 className="text-lg font-bold mb-3">1RM</h2>
        <div className="grid grid-cols-4 gap-1.5">
          {DEFAULT_1RM.map(ex => {
            const Icon = getExerciseIcon(ex.label)
            const weight = getWeight(ex.name)
            const hasValue = weight !== ''
            return (
              <div
                key={ex.name}
                className={`relative rounded-lg border py-2 px-1 flex flex-col items-center gap-0.5 ${
                  hasValue ? 'border-accent/50 bg-accent/5' : 'border-border bg-background'
                }`}
              >
                <div className={hasValue ? 'text-accent' : 'text-foreground/65'}>
                  <Icon size={22} />
                </div>
                <span className={`text-[9px] leading-tight text-center ${hasValue ? 'text-accent font-medium' : 'text-text-secondary'}`}>{ex.label}</span>
                <div className="flex items-baseline justify-center">
                  <input
                    type="text"
                    inputMode="decimal"
                    maxLength={4}
                    placeholder="–"
                    value={weight}
                    onChange={e => {
                      const v = e.target.value
                      if (v === '' || /^\d*\.?\d*$/.test(v)) {
                        handleWeightChange(ex.name, v, getUnit(ex.name))
                      }
                    }}
                    className={`w-[2rem] py-0 text-xs text-center bg-transparent font-bold ${
                      hasValue ? 'text-foreground' : 'text-text-secondary/40'
                    }`}
                  />
                  <button
                    onClick={() => {
                      const current = getUnit(ex.name)
                      const next = current === 'lb' ? 'kg' : 'lb'
                      handleWeightChange(ex.name, weight, next)
                    }}
                    className="text-[9px] text-text-secondary active:text-accent"
                  >
                    {getUnit(ex.name)}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* nRM Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">nRM</h2>
          <button
            onClick={() => setNrmModalOpen(true)}
            className="text-sm text-accent font-medium flex items-center gap-0.5"
          >
            <Plus size={16} /> 추가
          </button>
        </div>

        {Object.keys(nrmGroups).length === 0 ? (
          <div className="bg-surface rounded-lg border border-border p-6 text-center text-text-secondary text-sm">
            아직 등록된 nRM이 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(nrmGroups)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([n, items]) => (
                <div key={n}>
                  <p className="text-sm font-bold text-accent mb-1.5">{n}RM</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map(item => (
                      <div key={item.id} className="bg-surface rounded-lg border border-border px-3 py-2 flex items-center gap-2">
                        <div>
                          <p className="text-sm font-medium">{item.exercise_name}</p>
                          <p className="text-xs text-text-secondary">
                            {item.weight}{item.weight_unit}
                          </p>
                        </div>
                        <button
                          onClick={() => handleNrmDelete(item.id)}
                          className="text-text-secondary p-0.5"
                          aria-label="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Pace Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">PACE</h2>
          <button
            onClick={() => setPaceModalOpen(true)}
            className="text-sm text-accent font-medium flex items-center gap-0.5"
          >
            <Plus size={16} /> 추가
          </button>
        </div>

        {Object.keys(paceGroups).length === 0 ? (
          <div className="bg-surface rounded-lg border border-border p-6 text-center text-text-secondary text-sm">
            아직 등록된 PACE이 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(paceGroups).map(([eq, items]) => {
              const EqIcon = getEquipmentIcon(eq)
              return (
              <div key={eq}>
                <p className="text-sm font-bold text-accent mb-1.5">{eq}</p>
                <div className="flex flex-wrap gap-2">
                  {items.map(item => {
                    const ItemIcon = getEquipmentIcon(item.equipment)
                    return (
                    <div key={item.id} className="bg-surface rounded-lg border border-border px-3 py-2 flex items-center gap-2">
                      {ItemIcon && <span className="text-accent"><ItemIcon size={20} /></span>}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.distance}</p>
                        {item.time_seconds != null ? (
                          <>
                            <p className="text-xs text-text-secondary">{formatTime(item.time_seconds)}</p>
                            <p className="text-[10px] text-accent font-medium">{calcPace(item.equipment, item.distance, item.time_seconds)}</p>
                          </>
                        ) : (
                          <p className="text-xs text-text-secondary">—</p>
                        )}
                      </div>
                      <button
                        onClick={() => handlePaceDelete(item.id)}
                        className="text-text-secondary p-0.5"
                        aria-label="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    )
                  })}
                </div>
              </div>
              )
            })}
          </div>
        )}
      </section>
      </>)}

      {subTab === 'wod' && (
        <WodTab userId={userId} />
      )}

      {/* Modals */}
      <NrmAddModal
        isOpen={nrmModalOpen}
        onClose={() => setNrmModalOpen(false)}
        onSave={handleNrmSave}
      />
      <PaceAddModal
        isOpen={paceModalOpen}
        onClose={() => setPaceModalOpen(false)}
        onSave={handlePaceSave}
      />
    </div>
  )
}
