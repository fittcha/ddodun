import { requireUser, toResponse } from '@/lib/server/auth'
import { resolveTemplateDates } from '@/lib/server/programs'

/** 형식뿐 아니라 실존하는 달력 날짜인지까지 확인한다 (예: 2026-02-30 거부). */
function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

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
