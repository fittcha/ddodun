import { requireUser, toResponse } from '@/lib/server/auth'
import { resolveTemplateDates } from '@/lib/server/programs'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ year: string; month: string }> },
) {
  try {
    const session = await requireUser()
    const { year, month } = await ctx.params
    const y = Number(year)
    const m = Number(month)
    if (!Number.isInteger(y) || !Number.isInteger(m) || m < 1 || m > 12) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }
    const start = `${y}-${String(m).padStart(2, '0')}-01`
    const end =
      m === 12
        ? `${y}-12-31`
        : new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)
    const dates = await resolveTemplateDates(session.user_id, start, end)
    return Response.json({ dates })
  } catch (err) {
    return toResponse(err)
  }
}
