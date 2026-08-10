'use client'

import { useEffect, useState } from 'react'
import type { SessionUser } from '@/lib/auth'

export function useSession(): { user: SessionUser | null; loading: boolean } {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetch('/api/auth/session')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (alive) setUser(data?.user ?? null)
      })
      .catch(() => {
        if (alive) setUser(null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return { user, loading }
}
