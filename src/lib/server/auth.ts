import { cookies } from 'next/headers'
import { verifySession, type SessionPayload } from './session'
import { HttpError } from './http'

export { HttpError, assertOwn, toResponse } from './http'

export const SESSION_COOKIE = 'ddodun_session'

function secret(): string {
  const s = process.env.SESSION_SECRET
  if (!s) throw new Error('SESSION_SECRET 이 설정되지 않았습니다')
  return s
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies()
  const raw = jar.get(SESSION_COOKIE)?.value
  if (!raw) return null
  return verifySession(raw, secret(), Math.floor(Date.now() / 1000))
}

export async function requireUser(): Promise<SessionPayload> {
  const s = await getSession()
  if (!s) throw new HttpError(401, 'unauthorized')
  return s
}

export async function requireCoach(): Promise<SessionPayload> {
  const s = await requireUser()
  if (s.role !== 'coach') throw new HttpError(403, 'forbidden')
  return s
}
