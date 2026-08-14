import { db } from '@/lib/server/db'
import { requireUser, toResponse, HttpError } from '@/lib/server/auth'

export async function GET(req: Request) {
  try {
    const session = await requireUser()
    const name = new URL(req.url).searchParams.get('name')
    let q = db
      .from('wod_records')
      .select('*')
      .eq('user_id', session.user_id)
      .order('recorded_at', { ascending: false })
    if (name) q = q.eq('wod_name', name)
    const { data, error } = await q
    if (error) throw error
    return Response.json({ records: data ?? [] })
  } catch (err) {
    return toResponse(err)
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireUser()
    const body = await req.json()
    const { id, user_id, created_at, ...record } = body
    const { data, error } = await db
      .from('wod_records')
      .insert({ ...record, user_id: session.user_id })
      .select()
      .single()
    if (error) throw error
    return Response.json({ record: data })
  } catch (err) {
    return toResponse(err)
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireUser()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return Response.json({ error: 'bad request' }, { status: 400 })

    const { data: existing, error: exErr } = await db
      .from('wod_records')
      .select('user_id')
      .eq('id', id)
      .maybeSingle()
    if (exErr) throw exErr
    if (!existing) throw new HttpError(404, 'not found')
    if (existing.user_id !== session.user_id) throw new HttpError(403, 'forbidden')

    const { error } = await db.from('wod_records').delete().eq('id', id)
    if (error) throw error
    return Response.json({ ok: true })
  } catch (err) {
    return toResponse(err)
  }
}
