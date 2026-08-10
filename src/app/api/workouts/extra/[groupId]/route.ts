import { db } from '@/lib/server/db'
import { requireUser, toResponse, HttpError } from '@/lib/server/auth'

export async function DELETE(_req: Request, ctx: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await requireUser()
    const { groupId } = await ctx.params

    const { data: rows, error: selErr } = await db
      .from('workout_templates')
      .select('id, owner_user_id')
      .eq('extra_group_id', groupId)
    if (selErr) throw selErr
    if (!rows || rows.length === 0) throw new HttpError(404, 'not found')
    if (rows.some(r => r.owner_user_id !== session.user_id)) {
      throw new HttpError(403, 'forbidden')
    }

    const ids = rows.map(r => r.id)
    const { error: logErr } = await db.from('workout_logs').delete().in('template_id', ids)
    if (logErr) throw logErr
    const { error: tplErr } = await db
      .from('workout_templates')
      .delete()
      .eq('extra_group_id', groupId)
    if (tplErr) throw tplErr

    return Response.json({ ok: true })
  } catch (err) {
    return toResponse(err)
  }
}
