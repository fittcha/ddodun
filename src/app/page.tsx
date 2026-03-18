'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trophy } from 'lucide-react'
import Calendar from '@/components/calendar/Calendar'
import CompetitionModal from '@/components/calendar/CompetitionModal'
import { getTemplateDatesByMonth, getTemplatesByDate, type WorkoutTemplate } from '@/lib/api/workout-templates'
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

  const todayStr = getToday()

  const loadData = useCallback(async () => {
    try {
      const [tDates, lDates, comps, tTemplates, tLogs] = await Promise.all([
        getTemplateDatesByMonth(year, month),
        getLogDatesByMonth(userId, year, month),
        getCompetitionsByMonth(userId, year, month),
        getTemplatesByDate(todayStr),
        getLogsByDate(userId, todayStr),
      ])
      setTemplateDates(new Set(tDates))
      setLogDates(new Set(lDates))
      setCompetitions(comps)
      setCompetitionDates(new Set(comps.map(c => c.date)))
      setTodayTemplates(tTemplates)
      setTodayLogs(tLogs)
    } catch (err) {
      console.error('Failed to load calendar data:', err)
      setTemplateDates(new Set())
      setLogDates(new Set())
      setCompetitions([])
      setCompetitionDates(new Set())
    }
  }, [year, month])

  useEffect(() => {
    loadData()
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
      <TodaySummary templates={todayTemplates} logs={todayLogs} />

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
