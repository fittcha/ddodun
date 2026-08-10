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
  const { templates } = await getJson<{ templates: WorkoutTemplate[] }>(`/api/workouts/${date}`)
  return templates
}

export async function getExtraTemplatesByDate(date: string): Promise<WorkoutTemplate[]> {
  const { extras } = await getJson<{ extras: WorkoutTemplate[] }>(`/api/workouts/${date}`)
  return extras
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
