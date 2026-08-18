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
let cached: SessionUser | null | undefined
let inflight: Promise<SessionUser | null> | null = null

function loadSession(): Promise<SessionUser | null> {
  if (cached !== undefined) return Promise.resolve(cached)
  if (inflight) return inflight

  const pending: Promise<SessionUser | null> = fetch('/api/auth/session')
    .then(res => (res.ok ? res.json() : null))
    .then((data: { user?: SessionUser } | null) => {
      const user = data?.user ?? null
      cached = user
      return user
    })
    .catch(() => {
      cached = null
      return null
    })
    .finally(() => {
      inflight = null
    })

  inflight = pending
  return pending
}

export function useSession(): { user: SessionUser | null; loading: boolean } {
  const [user, setUser] = useState<SessionUser | null>(cached ?? null)
  const [loading, setLoading] = useState(cached === undefined)

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
