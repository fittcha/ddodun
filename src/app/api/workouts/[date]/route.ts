import { requireUser, toResponse } from '@/lib/server/auth'
import { resolveTemplates, resolveExtras } from '@/lib/server/programs'
import { isValidDate } from '@/lib/server/date'

export async function GET(_req: Request, ctx: { params: Promise<{ date: string }> }) {
  try {
    const session = await requireUser()
    const { date } = await ctx.params
    if (!isValidDate(date)) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }
    const [templates, extras] = await Promise.all([
      resolveTemplates(session.user_id, date),
      resolveExtras(session.user_id, date),
    ])
    return Response.json({ templates, extras })
  } catch (err) {
    return toResponse(err)
  }
}
