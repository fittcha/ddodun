import { test } from 'node:test'
import assert from 'node:assert/strict'
import { signSession, verifySession, type SessionPayload } from './session.ts'

const SECRET = 'test-secret-do-not-use'
const NOW = 1_700_000_000

function payload(over: Partial<SessionPayload> = {}): SessionPayload {
  return {
    user_id: 'eea07b65-70dd-468d-b63f-354fc0754efb',
    username: 'jindun',
    role: 'athlete',
    exp: NOW + 3600,
    ...over,
  }
}

test('서명한 토큰을 그대로 검증하면 원래 payload가 나온다', () => {
  const token = signSession(payload(), SECRET)
  assert.deepEqual(verifySession(token, SECRET, NOW), payload())
})

test('시크릿이 다르면 거부한다', () => {
  const token = signSession(payload(), SECRET)
  assert.equal(verifySession(token, 'other-secret', NOW), null)
})

test('본문을 변조하면 거부한다', () => {
  const token = signSession(payload(), SECRET)
  const [body, sig] = token.split('.')
  const tampered = Buffer.from(
    JSON.stringify(payload({ role: 'coach' })),
  ).toString('base64url')
  assert.notEqual(tampered, body)
  assert.equal(verifySession(`${tampered}.${sig}`, SECRET, NOW), null)
})

test('만료된 토큰은 거부한다', () => {
  const token = signSession(payload({ exp: NOW - 1 }), SECRET)
  assert.equal(verifySession(token, SECRET, NOW), null)
})

test('형식이 깨진 토큰은 거부한다', () => {
  assert.equal(verifySession('', SECRET, NOW), null)
  assert.equal(verifySession('onlyonepart', SECRET, NOW), null)
  assert.equal(verifySession('a.b.c', SECRET, NOW), null)
})
