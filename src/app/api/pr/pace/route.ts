import { db } from '@/lib/server/db'
import { requireUser, toResponse, HttpError } from '@/lib/server/auth'

export async function GET() {
  try {
    const session = await requireUser()
    const { data, error } = await db
      .from('user_pace_records')
      .select('*')
      .eq('user_id', session.user_id)
      .order('equipment')
      .order('distance')
    if (error) throw error
    return Response.json({ records: data ?? [] })
  } catch (err) {
    return toResponse(err)
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireUser()
    const { equipment, distance, timeSeconds } = await req.json()
    if (typeof equipment !== 'string' || typeof distance !== 'string') {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }

    const { data: existing } = await db
      .from('user_pace_records')
      .select('id')
      .eq('user_id', session.user_id)
      .eq('equipment', equipment)
      .eq('distance', distance)
      .maybeSingle()

    if (existing) {
      const { data, error } = await db
        .from('user_pace_records')
        .update({ time_seconds: timeSeconds, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      return Response.json({ record: data })
    }

    const { data, error } = await db
      .from('user_pace_records')
      .insert({
        user_id: session.user_id,
        equipment,
        distance,
        time_seconds: timeSeconds,
      })
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
      .from('user_pace_records')
      .select('user_id')
      .eq('id', id)
      .maybeSingle()
    if (exErr) throw exErr
    if (!existing) throw new HttpError(404, 'not found')
    if (existing.user_id !== session.user_id) throw new HttpError(403, 'forbidden')

    const { error } = await db.from('user_pace_records').delete().eq('id', id)
    if (error) throw error
    return Response.json({ ok: true })
  } catch (err) {
    return toResponse(err)
  }
}
