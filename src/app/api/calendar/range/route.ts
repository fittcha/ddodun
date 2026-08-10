import { requireUser, toResponse } from '@/lib/server/auth'
import { resolveTemplateDates } from '@/lib/server/programs'

export async function GET(req: Request) {
  try {
    const session = await requireUser()
    const url = new URL(req.url)
    const start = url.searchParams.get('start')
    const end = url.searchParams.get('end')
    const ok = (s: string | null) => s !== null && /^\d{4}-\d{2}-\d{2}$/.test(s)
    if (!ok(start) || !ok(end)) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }
    const dates = await resolveTemplateDates(session.user_id, start!, end!)
    return Response.json({ dates })
  } catch (err) {
    return toResponse(err)
  }
}
