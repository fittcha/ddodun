'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import PinInput from '@/components/auth/PinInput'
import { getLastUsername, setLastUsername } from '@/lib/auth'

type Step = 'username' | 'pin-verify' | 'pin-setup' | 'pin-setup-confirm'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('username')
  const [username, setUsername] = useState('')
  const [autoLogin, setAutoLogin] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [pinErrorMessage, setPinErrorMessage] = useState('')
  const [setupPin, setSetupPin] = useState('')

  useEffect(() => {
    setUsername(getLastUsername())
  }, [])

  function handleBack() {
    setStep('username')
    setPinError(false)
    setPinErrorMessage('')
    setSetupPin('')
  }

  async function handleNext() {
    if (!username.trim()) return
    setUsernameError('')
    setLoading(true)
    try {
      // PIN 미설정 계정이면 입력이 아니라 설정 화면으로 보낸다.
      // 조회에 실패하면 기존 동작(PIN 입력)으로 넘어간다 — 로그인 자체는 막지 않는다.
      const res = await fetch(`/api/auth/pin-status?username=${encodeURIComponent(username.trim())}`)
      const needsSetup = res.ok ? (await res.json()).needsSetup === true : false
      setStep(needsSetup ? 'pin-setup' : 'pin-verify')
    } catch {
      setStep('pin-verify')
    } finally {
      setLoading(false)
    }
  }

  function handleSetupPin(pin: string) {
    setPinError(false)
    setPinErrorMessage('')
    setSetupPin(pin)
    setStep('pin-setup-confirm')
  }

  function handleConfirmPin(pin: string) {
    if (pin !== setupPin) {
      setSetupPin('')
      setPinError(true)
      setPinErrorMessage('PIN이 일치하지 않습니다. 다시 설정해주세요')
      setStep('pin-setup')
      return
    }
    submitPin(pin, pin)
  }

  async function submitPin(pin: string, confirmPin?: string) {
    setPinError(false)
    setPinErrorMessage('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), pin, confirmPin, autoLogin }),
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
        title={
          step === 'pin-setup'
            ? '사용할 PIN을 설정하세요'
            : step === 'pin-setup-confirm'
              ? 'PIN을 한 번 더 입력하세요'
              : 'PIN을 입력하세요'
        }
        onComplete={
          step === 'pin-setup'
            ? handleSetupPin
            : step === 'pin-setup-confirm'
              ? handleConfirmPin
              : submitPin
        }
        error={pinError}
        errorMessage={pinErrorMessage}
        onErrorReset={handlePinErrorReset}
      />
    </div>
  )
}
