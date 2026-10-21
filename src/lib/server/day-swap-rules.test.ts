import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hasContent, computeRecordDates, checkSwap, type LogLike } from './day-swap-rules.ts'

const L = (p: Partial<LogLike>): LogLike => ({
  date: '2026-10-21', template_id: 't-wed', is_custom: false, completed: false,
  result_value: null, memo: null, sets_detail: null, ...p,
})

test('hasContent: 빈 행·단위만·공백 메모는 false', () => {
  assert.equal(hasContent(L({})), false)
  assert.equal(hasContent(L({ sets_detail: { weight_unit: 'lb' } })), false)
  assert.equal(hasContent(L({ sets_detail: {} })), false)
  assert.equal(hasContent(L({ sets_detail: '{}' })), false)
  assert.equal(hasContent(L({ memo: '  ' })), false)
})

test('hasContent: 완료·결과·메모·무게는 true', () => {
  assert.equal(hasContent(L({ completed: true })), true)
  assert.equal(hasContent(L({ result_value: '12:30' })), true)
  assert.equal(hasContent(L({ memo: '좋았음' })), true)
  assert.equal(hasContent(L({ sets_detail: { weight: 135, weight_unit: 'lb' } })), true)
  assert.equal(hasContent(L({ sets_detail: '{"weight":95}' })), true)
})

test('computeRecordDates는 그 날 코치 템플릿에 붙은 내용 있는 로그만', () => {
  const ids = new Map([['2026-10-21', new Set(['t-wed'])], ['2026-10-22', new Set(['t-thu'])]])
  assert.deepEqual([...computeRecordDates([L({ completed: true })], ids)], ['2026-10-21'])
  assert.deepEqual([...computeRecordDates([L({})], ids)], [])
  assert.deepEqual([...computeRecordDates([L({ completed: true, template_id: 't-thu' })], ids)], [])
  assert.deepEqual([...computeRecordDates([L({ completed: true, is_custom: true, template_id: null })], ids)], [])
})

test('checkSwap 규칙과 순서', () => {
  const ctx = {
    coachDates: new Set(['2026-10-19', '2026-10-21', '2026-10-22', '2026-10-27']),
    recordDates: new Set(['2026-10-19']),
  }
  assert.equal(checkSwap('2026-10-21', '2026-10-21', ctx), '같은 날짜끼리는 바꿀 수 없어요')
  assert.equal(checkSwap('2026-10-22', '2026-10-27', ctx), '같은 주 안에서만 바꿀 수 있어요')
  assert.equal(checkSwap('2026-10-21', '2026-10-24', ctx), '운동이 없는 날은 바꿀 수 없어요')
  assert.equal(checkSwap('2026-10-19', '2026-10-21', ctx), '기록이 있는 날은 바꿀 수 없어요')
  assert.equal(checkSwap('2026-10-22', '2026-10-21', ctx), null)
})
