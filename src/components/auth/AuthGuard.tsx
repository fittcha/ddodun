'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from '@/hooks/useSession'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.replace('/login')
    }
  }, [loading, user, pathname, router])

  if (loading) return null
  if (pathname === '/login') return <>{children}</>
  if (!user) return null
  return <>{children}</>
}
