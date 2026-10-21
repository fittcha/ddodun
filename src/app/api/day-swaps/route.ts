import { requireUser, toResponse } from '@/lib/server/auth'
import { isValidDate } from '@/lib/server/date'
import { getWeekState, swapDays } from '@/lib/server/day-swaps'

export async function GET(req: Request) {
  try {
    const session = await requireUser()
    const date = new URL(req.url).searchParams.get('date') ?? ''
    if (!isValidDate(date)) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }
    return Response.json(await getWeekState(session.user_id, date))
  } catch (err) {
    return toResponse(err)
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireUser()
    const { dateA, dateB } = await req.json()
    if (!isValidDate(dateA) || !isValidDate(dateB)) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }
    await swapDays(session.user_id, dateA, dateB)
    return Response.json({ ok: true })
  } catch (err) {
    return toResponse(err)
  }
}
