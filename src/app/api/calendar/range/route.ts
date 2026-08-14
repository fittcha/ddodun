import { requireUser, toResponse } from '@/lib/server/auth'
import { resolveTemplateDates } from '@/lib/server/programs'
import { isValidDate } from '@/lib/server/date'

export async function GET(req: Request) {
  try {
    const session = await requireUser()
    const url = new URL(req.url)
    const start = url.searchParams.get('start')
    const end = url.searchParams.get('end')
    const ok = (s: string | null): s is string => s !== null && isValidDate(s)
    if (!ok(start) || !ok(end)) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }
    // start > end 는 잘못된 요청이 아니라 결과가 없는 범위로 취급한다.
    // gte(start)/lte(end) 조합이 자연히 빈 배열을 반환하므로 별도 분기가 필요 없다.
    const dates = await resolveTemplateDates(session.user_id, start, end)
    return Response.json({ dates })
  } catch (err) {
    return toResponse(err)
  }
}
