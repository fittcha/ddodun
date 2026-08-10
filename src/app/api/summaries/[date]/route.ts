import { db } from '@/lib/server/db'
import { requireUser, toResponse } from '@/lib/server/auth'

/** 형식뿐 아니라 실존하는 달력 날짜인지까지 확인한다 (예: 2026-02-30 거부). */
function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

export async function GET(_req: Request, ctx: { params: Promise<{ date: string }> }) {
  try {
    const session = await requireUser()
    const { date } = await ctx.params
    if (!isValidDate(date)) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }
    const { data, error } = await db
      .from('workout_day_summaries')
      .select('*')
      .eq('user_id', session.user_id)
      .eq('date', date)
      .maybeSingle()
    if (error) throw error
    return Response.json({ summary: data })
  } catch (err) {
    return toResponse(err)
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ date: string }> }) {
  try {
    const session = await requireUser()
    const { date } = await ctx.params
    if (!isValidDate(date)) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }
    const { text, blocks } = await req.json()
    if (typeof text !== 'string' || !Array.isArray(blocks)) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }
    const { data, error } = await db
      .from('workout_day_summaries')
      .upsert(
        { user_id: session.user_id, date, text, blocks, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,date' },
      )
      .select()
      .single()
    if (error) throw error
    return Response.json({ summary: data })
  } catch (err) {
    return toResponse(err)
  }
}
