import { getSession, toResponse } from '@/lib/server/auth'

export async function GET() {
  try {
    const s = await getSession()
    if (!s) return Response.json({ error: 'unauthorized' }, { status: 401 })
    return Response.json({
      user: { id: s.user_id, username: s.username, role: s.role },
    })
  } catch (err) {
    return toResponse(err)
  }
}
