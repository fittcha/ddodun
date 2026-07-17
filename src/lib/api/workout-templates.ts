import { supabase } from '@/lib/supabase'
import { getToday } from '@/lib/date-utils'

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
}

export async function getTemplateDatesByMonth(year: number, month: number): Promise<string[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`

  const { data, error } = await supabase
    .from('workout_templates')
    .select('date')
    .gte('date', startDate)
    .lt('date', endDate)

  if (error) throw error
  const unique = [...new Set((data || []).map(d => d.date))]
  return unique
}

export async function getTemplateDatesByRange(startDate: string, endDate: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('workout_templates')
    .select('date')
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) throw error
  return [...new Set((data || []).map(d => d.date))]
}

export async function getTemplatesByDate(date: string): Promise<WorkoutTemplate[]> {
  const { data, error } = await supabase
    .from('workout_templates')
    .select('*')
    .eq('date', date)
    .is('extra_group_id', null)
    .order('section')
    .order('sort_order')

  if (error) throw error
  return data || []
}

export async function getExtraTemplatesByDate(date: string): Promise<WorkoutTemplate[]> {
  const { data, error } = await supabase
    .from('workout_templates')
    .select('*')
    .eq('date', date)
    .not('extra_group_id', 'is', null)
    .order('extra_order')
    .order('sort_order')

  if (error) throw error
  return data || []
}

const DOW_CODES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export async function duplicateSectionToToday(
  templates: WorkoutTemplate[]
): Promise<WorkoutTemplate[]> {
  if (templates.length === 0) return []
  const today = getToday()
  const dow = DOW_CODES[new Date(today + 'T00:00:00').getDay()]

  // 오늘의 기존 추가운동 중 최대 extra_order → 다음 순서
  const { data: existing, error: exErr } = await supabase
    .from('workout_templates')
    .select('extra_order')
    .eq('date', today)
    .not('extra_group_id', 'is', null)
    .order('extra_order', { ascending: false })
    .limit(1)
  if (exErr) throw exErr
  const nextOrder = (existing?.[0]?.extra_order ?? 0) + 1

  const extraGroupId = crypto.randomUUID()

  const rows = templates.map(t => ({
    date: today,
    day_of_week: dow,
    section: '추가운동',
    workout_type: t.workout_type,
    title: t.title,
    description: t.description,
    prescribed_sets: t.prescribed_sets,
    prescribed_reps: t.prescribed_reps,
    prescribed_weight: t.prescribed_weight,
    prescribed_time: t.prescribed_time,
    rest_seconds: t.rest_seconds,
    notes: t.notes,
    sort_order: t.sort_order,
    extra_group_id: extraGroupId,
    extra_order: nextOrder,
  }))

  const { data, error } = await supabase
    .from('workout_templates')
    .insert(rows)
    .select()
  if (error) throw error
  return data || []
}

export async function deleteExtraGroup(extraGroupId: string): Promise<void> {
  // 1) 그룹의 template id 조회
  const { data: rows, error: selErr } = await supabase
    .from('workout_templates')
    .select('id')
    .eq('extra_group_id', extraGroupId)
  if (selErr) throw selErr

  const ids = (rows || []).map(r => r.id)

  // 2) 연결된 로그 삭제
  if (ids.length > 0) {
    const { error: logErr } = await supabase
      .from('workout_logs')
      .delete()
      .in('template_id', ids)
    if (logErr) throw logErr
  }

  // 3) 템플릿 행 삭제
  const { error: tplErr } = await supabase
    .from('workout_templates')
    .delete()
    .eq('extra_group_id', extraGroupId)
  if (tplErr) throw tplErr
}
