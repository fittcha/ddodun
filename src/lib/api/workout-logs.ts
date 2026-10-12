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

/**
 * keepalive: 탭이 닫히거나 앱이 내려가는 중에도 요청이 끝까지 가도록 한다.
 * 평상시 저장에는 쓰지 않는다 — 브라우저가 keepalive 요청 본문 합계를 64KB 로 제한해서,
 * 손글씨처럼 덩치 있는 저장이 몰리면 오히려 실패할 수 있다.
 */
export async function upsertLog(
  log: Partial<WorkoutLog> & { date: string },
  keepalive = false,
): Promise<WorkoutLog> {
  const res = await apiFetch('/api/logs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(log),
    keepalive,
  })
  if (!res.ok) throw new Error(`upsertLog: ${res.status}`)
  const { log: saved } = await res.json()
  return saved
}

export async function deleteLog(id: string): Promise<void> {
  const res = await apiFetch(`/api/logs?id=${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`deleteLog: ${res.status}`)
}
