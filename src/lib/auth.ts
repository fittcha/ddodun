'use client'

const USER_KEY = 'ddodun-user'
const AUTO_LOGIN_KEY = 'ddodun-auto-login'
const LAST_USERNAME_KEY = 'ddodun-last-username'
const SESSION_KEY = 'ddodun-session'

export interface AuthUser {
  id: string
  username: string
}

export function getLoggedInUser(): AuthUser | null {
  if (typeof window === 'undefined') return null

  const autoLogin = localStorage.getItem(AUTO_LOGIN_KEY) === 'true'
  if (autoLogin) {
    const stored = localStorage.getItem(USER_KEY)
    if (stored) return JSON.parse(stored)
  }

  const session = sessionStorage.getItem(SESSION_KEY)
  if (session) return JSON.parse(session)

  return null
}

export function setLoggedInUser(user: AuthUser, autoLogin: boolean) {
  const data = JSON.stringify(user)
  if (autoLogin) {
    localStorage.setItem(USER_KEY, data)
    localStorage.setItem(AUTO_LOGIN_KEY, 'true')
  } else {
    sessionStorage.setItem(SESSION_KEY, data)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(AUTO_LOGIN_KEY)
  }
}

export function getLastUsername(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(LAST_USERNAME_KEY) ?? ''
}

export function setLastUsername(username: string) {
  localStorage.setItem(LAST_USERNAME_KEY, username)
}

export function logout() {
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(AUTO_LOGIN_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}
