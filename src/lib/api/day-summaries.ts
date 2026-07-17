import { supabase } from '@/lib/supabase'

export interface DaySummaryBlock {
  key: string
  template_ids: string[]
  sig: string
  auto_snippet: string
}

export interface DaySummary {
  text: string
  blocks: DaySummaryBlock[]
}

export async function getDaySummary(userId: string, date: string): Promise<DaySummary | null> {
  const { data, error } = await supabase
    .from('workout_day_summaries')
    .select('text, blocks')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return { text: data.text ?? '', blocks: (data.blocks as DaySummaryBlock[]) ?? [] }
}

export async function upsertDaySummary(
  userId: string,
  date: string,
  text: string,
  blocks: DaySummaryBlock[],
): Promise<void> {
  const { error } = await supabase
    .from('workout_day_summaries')
    .upsert(
      { user_id: userId, date, text, blocks, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' },
    )
  if (error) throw error
}
