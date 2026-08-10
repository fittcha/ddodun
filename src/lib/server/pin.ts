import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto'

const OPTS = { N: 16384, r: 8, p: 1 } as const
const KEYLEN = 32

export interface PinCheck {
  ok: boolean
  needsUpgrade: boolean
}

export function hashPin(pin: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(pin, salt, KEYLEN, OPTS)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export function checkPin(stored: string | null, pin: string): PinCheck {
  if (stored === null || stored === '') return { ok: false, needsUpgrade: false }

  if (!stored.startsWith('scrypt$')) {
    const ok = stored === pin
    return { ok, needsUpgrade: ok }
  }

  const parts = stored.split('$')
  if (parts.length !== 3) return { ok: false, needsUpgrade: false }
  const [, saltHex, hashHex] = parts
  if (!saltHex || !hashHex) return { ok: false, needsUpgrade: false }

  try {
    const salt = Buffer.from(saltHex, 'hex')
    const expected = Buffer.from(hashHex, 'hex')
    if (salt.length === 0 || expected.length !== KEYLEN) {
      return { ok: false, needsUpgrade: false }
    }
    const actual = scryptSync(pin, salt, KEYLEN, OPTS)
    return { ok: timingSafeEqual(expected, actual), needsUpgrade: false }
  } catch {
    return { ok: false, needsUpgrade: false }
  }
}
