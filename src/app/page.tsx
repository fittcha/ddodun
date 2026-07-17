'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trophy } from 'lucide-react'
import Calendar from '@/components/calendar/Calendar'
import CompetitionModal from '@/components/calendar/CompetitionModal'
import { getTemplateDatesByMonth, getTemplatesByDate, getExtraTemplatesByDate, type WorkoutTemplate } from '@/lib/api/workout-templates'
import { getLogDatesByMonth, getLogsByDate, type WorkoutLog } from '@/lib/api/workout-logs'
import {
  getCompetitionsByMonth,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  type Competition,
} from '@/lib/api/competitions'
import { getToday, getWeekdaysInMonth, getDday } from '@/lib/date-utils'
import { getLoggedInUser } from '@/lib/auth'
import TodaySummary from '@/components/home/TodaySummary'
import { getDaySummary, upsertDaySummary, type DaySummary, type DaySummaryBlock } from '@/lib/api/day-summaries'

export default function HomePage() {
  const router = useRouter()
  const userId = getLoggedInUser()?.id || ''
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [templateDates, setTemplateDates] = useState<Set<string>>(new Set())
  const [logDates, setLogDates] = useState<Set<string>>(new Set())
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [competitionDates, setCompetitionDates] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [editComp, setEditComp] = useState<Competition | null>(null)
  const [todayTemplates, setTodayTemplates] = useState<WorkoutTemplate[]>([])
  const [todayLogs, setTodayLogs] = useState<WorkoutLog[]>([])
  const [todaySummary, setTodaySummary] = useState<DaySummary | null>(null)
  const [todayLoaded, setTodayLoaded] = useState(false)

  const todayStr = getToday()

  const handleSummarySave = useCallback((text: string, blocks: DaySummaryBlock[]) => {
    upsertDaySummary(userId, todayStr, text, blocks).catch(err =>
      console.error('Failed to save day summary:', err))
  }, [userId, todayStr])

  const loadData = useCallback(async () => {
    if (!userId) return

    // Fetch calendar data and today's summary independently
    const calendarPromise = Promise.all([
      getTemplateDatesByMonth(year, month),
      getLogDatesByMonth(userId, year, month),
      getCompetitionsByMonth(userId, year, month),
    ]).then(([tDates, lDates, comps]) => {
      setTemplateDates(new Set(tDates))
      setLogDates(new Set(lDates))
      setCompetitions(comps)
      setCompetitionDates(new Set(comps.map(c => c.date)))
    }).catch(err => {
      console.error('Failed to load calendar data:', err)
    })

    const todayPromise = Promise.all([
      getTemplatesByDate(todayStr),
      getExtraTemplatesByDate(todayStr),
      getLogsByDate(userId, todayStr),
      getDaySummary(userId, todayStr).catch(() => null),
    ]).then(([tTemplates, tExtras, tLogs, tSummary]) => {
      setTodayTemplates([...tTemplates, ...tExtras])
      setTodayLogs(tLogs)
      setTodaySummary(tSummary)
      setTodayLoaded(true)
    }).catch(err => {
      console.error('Failed to load today summary:', err)
      setTodayLoaded(true)
    })

    await Promise.all([calendarPromise, todayPromise])
  }, [year, month, userId, todayStr])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Refetch when returning to the page (e.g., from workout page on mobile)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') loadData()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [loadData])

  function handleMonthChange(y: number, m: number) {
    setYear(y)
    setMonth(m)
  }

  function handleDateSelect(date: string) {
    router.push(`/workout?date=${date}`)
  }

  async function handleSaveComp(data: { date: string; name: string; team_name: string; team_members: string; notes: string }) {
    try {
      if (editComp) {
        await updateCompetition(editComp.id, data)
      } else {
        await createCompetition(userId, data)
      }
      setModalOpen(false)
      setEditComp(null)
      loadData()
    } catch (err) {
      console.error('Failed to save competition:', err)
    }
  }

  async function handleDeleteComp() {
    if (!editComp) return
    if (!confirm('대회를 삭제하시겠습니까?')) return
    try {
      await deleteCompetition(editComp.id)
      setModalOpen(false)
      setEditComp(null)
      loadData()
    } catch (err) {
      console.error('Failed to delete competition:', err)
    }
  }

  function handleCompTap(comp: Competition) {
    setEditComp(comp)
    setModalOpen(true)
  }

  const todayYear = parseInt(todayStr.slice(0, 4))
  const todayMonth = parseInt(todayStr.slice(5, 7))
  const isCurrentMonth = year === todayYear && month === todayMonth
  const weekdays = getWeekdaysInMonth(year, month)
  const workoutDays = logDates.size

  const upcomingComps = competitions
    .filter(c => getDday(c.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="relative">
        <Calendar
          year={year}
          month={month}
          onMonthChange={handleMonthChange}
          onDateSelect={handleDateSelect}
          templateDates={templateDates}
          logDates={logDates}
          competitionDates={competitionDates}
        />
        <button
          onClick={() => { setEditComp(null); setModalOpen(true) }}
          className="absolute top-4 right-14 w-6 h-6 rounded-full border-[1.5px] border-accent text-accent flex items-center justify-center"
          aria-label="대회 등록"
        >
          <Plus size={13} strokeWidth={2.5} />
        </button>
      </div>

      {/* Upcoming competitions */}
      {upcomingComps.length > 0 && (
        <div className="space-y-2">
          {upcomingComps.map(comp => {
            const dday = getDday(comp.date)
            return (
              <button
                key={comp.id}
                onClick={() => handleCompTap(comp)}
                className="w-full bg-surface rounded-lg border border-border p-4 flex items-center gap-3 text-left"
              >
                <Trophy size={16} className="text-danger shrink-0" />
                <span className="text-sm font-medium flex-1 truncate">{comp.name}</span>
                <span className="text-sm text-danger font-bold">
                  {dday === 0 ? 'D-DAY' : `D-${dday}`}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Today's Workout Summary */}
      {todayLoaded && (
        <TodaySummary
          templates={todayTemplates}
          logs={todayLogs}
          stored={todaySummary}
          onSave={handleSummarySave}
        />
      )}

      {/* Competition Modal */}
      <CompetitionModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditComp(null) }}
        onSave={handleSaveComp}
        onDelete={editComp ? handleDeleteComp : undefined}
        competition={editComp}
      />
    </div>
  )
}
