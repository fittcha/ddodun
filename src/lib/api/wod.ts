import { supabase } from '@/lib/supabase'

// --- Types ---
export type ScoreType = 'time' | 'amrap' | 'reps'

// --- Interfaces ---
export interface WodRecord {
  id: string
  user_id: string
  wod_type: string
  wod_name: string
  score_type: ScoreType
  time_seconds: number | null
  rounds: number | null
  extra_reps: number | null
  reps: number | null
  memo: string | null
  recorded_at: string
  created_at: string
}

export interface WodPreset {
  name: string
  category: string
  scoreType: ScoreType
  description: string
}

// --- Named WOD Presets ---
export const NAMED_WOD_PRESETS: WodPreset[] = [
  // Girl WODs
  { name: 'Fran', category: 'Girl', scoreType: 'time', description: '21-15-9: Thrusters (95/65 lb) & Pull-ups' },
  { name: 'Grace', category: 'Girl', scoreType: 'time', description: '30 Clean & Jerks (135/95 lb)' },
  { name: 'Isabel', category: 'Girl', scoreType: 'time', description: '30 Snatches (135/95 lb)' },
  { name: 'Diane', category: 'Girl', scoreType: 'time', description: '21-15-9: Deadlifts (225/155 lb) & HSPU' },
  { name: 'Helen', category: 'Girl', scoreType: 'time', description: '3 RFT: 400m Run, 21 KB Swings (53/35 lb), 12 Pull-ups' },
  { name: 'Jackie', category: 'Girl', scoreType: 'time', description: '1000m Row, 50 Thrusters (45/35 lb), 30 Pull-ups' },
  { name: 'Karen', category: 'Girl', scoreType: 'time', description: '150 Wall Balls (20/14 lb)' },
  { name: 'Annie', category: 'Girl', scoreType: 'time', description: '50-40-30-20-10: Double-unders & Sit-ups' },
  { name: 'Nancy', category: 'Girl', scoreType: 'time', description: '5 RFT: 400m Run, 15 OHS (95/65 lb)' },
  { name: 'Cindy', category: 'Girl', scoreType: 'amrap', description: '20 min AMRAP: 5 Pull-ups, 10 Push-ups, 15 Squats' },
  { name: 'Mary', category: 'Girl', scoreType: 'amrap', description: '20 min AMRAP: 5 HSPU, 10 Pistols, 15 Pull-ups' },
  // Hero WODs
  { name: 'Murph', category: 'Hero', scoreType: 'time', description: '1 mile Run, 100 Pull-ups, 200 Push-ups, 300 Squats, 1 mile Run (w/ vest)' },
  { name: 'DT', category: 'Hero', scoreType: 'time', description: '5 RFT: 12 Deadlifts, 9 Hang Power Cleans, 6 Push Jerks (155/105 lb)' },
  { name: 'JT', category: 'Hero', scoreType: 'time', description: '21-15-9: HSPU, Ring Dips, Push-ups' },
]

// --- CRUD Functions ---
export async function getAllWodRecords(userId: string): Promise<WodRecord[]> {
  const { data, error } = await supabase
    .from('wod_records')
    .select('*')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getWodRecords(userId: string, wodName: string): Promise<WodRecord[]> {
  const { data, error } = await supabase
    .from('wod_records')
    .select('*')
    .eq('user_id', userId)
    .eq('wod_name', wodName)
    .order('recorded_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createWodRecord(userId: string, record: Omit<WodRecord, 'id' | 'user_id' | 'created_at'>): Promise<WodRecord> {
  const { data, error } = await supabase
    .from('wod_records')
    .insert({ user_id: userId, ...record })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteWodRecord(id: string) {
  const { error } = await supabase.from('wod_records').delete().eq('id', id)
  if (error) throw error
}
