import { db } from './db.ts'
import { weekStartOf } from './week.ts'

export { weekStartOf } from './week.ts'

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

const COLUMNS =
  'id, date, day_of_week, section, workout_type, title, description, prescribed_sets, prescribed_reps, prescribed_weight, prescribed_time, rest_seconds, notes, sort_order, extra_group_id, extra_order, owner_user_id'

/** 선수에게 배정된, 해당 날짜를 포함하는 버전의 id. 없으면 null. */
async function assignedVersionId(athleteId: string, date: string): Promise<string | null> {
  const ws = weekStartOf(date)
  const { data, error } = await db
    .from('program_assignments')
    .select('version_id, programs!inner(week_start_date)')
    .eq('athlete_id', athleteId)
    .eq('programs.week_start_date', ws)
    .order('assigned_at', { ascending: false })
    .limit(1)
  if (error) throw error
  return data?.[0]?.version_id ?? null
}

/** 코치 프로그램 템플릿 (추가운동 제외). */
export async function resolveTemplates(athleteId: string, date: string): Promise<WorkoutTemplate[]> {
  const versionId = await assignedVersionId(athleteId, date)
  if (!versionId) return []

  const { data, error } = await db
    .from('program_version_templates')
    .select(`template_id, workout_templates!inner(${COLUMNS})`)
    .eq('version_id', versionId)
    .eq('workout_templates.date', date)
    .is('workout_templates.extra_group_id', null)
  if (error) throw error

  const rows = (data ?? []).map(
    r => (r as unknown as { workout_templates: WorkoutTemplate }).workout_templates,
  )
  rows.sort((a, b) =>
    a.section === b.section ? a.sort_order - b.sort_order : a.section.localeCompare(b.section),
  )
  return rows
}

/** 본인 소유 추가운동. */
export async function resolveExtras(athleteId: string, date: string): Promise<WorkoutTemplate[]> {
  const { data, error } = await db
    .from('workout_templates')
    .select(COLUMNS)
    .eq('date', date)
    .eq('owner_user_id', athleteId)
    .not('extra_group_id', 'is', null)
    .order('extra_order')
    .order('sort_order')
  if (error) throw error
  return (data ?? []) as WorkoutTemplate[]
}

/** 기간 내에 선수에게 운동이 배정된 날짜 목록. */
export async function resolveTemplateDates(
  athleteId: string,
  startDate: string,
  endDate: string,
): Promise<string[]> {
  const { data: assigns, error: aErr } = await db
    .from('program_assignments')
    .select('version_id')
    .eq('athlete_id', athleteId)
  if (aErr) throw aErr

  const versionIds = (assigns ?? []).map(a => a.version_id)
  if (versionIds.length === 0) return []

  const { data, error } = await db
    .from('program_version_templates')
    .select('workout_templates!inner(date)')
    .in('version_id', versionIds)
    .gte('workout_templates.date', startDate)
    .lte('workout_templates.date', endDate)
  if (error) throw error

  const dates = (data ?? []).map(
    r => (r as unknown as { workout_templates: { date: string } }).workout_templates.date,
  )
  return [...new Set(dates)].sort()
}
