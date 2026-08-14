import { apiFetch } from './http'

export interface WorkoutLog {
  id: string
  date: string
  user_id: string
  template_id: string | null
  section: string | null
  is_custom: boolean
  exercise_name: string | null
  completed: boolean
  result_value: string | null
  result_unit: string | null
  sets_detail: unknown
  memo: string | null
  created_at: string
}

export async function getLogDatesByMonth(year: number, month: number): Promise<string[]> {
  const res = await apiFetch(`/api/logs/dates?year=${year}&month=${month}`)
  if (!res.ok) throw new Error(`getLogDatesByMonth: ${res.status}`)
  const { dates } = await res.json()
  return dates
}

export async function getLogsByDate(date: string): Promise<WorkoutLog[]> {
  const res = await apiFetch(`/api/logs/${date}`)
  if (!res.ok) throw new Error(`getLogsByDate: ${res.status}`)
  const { logs } = await res.json()
  return logs
}

export async function upsertLog(log: Partial<WorkoutLog> & { date: string }): Promise<WorkoutLog> {
  const res = await apiFetch('/api/logs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(log),
  })
  if (!res.ok) throw new Error(`upsertLog: ${res.status}`)
  const { log: saved } = await res.json()
  return saved
}

export async function deleteLog(id: string): Promise<void> {
  const res = await apiFetch(`/api/logs?id=${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`deleteLog: ${res.status}`)
}
