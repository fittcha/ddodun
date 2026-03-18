'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import AuthGuard from '@/components/auth/AuthGuard'
import ThemeInitializer from '@/components/ThemeInitializer'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/login'

  return (
    <AuthGuard>
      <ThemeInitializer />
      {!isLogin && <Header />}
      <main className={isLogin ? '' : 'max-w-lg mx-auto px-4 pt-3 pb-20'}>
        {children}
      </main>
      {!isLogin && <BottomNav />}
    </AuthGuard>
  )
}
