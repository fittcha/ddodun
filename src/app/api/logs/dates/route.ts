import { db } from '@/lib/server/db'
import { requireUser, toResponse } from '@/lib/server/auth'

export async function GET(req: Request) {
  try {
    const session = await requireUser()
    const url = new URL(req.url)
    const year = Number(url.searchParams.get('year'))
    const month = Number(url.searchParams.get('month'))
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`

    const { data, error } = await db
      .from('workout_logs')
      .select('date')
      .eq('user_id', session.user_id)
      .eq('completed', true)
      .gte('date', start)
      .lt('date', end)
    if (error) throw error
    return Response.json({ dates: [...new Set((data ?? []).map(d => d.date))] })
  } catch (err) {
    return toResponse(err)
  }
}
