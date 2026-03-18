import { supabase } from '@/lib/supabase'

export interface Competition {
  id: string
  date: string
  user_id: string
  name: string
  team_name: string | null
  team_members: string | null
  notes: string | null
  created_at: string
}

export async function getCompetitionsByMonth(userId: string, year: number, month: number): Promise<Competition[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`

  const { data, error } = await supabase
    .from('competitions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lt('date', endDate)
    .order('date')

  if (error) throw error
  return data || []
}

export async function getCompetitionByDate(userId: string, date: string): Promise<Competition | null> {
  const { data, error } = await supabase
    .from('competitions')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createCompetition(userId: string, comp: Omit<Competition, 'id' | 'created_at' | 'user_id'>): Promise<Competition> {
  const { data, error } = await supabase
    .from('competitions')
    .insert({ ...comp, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCompetition(id: string, comp: Partial<Competition>): Promise<Competition> {
  const { data, error } = await supabase
    .from('competitions')
    .update(comp)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCompetition(id: string) {
  const { error } = await supabase
    .from('competitions')
    .delete()
    .eq('id', id)
  if (error) throw error
}
