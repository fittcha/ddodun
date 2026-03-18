'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Competition } from '@/lib/api/competitions'

interface CompetitionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { date: string; name: string; team_name: string; team_members: string; notes: string }) => void
  onDelete?: () => void
  competition?: Competition | null
}

export default function CompetitionModal({ isOpen, onClose, onSave, onDelete, competition }: CompetitionModalProps) {
  const [date, setDate] = useState('')
  const [name, setName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [teamMembers, setTeamMembers] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (competition) {
      setDate(competition.date)
      setName(competition.name)
      setTeamName(competition.team_name || '')
      setTeamMembers(competition.team_members || '')
      setNotes(competition.notes || '')
    } else {
      setDate('')
      setName('')
      setTeamName('')
      setTeamMembers('')
      setNotes('')
    }
  }, [competition, isOpen])

  if (!isOpen) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date || !name.trim()) return
    onSave({ date, name: name.trim(), team_name: teamName.trim(), team_members: teamMembers.trim(), notes: notes.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-surface rounded-t-2xl p-6 pb-8 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">
            {competition ? '대회 수정' : '대회 등록'}
          </h3>
          <button onClick={onClose} className="p-1 text-text-secondary" aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">날짜 *</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">대회명 *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="예: 2026 CrossFit Open"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-text-secondary focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">팀명</label>
            <input
              type="text"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="팀명 (선택)"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-text-secondary focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">팀원</label>
            <input
              type="text"
              value={teamMembers}
              onChange={e => setTeamMembers(e.target.value)}
              placeholder="팀원 (선택)"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-text-secondary focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">메모</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="메모 (선택)"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-text-secondary focus:outline-none focus:border-accent resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            {competition && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2.5 rounded-lg border border-danger text-danger text-sm font-medium"
              >
                삭제
              </button>
            )}
            <button
              type="submit"
              disabled={!date || !name.trim()}
              className="flex-1 py-2.5 rounded-lg bg-accent text-white font-medium disabled:opacity-50 transition-opacity"
            >
              {competition ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
