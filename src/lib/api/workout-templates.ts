import { apiFetch } from './http'

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
  owner_user_id: string | null
}

async function getJson<T>(url: string): Promise<T> {
  const res = await apiFetch(url)
  if (!res.ok) throw new Error(`${url}: ${res.status}`)
  return res.json()
}

/**
 * /api/workouts/[date] 는 templates 와 extras 를 함께 돌려준다. 화면들은 둘을 각각
 * 다른 함수로 가져가므로, 그대로 두면 같은 날짜에 대해 왕복이 두 번 발생하고 매번
 * 응답의 절반을 버린다. 같은 tick 안에서 겹치는 요청은 하나로 합친다.
 */
type WorkoutsResponse = { templates: WorkoutTemplate[]; extras: WorkoutTemplate[] }
const inflight = new Map<string, Promise<WorkoutsResponse>>()

function fetchWorkouts(date: string): Promise<WorkoutsResponse> {
  const existing = inflight.get(date)
  if (existing) return existing
  const p = getJson<WorkoutsResponse>(`/api/workouts/${date}`)
  inflight.set(date, p)
  // 진행 중인 요청만 공유한다. 끝나면 즉시 비워서 다음 조회가 항상 최신을 받게 한다.
  p.finally(() => inflight.delete(date))
  return p
}

export async function getTemplateDatesByMonth(year: number, month: number): Promise<string[]> {
  const { dates } = await getJson<{ dates: string[] }>(`/api/calendar/${year}/${month}`)
  return dates
}

export async function getTemplateDatesByRange(startDate: string, endDate: string): Promise<string[]> {
  const { dates } = await getJson<{ dates: string[] }>(
    `/api/calendar/range?start=${startDate}&end=${endDate}`,
  )
  return dates
}

export async function getTemplatesByDate(date: string): Promise<WorkoutTemplate[]> {
  return (await fetchWorkouts(date)).templates
}

export async function getExtraTemplatesByDate(date: string): Promise<WorkoutTemplate[]> {
  return (await fetchWorkouts(date)).extras
}

export async function duplicateSectionToDate(
  date: string,
  templates: WorkoutTemplate[],
): Promise<WorkoutTemplate[]> {
  if (templates.length === 0) return []
  const res = await apiFetch('/api/workouts/duplicate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ date, templates }),
  })
  if (!res.ok) throw new Error(`duplicateSectionToDate: ${res.status}`)
  const { templates: created } = await res.json()
  return created
}

export async function deleteExtraGroup(extraGroupId: string): Promise<void> {
  const res = await apiFetch(`/api/workouts/extra/${extraGroupId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`deleteExtraGroup: ${res.status}`)
}
