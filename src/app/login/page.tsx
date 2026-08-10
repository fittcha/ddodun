'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import PinInput from '@/components/auth/PinInput'
import { getLastUsername, setLastUsername } from '@/lib/auth'

type Step = 'username' | 'pin-verify'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('username')
  const [username, setUsername] = useState('')
  const [autoLogin, setAutoLogin] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [pinErrorMessage, setPinErrorMessage] = useState('')

  useEffect(() => {
    setUsername(getLastUsername())
  }, [])

  function handleBack() {
    setStep('username')
    setPinError(false)
    setPinErrorMessage('')
  }

  async function handleNext() {
    if (!username.trim()) return
    setUsernameError('')
    setStep('pin-verify')
  }

  async function submitPin(pin: string) {
    setPinError(false)
    setPinErrorMessage('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), pin, autoLogin }),
      })
      if (res.status === 404) {
        setStep('username')
        setUsernameError('등록되지 않은 사용자입니다')
        return
      }
      if (res.status === 429) {
        setPinError(true)
        setPinErrorMessage('로그인 시도가 너무 많아 계정이 잠겼습니다. 잠시 후 다시 시도해주세요')
        return
      }
      if (!res.ok) {
        setPinError(true)
        setPinErrorMessage('PIN이 올바르지 않습니다')
        return
      }
      setLastUsername(username.trim())
      router.replace('/')
    } finally {
      setLoading(false)
    }
  }

  const handlePinErrorReset = useCallback(() => {
    setPinError(false)
    setPinErrorMessage('')
  }, [])

  if (step === 'username') {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-background px-4 pb-[10vh]">
        <h1 className="text-3xl font-bold text-accent mb-2">DDODUN</h1>
        <p className="text-sm text-text-secondary mb-8">크로스핏 운동 트래커</p>

        <div className="w-full max-w-[320px] space-y-4">
          <input
            type="text"
            value={username}
            onChange={e => { setUsername(e.target.value); setUsernameError('') }}
            onKeyDown={e => { if (e.key === 'Enter') handleNext() }}
            placeholder="사용자 이름"
            autoComplete="username"
            autoCapitalize="none"
            className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-foreground placeholder:text-text-secondary focus:outline-none focus:border-accent"
          />

          {usernameError && (
            <p className="text-sm text-danger">{usernameError}</p>
          )}

          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={autoLogin}
              onChange={e => setAutoLogin(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            자동 로그인
          </label>

          <button
            onClick={handleNext}
            disabled={loading || !username.trim()}
            className="w-full py-3 rounded-lg bg-accent text-white font-medium disabled:opacity-50 transition-opacity"
          >
            {loading ? '확인 중...' : '로그인'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-background px-4 pb-[10vh]">
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 p-2 text-text-secondary"
        aria-label="뒤로가기"
      >
        <ChevronLeft size={24} />
      </button>
      <h1 className="text-3xl font-bold text-accent mb-2">DDODUN</h1>
      <PinInput
        key={step}
        title="PIN을 입력하세요"
        onComplete={submitPin}
        error={pinError}
        errorMessage={pinErrorMessage}
        onErrorReset={handlePinErrorReset}
      />
    </div>
  )
}
