'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getLoggedInUser } from '@/lib/auth'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false)
  const [authed, setAuthed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const user = getLoggedInUser()
    setAuthed(!!user)
    setChecked(true)

    if (!user && pathname !== '/login') {
      router.replace('/login')
    }
  }, [pathname, router])

  if (!checked) return null
  if (pathname === '/login') return <>{children}</>
  if (!authed) return null
  return <>{children}</>
}
