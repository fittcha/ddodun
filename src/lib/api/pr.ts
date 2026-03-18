import { supabase } from '@/lib/supabase'

// --- 1RM ---
export interface OneRM {
  id: string
  user_id: string
  exercise_name: string
  weight: number | null
  weight_unit: string
  updated_at: string
}

export async function getAll1RM(userId: string): Promise<OneRM[]> {
  const { data, error } = await supabase
    .from('user_1rm')
    .select('*')
    .eq('user_id', userId)
    .order('exercise_name')
  if (error) throw error
  return data || []
}

export async function upsert1RM(userId: string, exerciseName: string, weight: number | null, weightUnit: string): Promise<OneRM> {
  const { data: existing } = await supabase
    .from('user_1rm')
    .select('id')
    .eq('user_id', userId)
    .eq('exercise_name', exerciseName)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from('user_1rm')
      .update({ weight, weight_unit: weightUnit, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('user_1rm')
      .insert({ user_id: userId, exercise_name: exerciseName, weight, weight_unit: weightUnit })
      .select()
      .single()
    if (error) throw error
    return data
  }
}

export async function delete1RM(id: string) {
  const { error } = await supabase.from('user_1rm').delete().eq('id', id)
  if (error) throw error
}

// --- nRM ---
export interface NRM {
  id: string
  user_id: string
  exercise_name: string
  rep_max: number
  weight: number | null
  weight_unit: string
  updated_at: string
}

export async function getAllNRM(userId: string): Promise<NRM[]> {
  const { data, error } = await supabase
    .from('user_nrm')
    .select('*')
    .eq('user_id', userId)
    .order('rep_max')
    .order('exercise_name')
  if (error) throw error
  return data || []
}

export async function upsertNRM(userId: string, exerciseName: string, repMax: number, weight: number | null, weightUnit: string): Promise<NRM> {
  const { data: existing } = await supabase
    .from('user_nrm')
    .select('id')
    .eq('user_id', userId)
    .eq('exercise_name', exerciseName)
    .eq('rep_max', repMax)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from('user_nrm')
      .update({ weight, weight_unit: weightUnit, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('user_nrm')
      .insert({ user_id: userId, exercise_name: exerciseName, rep_max: repMax, weight, weight_unit: weightUnit })
      .select()
      .single()
    if (error) throw error
    return data
  }
}

export async function deleteNRM(id: string) {
  const { error } = await supabase.from('user_nrm').delete().eq('id', id)
  if (error) throw error
}

// --- Pace Records ---
export interface PaceRecord {
  id: string
  user_id: string
  equipment: string
  distance: string
  time_seconds: number | null
  updated_at: string
}

export async function getAllPaceRecords(userId: string): Promise<PaceRecord[]> {
  const { data, error } = await supabase
    .from('user_pace_records')
    .select('*')
    .eq('user_id', userId)
    .order('equipment')
    .order('distance')
  if (error) throw error
  return data || []
}

export async function upsertPaceRecord(userId: string, equipment: string, distance: string, timeSeconds: number | null): Promise<PaceRecord> {
  const { data: existing } = await supabase
    .from('user_pace_records')
    .select('id')
    .eq('user_id', userId)
    .eq('equipment', equipment)
    .eq('distance', distance)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from('user_pace_records')
      .update({ time_seconds: timeSeconds, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('user_pace_records')
      .insert({ user_id: userId, equipment, distance, time_seconds: timeSeconds })
      .select()
      .single()
    if (error) throw error
    return data
  }
}

export async function deletePaceRecord(id: string) {
  const { error } = await supabase.from('user_pace_records').delete().eq('id', id)
  if (error) throw error
}
