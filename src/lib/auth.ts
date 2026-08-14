'use client'

const LAST_USERNAME_KEY = 'ddodun-last-username'

export interface SessionUser {
  id: string
  username: string
  role: 'athlete' | 'coach'
}

export function getLastUsername(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(LAST_USERNAME_KEY) ?? ''
}

export function setLastUsername(username: string) {
  localStorage.setItem(LAST_USERNAME_KEY, username)
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' })
}
