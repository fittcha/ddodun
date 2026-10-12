import { createHmac, timingSafeEqual } from 'node:crypto'

export interface SessionPayload {
  user_id: string
  username: string
  role: 'athlete' | 'coach'
  exp: number
  /** 이 세션의 수명(초). 갱신할 때 같은 길이로 다시 발급한다. 옛 토큰엔 없다. */
  ttl?: number
  /** 자동 로그인으로 받은 세션인가 — 갱신 시 Max-Age 를 다시 줄지 결정한다. */
  auto?: boolean
}

function sign(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url')
}

export function signSession(payload: SessionPayload, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${sign(body, secret)}`
}

export function verifySession(
  token: string,
  secret: string,
  nowSeconds: number,
): SessionPayload | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts

  const expected = sign(body, secret)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  let payload: SessionPayload
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    return null
  }

  if (typeof payload.exp !== 'number' || payload.exp <= nowSeconds) return null
  if (payload.role !== 'athlete' && payload.role !== 'coach') return null
  if (typeof payload.user_id !== 'string' || typeof payload.username !== 'string') return null

  return payload
}
