import { supabase } from '@/lib/supabase'

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
    .order('section')
    .order('sort_order')

  if (error) throw error
  return data || []
}
