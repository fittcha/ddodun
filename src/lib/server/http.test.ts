import { test } from 'node:test'
import assert from 'node:assert/strict'
import { HttpError, assertOwn, toResponse } from './http.ts'
import type { SessionPayload } from './session.ts'

const session: SessionPayload = {
  user_id: 'eea07b65-70dd-468d-b63f-354fc0754efb',
  username: 'jindun',
  role: 'athlete',
  exp: 9_999_999_999,
}

test('본인 id면 통과한다', () => {
  assert.doesNotThrow(() => assertOwn(session, session.user_id))
})

test('남의 id면 403을 던진다', () => {
  assert.throws(
    () => assertOwn(session, 'ad0e098e-2629-4a3a-a2e4-37977e49194c'),
    (e: unknown) => e instanceof HttpError && e.status === 403,
  )
})

test('HttpError는 상태코드를 담은 Response로 변환된다', async () => {
  const res = toResponse(new HttpError(401, 'unauthorized'))
  assert.equal(res.status, 401)
  assert.deepEqual(await res.json(), { error: 'unauthorized' })
})

test('알 수 없는 예외는 500으로 변환되고 내부 메시지를 노출하지 않는다', async () => {
  const res = toResponse(new Error('connection string leaked'))
  assert.equal(res.status, 500)
  assert.deepEqual(await res.json(), { error: 'internal error' })
})
