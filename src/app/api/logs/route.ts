import { db } from '@/lib/server/db'
import { requireUser, toResponse, HttpError } from '@/lib/server/auth'
import { isValidDate } from '@/lib/server/date'

export async function POST(req: Request) {
  try {
    const session = await requireUser()
    const body = await req.json()
    if (typeof body?.date !== 'string' || !isValidDate(body.date)) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }

    if (body.id) {
      const { data: existing, error: exErr } = await db
        .from('workout_logs')
        .select('user_id')
        .eq('id', body.id)
        .maybeSingle()
      if (exErr) throw exErr
      if (!existing) throw new HttpError(404, 'not found')
      if (existing.user_id !== session.user_id) throw new HttpError(403, 'forbidden')

      const { id, created_at, user_id, ...updates } = body
      const { data, error } = await db
        .from('workout_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return Response.json({ log: data })
    }

    const { id, created_at, user_id, ...insert } = body
    const { data, error } = await db
      .from('workout_logs')
      .insert({ ...insert, user_id: session.user_id })
      .select()
      .single()
    if (error) throw error
    return Response.json({ log: data })
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
      .from('workout_logs')
      .select('user_id')
      .eq('id', id)
      .maybeSingle()
    if (exErr) throw exErr
    if (!existing) throw new HttpError(404, 'not found')
    if (existing.user_id !== session.user_id) throw new HttpError(403, 'forbidden')

    const { error } = await db.from('workout_logs').delete().eq('id', id)
    if (error) throw error
    return Response.json({ ok: true })
  } catch (err) {
    return toResponse(err)
  }
}
