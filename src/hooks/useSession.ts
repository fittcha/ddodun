'use client'

import { useEffect, useState } from 'react'
import type { SessionUser } from '@/lib/auth'

/**
 * AuthGuard 와 각 페이지가 따로 useSession() 을 부르므로, 그대로 두면 한 번 로드할 때마다
 * /api/auth/session 왕복이 두 번 이상 발생한다. 세션은 로드 중 바뀌지 않으므로 진행 중인
 * 요청을 공유하고, 한 번 확인한 뒤에는 그 결과를 재사용한다.
 *
 * 로그아웃 시 페이지 전체가 /login 으로 이동하며 새로 로드되므로 캐시가 남지 않는다.
 */
let cached: SessionUser | null = null
let inflight: Promise<SessionUser | null> | null = null

function loadSession(): Promise<SessionUser | null> {
  // 로그인된 결과만 캐시한다. null 을 캐시하면 /login 에서 확인한 "세션 없음"이 그대로
  // 남아, 로그인 성공 후 클라이언트 이동으로 홈에 들어갔을 때 AuthGuard 가 그 null 을
  // 보고 다시 /login 으로 돌려보낸다 (로그인이 안 되는 것처럼 보인다).
  if (cached) return Promise.resolve(cached)
  if (inflight) return inflight

  const pending: Promise<SessionUser | null> = fetch('/api/auth/session')
    .then(res => (res.ok ? res.json() : null))
    .then((data: { user?: SessionUser } | null) => {
      const user = data?.user ?? null
      cached = user
      return user
    })
    .catch(() => null)
    .finally(() => {
      inflight = null
    })

  inflight = pending
  return pending
}

export function useSession(): { user: SessionUser | null; loading: boolean } {
  const [user, setUser] = useState<SessionUser | null>(cached)
  // 캐시된 사용자가 없으면 확인이 끝날 때까지 loading 이어야 한다. 여기서 false 로
  // 시작하면 AuthGuard 가 응답 전에 user=null 을 보고 /login 으로 보내버린다.
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    let alive = true
    loadSession().then(u => {
      if (!alive) return
      setUser(u)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [])

  return { user, loading }
}
