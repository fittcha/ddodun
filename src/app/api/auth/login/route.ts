import { db } from '@/lib/server/db'
import { signSession } from '@/lib/server/session'
import { hashPin, checkPin } from '@/lib/server/pin'
import { SESSION_COOKIE, toResponse } from '@/lib/server/auth'

const THIRTY_DAYS = 60 * 60 * 24 * 30
const ONE_DAY = 60 * 60 * 24

export async function POST(req: Request) {
  try {
    const { username, pin, autoLogin } = await req.json()

    if (typeof username !== 'string' || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }

    const { data: user, error } = await db
      .from('users')
      .select('id, username, role, pin_hash')
      .eq('username', username.trim())
      .maybeSingle()
    if (error) throw error
    if (!user) return Response.json({ error: 'user not found' }, { status: 404 })

    if (user.pin_hash === null) {
      // 최초 로그인: 전달된 PIN을 설정한다
      const { error: upErr } = await db
        .from('users')
        .update({ pin_hash: hashPin(pin) })
        .eq('id', user.id)
      if (upErr) throw upErr
    } else {
      const { ok, needsUpgrade } = checkPin(user.pin_hash, pin)
      if (!ok) return Response.json({ error: 'invalid pin' }, { status: 401 })
      if (needsUpgrade) {
        const { error: upErr } = await db
          .from('users')
          .update({ pin_hash: hashPin(pin) })
          .eq('id', user.id)
        if (upErr) throw upErr
      }
    }

    const maxAge = autoLogin === true ? THIRTY_DAYS : ONE_DAY
    const secret = process.env.SESSION_SECRET
    if (!secret) throw new Error('SESSION_SECRET 이 설정되지 않았습니다')

    const token = signSession(
      {
        user_id: user.id,
        username: user.username,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + maxAge,
      },
      secret,
    )

    const parts = [
      `${SESSION_COOKIE}=${token}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
    ]
    if (autoLogin === true) parts.push(`Max-Age=${maxAge}`)
    if (process.env.NODE_ENV === 'production') parts.push('Secure')

    return Response.json(
      { user: { id: user.id, username: user.username, role: user.role } },
      { headers: { 'Set-Cookie': parts.join('; ') } },
    )
  } catch (err) {
    return toResponse(err)
  }
}
