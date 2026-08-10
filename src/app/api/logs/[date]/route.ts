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
      .from('workout_logs')
      .select(
        'id, date, user_id, template_id, section, is_custom, exercise_name, completed, result_value, result_unit, sets_detail, memo, created_at',
      )
      .eq('user_id', session.user_id)
      .eq('date', date)
      .order('section')
      .order('created_at')
    if (error) throw error
    return Response.json({ logs: data ?? [] })
  } catch (err) {
    return toResponse(err)
  }
}
