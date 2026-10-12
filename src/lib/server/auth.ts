import { cookies } from 'next/headers'
import { signSession, verifySession, type SessionPayload } from './session'
import { HttpError } from './http'

export { HttpError, assertOwn, toResponse } from './http'

export const SESSION_COOKIE = 'ddodun_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30
export const AUTO_LOGIN_MAX_AGE = 60 * 60 * 24 * 90

function secret(): string {
  const s = process.env.SESSION_SECRET
  if (!s) throw new Error('SESSION_SECRET 이 설정되지 않았습니다')
  return s
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies()
  const raw = jar.get(SESSION_COOKIE)?.value
  if (!raw) return null
  const session = verifySession(raw, secret(), Math.floor(Date.now() / 1000))
  if (session) renew(jar, session)
  return session
}

/**
 * 슬라이딩 세션: 수명의 절반을 넘긴 쿠키를 같은 길이로 다시 발급한다.
 * 앱을 계속 쓰는 사람은 만료되지 않고, 손 뗀 세션은 예전처럼 만료된다.
 * 이게 없으면 탭을 오래 열어둔 채 만료됐을 때 저장 요청이 401 로 버려지고
 * 적어둔 기록이 그대로 날아간다 (apiFetch 가 /login 으로 보낸다).
 */
function renew(jar: Awaited<ReturnType<typeof cookies>>, s: SessionPayload) {
  const now = Math.floor(Date.now() / 1000)
  const ttl = s.ttl ?? SESSION_MAX_AGE
  if (s.exp - now > ttl / 2) return // 아직 절반도 안 지났다
  try {
    jar.set(SESSION_COOKIE, signSession({ ...s, exp: now + ttl }, secret()), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      // 자동 로그인이 아니면 브라우저 세션 쿠키로 둔다 (로그인할 때 고른 그대로).
      ...(s.auto ? { maxAge: ttl } : {}),
    })
  } catch {
    // 쿠키를 쓸 수 없는 컨텍스트면 조용히 넘어간다 — 다음 API 호출에서 갱신된다.
  }
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
