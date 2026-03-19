import { supabase } from '@/lib/supabase'

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

export async function getLogDatesByMonth(userId: string, year: number, month: number): Promise<string[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`

  const { data, error } = await supabase
    .from('workout_logs')
    .select('date')
    .eq('user_id', userId)
    .eq('completed', true)
    .gte('date', startDate)
    .lt('date', endDate)

  if (error) throw error
  const unique = [...new Set((data || []).map(d => d.date))]
  return unique
}

export async function getLogsByDate(userId: string, date: string): Promise<WorkoutLog[]> {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('id, date, user_id, template_id, section, is_custom, exercise_name, completed, result_value, result_unit, sets_detail, memo, created_at')
    .eq('user_id', userId)
    .eq('date', date)
    .order('section')
    .order('created_at')

  if (error) throw error
  return data || []
}

export async function upsertLog(userId: string, log: Partial<WorkoutLog> & { date: string }): Promise<WorkoutLog> {
  if (log.id) {
    const { id, created_at, user_id, ...updates } = log
    const { data, error } = await supabase
      .from('workout_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { id, created_at, user_id, ...insert } = log
    const { data, error } = await supabase
      .from('workout_logs')
      .insert({ ...insert, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return data
  }
}

export async function deleteLog(id: string) {
  const { error } = await supabase
    .from('workout_logs')
    .delete()
    .eq('id', id)
  if (error) throw error
}
