import { db } from '@/lib/server/db'
import { signSession } from '@/lib/server/session'
import { hashPin, checkPin } from '@/lib/server/pin'
import { SESSION_COOKIE, toResponse } from '@/lib/server/auth'

const THIRTY_DAYS = 60 * 60 * 24 * 30
const ONE_DAY = 60 * 60 * 24
const MAX_FAILED_ATTEMPTS = 5
const LOCK_DURATION_MS = 15 * 60 * 1000

export async function POST(req: Request) {
  try {
    const { username, pin, autoLogin } = await req.json()

    if (typeof username !== 'string' || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }

    const { data: user, error } = await db
      .from('users')
      .select('id, username, role, pin_hash, failed_attempts, locked_until')
      .eq('username', username.trim())
      .maybeSingle()
    if (error) throw error
    if (!user) return Response.json({ error: 'user not found' }, { status: 404 })

    const now = Date.now()

    if (user.locked_until !== null) {
      const lockedUntilMs = new Date(user.locked_until).getTime()
      if (lockedUntilMs > now) {
        const retryAfter = Math.ceil((lockedUntilMs - now) / 1000)
        return Response.json(
          { error: 'account locked' },
          { status: 429, headers: { 'Retry-After': String(retryAfter) } },
        )
      }
      // 잠금이 만료되었으면 잠기지 않은 것으로 취급하고 계속 진행한다
    }

    if (user.pin_hash === null) {
      // 최초 로그인: 전달된 PIN을 설정하고 실패 카운터를 초기화한다
      const { error: upErr } = await db
        .from('users')
        .update({ pin_hash: hashPin(pin), failed_attempts: 0, locked_until: null })
        .eq('id', user.id)
      if (upErr) throw upErr
    } else {
      const { ok, needsUpgrade } = checkPin(user.pin_hash, pin)
      if (!ok) {
        const attempts = user.failed_attempts + 1
        const lockedOut = attempts >= MAX_FAILED_ATTEMPTS
        const { error: upErr } = await db
          .from('users')
          .update(
            lockedOut
              ? { failed_attempts: 0, locked_until: new Date(now + LOCK_DURATION_MS).toISOString() }
              : { failed_attempts: attempts },
          )
          .eq('id', user.id)
        if (upErr) throw upErr
        return Response.json({ error: 'invalid pin' }, { status: 401 })
      }

      // 로그인 성공: 업그레이드가 필요하면 같은 쓰기에 실패 카운터 초기화를 함께 담는다.
      // 이미 카운터가 초기 상태라면 불필요한 쓰기를 발생시키지 않는다.
      const needsCounterReset = user.failed_attempts !== 0 || user.locked_until !== null
      if (needsUpgrade || needsCounterReset) {
        const { error: upErr } = await db
          .from('users')
          .update({
            ...(needsUpgrade ? { pin_hash: hashPin(pin) } : {}),
            failed_attempts: 0,
            locked_until: null,
          })
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
