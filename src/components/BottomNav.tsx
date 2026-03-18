'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Calendar, Dumbbell, Trophy, Settings } from 'lucide-react'

const tabs = [
  { label: '홈', path: '/', icon: Calendar },
  { label: '운동', path: '/workout', icon: Dumbbell },
  { label: 'PR', path: '/pr', icon: Trophy },
  { label: '설정', path: '/settings', icon: Settings },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border">
      <div className="max-w-lg mx-auto flex">
        {tabs.map(tab => {
          const active = pathname === tab.path || (tab.path !== '/' && pathname.startsWith(tab.path))
          const Icon = tab.icon
          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors ${
                active ? 'text-accent' : 'text-text-secondary'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
