import { db } from '@/lib/server/db'
import { requireUser, toResponse } from '@/lib/server/auth'
import { isValidDate } from '@/lib/server/date'

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
