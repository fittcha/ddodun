import { db } from '@/lib/server/db'
import { requireUser, toResponse } from '@/lib/server/auth'

const DOW_CODES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

/** 형식뿐 아니라 실존하는 달력 날짜인지까지 확인한다 (예: 2026-02-30 거부). */
function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

export async function POST(req: Request) {
  try {
    const session = await requireUser()
    const { date, templates } = await req.json()
    if (!isValidDate(date) || !Array.isArray(templates) || templates.length === 0) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }

    const dow = DOW_CODES[new Date(`${date}T00:00:00Z`).getUTCDay()]

    const { data: existing, error: exErr } = await db
      .from('workout_templates')
      .select('extra_order')
      .eq('date', date)
      .eq('owner_user_id', session.user_id)
      .not('extra_group_id', 'is', null)
      .order('extra_order', { ascending: false })
      .limit(1)
    if (exErr) throw exErr
    const nextOrder = (existing?.[0]?.extra_order ?? 0) + 1
    const extraGroupId = crypto.randomUUID()

    const rows = templates.map((t: Record<string, unknown>) => ({
      date,
      day_of_week: dow,
      section: '추가운동',
      workout_type: t.workout_type,
      title: t.title,
      description: t.description,
      prescribed_sets: t.prescribed_sets,
      prescribed_reps: t.prescribed_reps,
      prescribed_weight: t.prescribed_weight,
      prescribed_time: t.prescribed_time,
      rest_seconds: t.rest_seconds,
      notes: t.notes,
      sort_order: t.sort_order,
      extra_group_id: extraGroupId,
      extra_order: nextOrder,
      owner_user_id: session.user_id,
    }))

    const { data, error } = await db.from('workout_templates').insert(rows).select()
    if (error) throw error
    return Response.json({ templates: data ?? [] })
  } catch (err) {
    return toResponse(err)
  }
}
