import { db } from '@/lib/server/db'
import { requireUser, toResponse, HttpError } from '@/lib/server/auth'

/** 형식뿐 아니라 실존하는 달력 날짜인지까지 확인한다 (예: 2026-02-30 거부). */
function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

async function assertOwnCompetition(id: string, userId: string) {
  const { data, error } = await db
    .from('competitions')
    .select('user_id')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new HttpError(404, 'not found')
  if (data.user_id !== userId) throw new HttpError(403, 'forbidden')
}

export async function GET(req: Request) {
  try {
    const session = await requireUser()
    const params = new URL(req.url).searchParams
    const date = params.get('date')

    if (date !== null) {
      if (!isValidDate(date)) {
        return Response.json({ error: 'bad request' }, { status: 400 })
      }
      const { data, error } = await db
        .from('competitions')
        .select('*')
        .eq('user_id', session.user_id)
        .eq('date', date)
        .maybeSingle()
      if (error) throw error
      return Response.json({ competition: data })
    }

    const year = Number(params.get('year'))
    const month = Number(params.get('month'))
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`

    const { data, error } = await db
      .from('competitions')
      .select('*')
      .eq('user_id', session.user_id)
      .gte('date', start)
      .lt('date', end)
      .order('date')
    if (error) throw error
    return Response.json({ competitions: data ?? [] })
  } catch (err) {
    return toResponse(err)
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireUser()
    const body = await req.json()
    const { id, user_id, created_at, ...comp } = body
    const { data, error } = await db
      .from('competitions')
      .insert({ ...comp, user_id: session.user_id })
      .select()
      .single()
    if (error) throw error
    return Response.json({ competition: data })
  } catch (err) {
    return toResponse(err)
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireUser()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return Response.json({ error: 'bad request' }, { status: 400 })
    await assertOwnCompetition(id, session.user_id)

    const body = await req.json()
    const { id: _i, user_id, created_at, ...updates } = body
    const { data, error } = await db
      .from('competitions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return Response.json({ competition: data })
  } catch (err) {
    return toResponse(err)
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireUser()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return Response.json({ error: 'bad request' }, { status: 400 })
    await assertOwnCompetition(id, session.user_id)

    const { error } = await db.from('competitions').delete().eq('id', id)
    if (error) throw error
    return Response.json({ ok: true })
  } catch (err) {
    return toResponse(err)
  }
}
