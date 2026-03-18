'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { logout, getLoggedInUser, type AuthUser } from '@/lib/auth'
import { ChevronLeft } from 'lucide-react'

const themes = [
  { id: 'classic', name: 'Classic', desc: '블루 완료', colors: ['#2D5A3D', '#3B82F6', '#FAFAFA'] },
  { id: 'gold', name: 'Gold', desc: '골드 포인트', colors: ['#2D5A3D', '#D4A017', '#FAFAFA'] },
  { id: 'warm', name: 'Warm', desc: '웜 크림', colors: ['#2D5A3D', '#E8E4DC', '#F5F3EE'] },
]

export default function SettingsPage() {
  const router = useRouter()
  const [theme, setTheme] = useState('classic')
  const [weightUnit, setWeightUnit] = useState<'lb' | 'kg'>('lb')
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    setUser(getLoggedInUser())
    const saved = localStorage.getItem('ddodun-theme') || 'classic'
    setTheme(saved)
    const unit = localStorage.getItem('ddodun-weight-unit') as 'lb' | 'kg' || 'lb'
    setWeightUnit(unit)
  }, [])

  function handleThemeChange(id: string) {
    setTheme(id)
    localStorage.setItem('ddodun-theme', id)
    document.documentElement.setAttribute('data-theme', id)
  }

  function handleUnitChange(unit: 'lb' | 'kg') {
    setWeightUnit(unit)
    localStorage.setItem('ddodun-weight-unit', unit)
  }

  function handleLogout() {
    if (!confirm('로그아웃 하시겠습니까?')) return
    logout()
    router.replace('/login')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="p-1 text-text-secondary">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold">설정</h2>
      </div>

      {/* User info */}
      <div className="bg-surface rounded-lg border border-border p-4">
        <p className="text-sm text-text-secondary">로그인 계정</p>
        <p className="font-medium">{user?.username}</p>
      </div>

      {/* Theme */}
      <div className="bg-surface rounded-lg border border-border p-4 space-y-3">
        <p className="font-medium">테마</p>
        <div className="flex gap-3">
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => handleThemeChange(t.id)}
              className={`flex-1 rounded-lg border-2 p-3 text-center text-sm transition-colors ${
                theme === t.id ? 'border-accent' : 'border-border'
              }`}
            >
              <div className="flex justify-center gap-1 mb-2">
                {t.colors.map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded-full" style={{ background: c }} />
                ))}
              </div>
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Weight unit */}
      <div className="bg-surface rounded-lg border border-border p-4 space-y-3">
        <p className="font-medium">기본 무게 단위</p>
        <div className="flex gap-2">
          {(['lb', 'kg'] as const).map(unit => (
            <button
              key={unit}
              onClick={() => handleUnitChange(unit)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                weightUnit === unit
                  ? 'bg-accent text-white'
                  : 'bg-background text-text-secondary border border-border'
              }`}
            >
              {unit}
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-2 rounded-lg border border-border text-sm text-text-secondary transition-opacity hover:opacity-80"
      >
        로그아웃
      </button>
    </div>
  )
}
