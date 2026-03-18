'use client'

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react'
import WorkoutSection from '@/components/workout/WorkoutSection'
import CustomWorkoutForm from '@/components/workout/CustomWorkoutForm'
import Calculator from '@/components/workout/Calculator'
import { getTemplatesByDate, getTemplateDatesByRange, type WorkoutTemplate } from '@/lib/api/workout-templates'
import { getLogsByDate, type WorkoutLog } from '@/lib/api/workout-logs'
import { getCompetitionByDate, type Competition } from '@/lib/api/competitions'
import { getToday, getWeekDays, DAY_LABELS } from '@/lib/date-utils'
import { getLoggedInUser } from '@/lib/auth'

function WorkoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date') || getToday()
  const [date, setDate] = useState(dateParam)
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [customLogs, setCustomLogs] = useState<WorkoutLog[]>([])
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [weekTemplateDates, setWeekTemplateDates] = useState<Set<string>>(new Set())
  const [calcOpen, setCalcOpen] = useState(false)
  const userId = getLoggedInUser()?.id || ''

  const weekDays = getWeekDays(date)

  // Load week template dates when week changes
  useEffect(() => {
    const wd = getWeekDays(date)
    getTemplateDatesByRange(wd[0], wd[6]).then(dates => {
      setWeekTemplateDates(new Set(dates))
    }).catch(() => {})
  }, [weekDays[0]]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = useCallback(async () => {
    try {
      const [tpls, lgs, comp] = await Promise.all([
        getTemplatesByDate(date),
        getLogsByDate(userId, date),
        getCompetitionByDate(userId, date),
      ])
      setTemplates(tpls)
      const templateLogs = lgs.filter(l => !l.is_custom)
      const custom = lgs.filter(l => l.is_custom)
      setLogs(templateLogs)
      setCustomLogs(custom)
      setCompetition(comp)
    } catch (err) {
      console.error('Failed to load workout data:', err)
      setTemplates([])
      setLogs([])
      setCustomLogs([])
      setCompetition(null)
    }
  }, [date])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setDate(dateParam)
  }, [dateParam])

  function selectDate(newDate: string) {
    setDate(newDate)
    router.replace(`/workout?date=${newDate}`, { scroll: false })
  }

  function navigateWeek(offset: number) {
    const current = new Date(date + 'T00:00:00')
    current.setDate(current.getDate() + offset * 7)
    const y = current.getFullYear()
    const m = String(current.getMonth() + 1).padStart(2, '0')
    const d = String(current.getDate()).padStart(2, '0')
    selectDate(`${y}-${m}-${d}`)
  }

  const handleLogUpdate = useCallback((updated: WorkoutLog) => {
    setLogs(prev => {
      const idx = prev.findIndex(l => l.id === updated.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = updated
        return next
      }
      return [...prev, updated]
    })
  }, [])

  function handleCustomAdd(log: WorkoutLog) {
    setCustomLogs(prev => [...prev, log])
  }

  // Group templates by section (preserve order) — memoized
  const sections = useMemo(() => {
    const result: { section: string; templates: WorkoutTemplate[] }[] = []
    const map = new Map<string, WorkoutTemplate[]>()
    for (const t of templates) {
      if (!map.has(t.section)) {
        const items: WorkoutTemplate[] = []
        map.set(t.section, items)
        result.push({ section: t.section, templates: items })
      }
      map.get(t.section)!.push(t)
    }
    return result
  }, [templates])

  // Pre-compute logs per section — stable references prevent child re-renders
  const sectionLogs = useMemo(() => {
    const result = new Map<string, WorkoutLog[]>()
    for (const { section, templates: tpls } of sections) {
      const ids = new Set(tpls.map(t => t.id))
      result.set(section, logs.filter(l => l.template_id && ids.has(l.template_id)))
    }
    return result
  }, [sections, logs])

  // Progress
  const totalSections = sections.length
  const completedSections = sections.filter(s => {
    const sLogs = sectionLogs.get(s.section) || []
    return s.templates.length > 0 && s.templates.every(t => sLogs.find(l => l.template_id === t.id)?.completed)
  }).length

  const dateInputRef = useRef<HTMLInputElement>(null)
  const today = getToday()
  const displayMonth = parseInt(date.slice(5, 7))
  const displayYear = parseInt(date.slice(0, 4))

  return (
    <div className="space-y-4">
      {/* Week strip navigation */}
      <div>
        <div className="flex items-center justify-center mb-3 relative">
          <button
            onClick={() => dateInputRef.current?.showPicker()}
            className="text-sm font-bold"
          >
            {displayYear !== new Date().getFullYear() ? `${displayYear}년 ` : ''}{displayMonth}월
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={date}
            onChange={e => { if (e.target.value) selectDate(e.target.value) }}
            className="absolute inset-0 opacity-0 w-0 h-0"
            tabIndex={-1}
          />
        </div>

        <div className="flex items-center gap-1 px-[5%]">
          <button onClick={() => navigateWeek(-1)} className="p-1 text-text-secondary" aria-label="이전 주">
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1 grid grid-cols-7 gap-0.5">
            {weekDays.map((d, i) => {
              const dayNum = parseInt(d.slice(8, 10))
              const isSelected = d === date
              const isToday = d === today
              const isWeekend = i >= 5
              const hasTemplate = weekTemplateDates.has(d)
              return (
                <button
                  key={d}
                  onClick={() => selectDate(d)}
                  className={`flex flex-col items-center py-1 rounded-md transition-colors ${
                    isSelected
                      ? 'bg-accent text-white'
                      : isToday
                        ? 'bg-accent/10'
                        : hasTemplate
                          ? 'border border-border'
                          : ''
                  }`}
                >
                  <span className={`text-[10px] ${
                    isSelected ? 'text-white/70' : i === 5 ? 'text-success/60' : i === 6 ? 'text-danger/60' : 'text-text-secondary'
                  }`}>
                    {DAY_LABELS[i]}
                  </span>
                  <span className={`text-sm font-bold ${
                    isSelected ? 'text-white' : isToday ? 'text-accent' : ''
                  }`}>
                    {dayNum}
                  </span>
                </button>
              )
            })}
          </div>
          <button onClick={() => navigateWeek(1)} className="p-1 text-text-secondary" aria-label="다음 주">
            <ChevronRight size={16} />
          </button>
        </div>
        {/* Progress */}
        {totalSections > 0 && (
          <div className="text-[10px] text-text-secondary text-right mt-1">
            {completedSections}/{totalSections}
          </div>
        )}
      </div>

      {/* Competition card */}
      {competition && (
        <div className="bg-danger/10 rounded-lg border border-danger/30 p-3 flex items-start gap-2">
          <Trophy size={16} className="text-danger shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">{competition.name}</p>
            {competition.team_name && (
              <p className="text-xs text-text-secondary">팀: {competition.team_name}</p>
            )}
            {competition.team_members && (
              <p className="text-xs text-text-secondary">팀원: {competition.team_members}</p>
            )}
            {competition.notes && (
              <p className="text-xs text-text-secondary mt-1">{competition.notes}</p>
            )}
          </div>
        </div>
      )}

      {/* Workout sections */}
      {sections.length > 0 ? (
        sections.map(({ section, templates: sectionTemplates }) => (
          <WorkoutSection
            key={section}
            userId={userId}
            section={section}
            templates={sectionTemplates}
            logs={sectionLogs.get(section) || []}
            date={date}
            onLogUpdate={handleLogUpdate}
          />
        ))
      ) : (
        <div className="bg-surface rounded-lg border border-border p-6 text-center text-text-secondary text-sm">
          등록된 운동이 없습니다
        </div>
      )}

      {/* Custom workout logs */}
      {customLogs.length > 0 && (
        <div className="bg-surface border border-accent/20 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-accent-light border-b border-accent/20">
            <span className="text-xs font-bold text-accent">개인 추가 운동</span>
          </div>
          <div className="divide-y divide-border">
            {customLogs.map(log => (
              <div key={log.id} className="flex items-center gap-3 px-4 py-3">
                <span className="font-medium text-sm text-accent">{log.exercise_name}</span>
                {log.result_value && (
                  <span className="text-sm text-text-secondary">{log.result_value}</span>
                )}
                {log.memo && (
                  <span className="text-xs text-text-secondary">{log.memo}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add custom workout */}
      <CustomWorkoutForm userId={userId} date={date} onAdd={handleCustomAdd} />

      {/* Calculator panel */}
      {calcOpen && (
        <>
        <div className="fixed inset-0 z-[55] bg-black/20" onClick={() => setCalcOpen(false)} />
        <div className="fixed bottom-[4rem] left-3 right-3 z-[60] bg-surface border border-border rounded-2xl shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-1">
            <div className="flex-1 min-w-0">
              <Calculator userId={userId} />
            </div>
            <button
              onClick={() => setCalcOpen(false)}
              className="w-6 h-6 flex items-center justify-center text-text-secondary flex-shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        </>
      )}

      {/* Floating calculator button */}
      {!calcOpen && (
        <button
          onClick={() => setCalcOpen(true)}
          className="fixed bottom-20 right-4 w-10 h-10 rounded-full bg-transparent border-2 border-accent text-accent shadow-lg flex items-center justify-center z-40 active:bg-accent/10"
          title="계산기"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <line x1="8" y1="10" x2="8" y2="10.01" />
            <line x1="12" y1="10" x2="12" y2="10.01" />
            <line x1="16" y1="10" x2="16" y2="10.01" />
            <line x1="8" y1="14" x2="8" y2="14.01" />
            <line x1="12" y1="14" x2="12" y2="14.01" />
            <line x1="16" y1="14" x2="16" y2="14.01" />
            <line x1="8" y1="18" x2="8" y2="18.01" />
            <line x1="12" y1="18" x2="16" y2="18" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default function WorkoutPage() {
  return (
    <Suspense fallback={<div className="text-center text-text-secondary py-8">로딩 중...</div>}>
      <WorkoutContent />
    </Suspense>
  )
}
