import { db } from '@/lib/server/db'
import { requireUser, toResponse, HttpError } from '@/lib/server/auth'

export async function GET() {
  try {
    const session = await requireUser()
    const { data, error } = await db
      .from('user_nrm')
      .select('*')
      .eq('user_id', session.user_id)
      .order('rep_max')
      .order('exercise_name')
    if (error) throw error
    return Response.json({ records: data ?? [] })
  } catch (err) {
    return toResponse(err)
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireUser()
    const { exerciseName, repMax, weight, weightUnit } = await req.json()
    if (typeof exerciseName !== 'string' || typeof repMax !== 'number') {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }

    const { data: existing } = await db
      .from('user_nrm')
      .select('id')
      .eq('user_id', session.user_id)
      .eq('exercise_name', exerciseName)
      .eq('rep_max', repMax)
      .maybeSingle()

    if (existing) {
      const { data, error } = await db
        .from('user_nrm')
        .update({ weight, weight_unit: weightUnit, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      return Response.json({ record: data })
    }

    const { data, error } = await db
      .from('user_nrm')
      .insert({
        user_id: session.user_id,
        exercise_name: exerciseName,
        rep_max: repMax,
        weight,
        weight_unit: weightUnit,
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
      .from('user_nrm')
      .select('user_id')
      .eq('id', id)
      .maybeSingle()
    if (exErr) throw exErr
    if (!existing) throw new HttpError(404, 'not found')
    if (existing.user_id !== session.user_id) throw new HttpError(403, 'forbidden')

    const { error } = await db.from('user_nrm').delete().eq('id', id)
    if (error) throw error
    return Response.json({ ok: true })
  } catch (err) {
    return toResponse(err)
  }
}
