import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isValidDate } from './date.ts'

test('YYYY-MM-DD 형식의 실존하는 날짜는 통과한다', () => {
  assert.equal(isValidDate('2026-08-10'), true)
})

test('형식이 다르면 거부한다', () => {
  assert.equal(isValidDate('2026/08/10'), false)
  assert.equal(isValidDate('26-08-10'), false)
  assert.equal(isValidDate('2026-8-10'), false)
  assert.equal(isValidDate(''), false)
})

test('실존하지 않는 달력 날짜는 거부한다', () => {
  assert.equal(isValidDate('2026-02-30'), false)
  assert.equal(isValidDate('2026-13-01'), false)
  assert.equal(isValidDate('2026-00-10'), false)
})

test('윤년의 2월 29일은 통과하고, 평년은 거부한다', () => {
  assert.equal(isValidDate('2024-02-29'), true)
  assert.equal(isValidDate('2026-02-29'), false)
})
