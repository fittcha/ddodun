import { test } from 'node:test'
import assert from 'node:assert/strict'
import { weekStartOf } from './week.ts'

test('월요일은 자기 자신을 반환한다', () => {
  assert.equal(weekStartOf('2026-08-10'), '2026-08-10')
})

test('금요일은 그 주 월요일을 반환한다', () => {
  assert.equal(weekStartOf('2026-08-14'), '2026-08-10')
})

test('일요일은 직전 월요일을 반환한다', () => {
  assert.equal(weekStartOf('2026-08-16'), '2026-08-10')
})

test('월 경계를 넘어도 올바르다', () => {
  assert.equal(weekStartOf('2026-08-01'), '2026-07-27')
})

test('연 경계를 넘어도 올바르다', () => {
  assert.equal(weekStartOf('2026-01-01'), '2025-12-29')
})
