import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hashPin, checkPin } from './pin.ts'

test('해시한 PIN은 같은 PIN으로 검증된다', () => {
  const stored = hashPin('1216')
  assert.ok(stored.startsWith('scrypt$'))
  assert.deepEqual(checkPin(stored, '1216'), { ok: true, needsUpgrade: false })
})

test('틀린 PIN은 거부한다', () => {
  const stored = hashPin('1216')
  assert.deepEqual(checkPin(stored, '9999'), { ok: false, needsUpgrade: false })
})

test('같은 PIN이라도 매번 다른 해시가 나온다 (salt)', () => {
  assert.notEqual(hashPin('1216'), hashPin('1216'))
})

test('평문 저장값이 일치하면 통과하되 업그레이드 신호를 준다', () => {
  assert.deepEqual(checkPin('1216', '1216'), { ok: true, needsUpgrade: true })
})

test('평문 저장값이 다르면 거부하고 업그레이드하지 않는다', () => {
  assert.deepEqual(checkPin('1216', '9999'), { ok: false, needsUpgrade: false })
})

test('저장값이 없으면 거부한다', () => {
  assert.deepEqual(checkPin(null, '1216'), { ok: false, needsUpgrade: false })
})

test('손상된 해시 문자열은 예외 없이 거부한다', () => {
  assert.deepEqual(checkPin('scrypt$deadbeef', '1216'), { ok: false, needsUpgrade: false })
  assert.deepEqual(checkPin('scrypt$$', '1216'), { ok: false, needsUpgrade: false })
})
