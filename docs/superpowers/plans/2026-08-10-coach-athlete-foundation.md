# 코치/선수 분리 — A. 기반 공사 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앱을 겉보기 변화 없이 유지한 채, 코치/선수 역할과 프로그램·버전·배정 스키마를 도입하고 모든 DB 접근을 서버 API Route 뒤로 옮긴다.

**Architecture:** 기존 `workout_templates` 행의 id를 하나도 바꾸지 않고, 그 위에 `programs` / `program_versions` / `program_version_templates`(N:M) / `program_assignments` 레이어를 얹는다. 클라이언트의 Supabase 직접 접근을 없애고 Next.js Route Handler가 세션 쿠키를 검증해 `user_id`를 강제한다. 마지막에 `anon` 롤 권한을 회수한다.

**Tech Stack:** Next.js 16 (App Router), TypeScript 5, Supabase JS 2, Node 24 내장 `node:test` / `node:crypto`. **새 npm 의존성은 추가하지 않는다.**

## Global Constraints

- 원본 스펙: `docs/superpowers/specs/2026-08-10-coach-athlete-platform-design.md`
- **기존 `workout_templates` 741행의 `id`는 절대 변경·삭제하지 않는다.** 로그 659행과 `workout_day_summaries.blocks[].template_ids`가 이 id를 참조한다.
- 새 npm 의존성 금지. 암호화는 `node:crypto`, 테스트는 `node:test`만 사용한다.
- 테스트 파일은 소스 옆에 `*.test.ts`로 두고 **상대 경로로 import 한다** (`./session.ts`). `@/` 별칭은 `node --test`에서 해석되지 않는다.
- 서버 전용 모듈은 `src/lib/server/` 아래에만 두고, 클라이언트 컴포넌트에서 import 하지 않는다.
- `role` 값은 `'athlete' | 'coach'` 두 개뿐이다.
- 세션 쿠키 이름은 `ddodun_session`, 서명 시크릿 환경변수는 `SESSION_SECRET`이다.
- PIN 해시 저장 형식은 `scrypt$<salt_hex>$<hash_hex>`이다.
- 날짜 판정(`today`)은 서버 시각 KST 기준이다. 클라이언트 시각을 신뢰하지 않는다.
- 프로그램 주간 범위는 `week_start_date`(월요일) ~ `+6일`이다.
- 커밋은 각 태스크 끝에서 한 번. 커밋 메시지는 한국어, 기존 컨벤션(`feat:`, `fix:`, `docs:`, `refactor:`)을 따른다.

## 파일 구조

**신규 (서버)**

| 파일 | 책임 |
|---|---|
| `src/lib/server/session.ts` | 세션 토큰 서명·검증 (순수 함수) |
| `src/lib/server/pin.ts` | PIN 해싱·검증, 평문 업그레이드 판정 (순수 함수) |
| `src/lib/server/db.ts` | service role Supabase 클라이언트 |
| `src/lib/server/auth.ts` | 쿠키 → 세션, `requireUser`/`requireCoach`/`assertOwn`, 에러 → Response |
| `src/lib/server/programs.ts` | 주 범위 계산(순수) + 날짜→배정 프로그램→템플릿 해석(DB) |

**신규 (라우트)** — `src/app/api/` 아래. 태스크 4·8·9·10에서 순차 생성.

**신규 (스크립트/SQL)**

| 파일 | 책임 |
|---|---|
| `docs/sql/migration-coach-athlete.sql` | 스키마 마이그레이션 (한 트랜잭션) |
| `scripts/snapshot-invariants.mjs` | 마이그레이션 전후 불변식 스냅샷 생성 |
| `scripts/verify-migration.mjs` | 두 스냅샷 비교 및 불변식 판정 |

**수정**

| 파일 | 변경 |
|---|---|
| `src/lib/api/*.ts` (8개) | 본문을 `supabase.from(...)` → `fetch('/api/...')`로 교체. `userId` 인자 제거 |
| `src/lib/auth.ts` | localStorage 사용자 저장 제거. 마지막 username만 유지 |
| `src/hooks/useSession.ts` | 신규. `/api/auth/session` 조회 훅 |
| `src/components/auth/AuthGuard.tsx`, `src/app/{page,login/page,pr/page,settings/page,workout/page}.tsx` | `getLoggedInUser()` → `useSession()` |
| `src/lib/supabase.ts` | 태스크 11에서 삭제 |
| `package.json` | `"test": "node --test"` 추가 |

---

## Task 1: 테스트 러너 도입 + 세션 토큰 모듈

**Files:**
- Create: `src/lib/server/session.ts`
- Test: `src/lib/server/session.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `interface SessionPayload { user_id: string; username: string; role: 'athlete' | 'coach'; exp: number }`
  - `signSession(payload: SessionPayload, secret: string): string`
  - `verifySession(token: string, secret: string, nowSeconds: number): SessionPayload | null`

`nowSeconds`를 인자로 받는 이유는 만료 로직을 시계 없이 테스트하기 위해서다.

- [ ] **Step 1: `package.json`에 test 스크립트 추가**

`"scripts"` 블록을 다음으로 교체한다.

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "node --test"
  },
```

- [ ] **Step 2: 실패하는 테스트 작성**

`src/lib/server/session.test.ts`:

```ts
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
```

- [ ] **Step 3: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module './session.ts'`

- [ ] **Step 4: 구현**

`src/lib/server/session.ts`:

```ts
import { createHmac, timingSafeEqual } from 'node:crypto'

export interface SessionPayload {
  user_id: string
  username: string
  role: 'athlete' | 'coach'
  exp: number
}

function sign(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url')
}

export function signSession(payload: SessionPayload, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${sign(body, secret)}`
}

export function verifySession(
  token: string,
  secret: string,
  nowSeconds: number,
): SessionPayload | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts

  const expected = sign(body, secret)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  let payload: SessionPayload
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    return null
  }

  if (typeof payload.exp !== 'number' || payload.exp <= nowSeconds) return null
  if (payload.role !== 'athlete' && payload.role !== 'coach') return null
  if (typeof payload.user_id !== 'string' || typeof payload.username !== 'string') return null

  return payload
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 5 tests

- [ ] **Step 6: 커밋**

```bash
git add package.json src/lib/server/session.ts src/lib/server/session.test.ts
git commit -m "feat(auth): 세션 토큰 서명/검증 모듈 및 node:test 러너 도입"
```

---

## Task 2: PIN 해싱 모듈

**Files:**
- Create: `src/lib/server/pin.ts`
- Test: `src/lib/server/pin.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `hashPin(pin: string): string` — `scrypt$<salt_hex>$<hash_hex>` 반환
  - `interface PinCheck { ok: boolean; needsUpgrade: boolean }`
  - `checkPin(stored: string | null, pin: string): PinCheck`

`needsUpgrade`는 저장값이 평문이었고 PIN이 일치할 때만 `true`다. 호출부(태스크 4)가 이 신호를 보고 해시로 교체한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/server/pin.test.ts`:

```ts
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
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module './pin.ts'`

- [ ] **Step 3: 구현**

`src/lib/server/pin.ts`:

```ts
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 12 tests (Task 1의 5개 포함)

- [ ] **Step 5: 커밋**

```bash
git add src/lib/server/pin.ts src/lib/server/pin.test.ts
git commit -m "feat(auth): scrypt PIN 해싱 및 평문 자동 업그레이드 판정"
```

---

## Task 3: 서버 DB 클라이언트 + 권한 게이트

**Files:**
- Create: `src/lib/server/db.ts`, `src/lib/server/http.ts`, `src/lib/server/auth.ts`
- Test: `src/lib/server/http.test.ts`

**Interfaces:**
- Consumes: `SessionPayload`, `verifySession` (Task 1)
- Produces:
  - `db` — service role Supabase 클라이언트 (`ddodun` 스키마), `src/lib/server/db.ts`
  - `class HttpError extends Error { status: number }` — `src/lib/server/http.ts`
  - `assertOwn(session: SessionPayload, userId: string): void` — 본인 아니면 `HttpError(403)`, `src/lib/server/http.ts`
  - `toResponse(err: unknown): Response` — `src/lib/server/http.ts`
  - `SESSION_COOKIE = 'ddodun_session'` — `src/lib/server/auth.ts`
  - `getSession(): Promise<SessionPayload | null>` — `src/lib/server/auth.ts`
  - `requireUser(): Promise<SessionPayload>` — 없으면 `HttpError(401)`
  - `requireCoach(): Promise<SessionPayload>` — 코치 아니면 `HttpError(403)`
  - `auth.ts`는 `HttpError`·`assertOwn`·`toResponse`를 re-export 한다. 이후 태스크의 라우트는 전부 `@/lib/server/auth`에서 import 하면 된다.

**순수 로직을 `http.ts`로 분리하는 이유:** `auth.ts`는 `next/headers`의 `cookies()`를 import 하는데, 이 모듈은 Next.js 런타임 밖(`node --test`)에서 로드되지 않는다. `HttpError`·`assertOwn`·`toResponse`는 Next에 의존하지 않으므로 `http.ts`에 두고 거기서 테스트한다. `getSession`/`requireUser`/`requireCoach`는 단위 테스트하지 않고 태스크 4에서 curl로 검증한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/server/http.test.ts`:

```ts
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
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module './http.ts'`

- [ ] **Step 3: `src/lib/server/db.ts` 구현**

```ts
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL 및 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다')
}

/** 서버 전용. 클라이언트 컴포넌트에서 import 하지 말 것. */
export const db = createClient(url, serviceKey, {
  db: { schema: 'ddodun' },
  auth: { persistSession: false, autoRefreshToken: false },
})
```

- [ ] **Step 4: `src/lib/server/http.ts` 구현**

```ts
import type { SessionPayload } from './session'

export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

export function assertOwn(session: SessionPayload, userId: string): void {
  if (session.user_id !== userId) throw new HttpError(403, 'forbidden')
}

export function toResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return Response.json({ error: err.message }, { status: err.status })
  }
  console.error(err)
  return Response.json({ error: 'internal error' }, { status: 500 })
}
```

- [ ] **Step 5: `src/lib/server/auth.ts` 구현**

```ts
import { cookies } from 'next/headers'
import { verifySession, type SessionPayload } from './session'
import { HttpError } from './http'

export { HttpError, assertOwn, toResponse } from './http'

export const SESSION_COOKIE = 'ddodun_session'

function secret(): string {
  const s = process.env.SESSION_SECRET
  if (!s) throw new Error('SESSION_SECRET 이 설정되지 않았습니다')
  return s
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies()
  const raw = jar.get(SESSION_COOKIE)?.value
  if (!raw) return null
  return verifySession(raw, secret(), Math.floor(Date.now() / 1000))
}

export async function requireUser(): Promise<SessionPayload> {
  const s = await getSession()
  if (!s) throw new HttpError(401, 'unauthorized')
  return s
}

export async function requireCoach(): Promise<SessionPayload> {
  const s = await requireUser()
  if (s.role !== 'coach') throw new HttpError(403, 'forbidden')
  return s
}
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 16 tests

- [ ] **Step 7: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 8: 커밋**

```bash
git add src/lib/server/db.ts src/lib/server/http.ts src/lib/server/auth.ts src/lib/server/http.test.ts
git commit -m "feat(auth): 서버 전용 Supabase 클라이언트 및 권한 게이트 추가"
```

---

## Task 4: 인증 API 라우트

**Files:**
- Create: `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`, `src/app/api/auth/session/route.ts`
- Modify: `.env.local` (`SESSION_SECRET` 추가)

**Interfaces:**
- Consumes: `db` (Task 3), `signSession` (Task 1), `hashPin`/`checkPin` (Task 2), `getSession`/`toResponse` (Task 3)
- Produces:
  - `POST /api/auth/login` — body `{ username: string, pin: string, autoLogin: boolean }` → `200 { user: { id, username, role } }` + `Set-Cookie`, 또는 `404 { error: 'user not found' }` / `401 { error: 'invalid pin' }`
  - `POST /api/auth/login` — 사용자의 `pin_hash`가 `null`이면 전달된 PIN을 그대로 설정하고 로그인시킨다 (최초 로그인)
  - `POST /api/auth/logout` → `200`, 쿠키 만료
  - `GET /api/auth/session` → `200 { user: { id, username, role } }` 또는 `401`

- [ ] **Step 1: `users.role` 컬럼 선행 추가 (사용자 수동)**

로그인 라우트가 `users.role`을 select 한다. 이 컬럼은 태스크 6의 마이그레이션에서 만들어지지만, 그때까지 기다리면 태스크 4의 검증이 PostgREST 에러(`column users.role does not exist`)로 실패한다. 컬럼만 먼저 추가한다.

실행자는 사람에게 요청한다. 자동 실행하지 않는다.

> Supabase SQL Editor에서 아래를 실행해 주세요.
>
> ```sql
> ALTER TABLE ddodun.users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'athlete';
> ALTER TABLE ddodun.users DROP CONSTRAINT IF EXISTS users_role_check;
> ALTER TABLE ddodun.users ADD CONSTRAINT users_role_check CHECK (role IN ('athlete', 'coach'));
> ```

태스크 6의 마이그레이션 SQL 1번 블록도 같은 문장을 `IF NOT EXISTS` / `DROP ... IF EXISTS`로 갖고 있으므로, 여기서 먼저 실행해도 그쪽이 중복 실패하지 않는다.

확인:

```bash
set -a && . ./.env.local && set +a
curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?select=username,role" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Accept-Profile: ddodun"
```
Expected: 두 계정 모두 `"role":"athlete"`

- [ ] **Step 2: `SESSION_SECRET` 생성 및 등록**

Run:
```bash
node -e "console.log('SESSION_SECRET=' + require('node:crypto').randomBytes(32).toString('hex'))" >> .env.local
tail -1 .env.local
```
Expected: `SESSION_SECRET=<64자리 hex>` 가 출력되고 `.env.local` 마지막 줄에 추가됨

`.env.local`은 git에 커밋되지 않는다. 배포 환경(Vercel)에도 같은 이름으로 등록해야 한다 — 이 계획 범위 밖이며 배포 시 수동으로 한다.

- [ ] **Step 3: `src/app/api/auth/login/route.ts` 구현**

```ts
import { db } from '@/lib/server/db'
import { signSession } from '@/lib/server/session'
import { hashPin, checkPin } from '@/lib/server/pin'
import { SESSION_COOKIE, toResponse } from '@/lib/server/auth'

const THIRTY_DAYS = 60 * 60 * 24 * 30
const ONE_DAY = 60 * 60 * 24

export async function POST(req: Request) {
  try {
    const { username, pin, autoLogin } = await req.json()

    if (typeof username !== 'string' || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }

    const { data: user, error } = await db
      .from('users')
      .select('id, username, role, pin_hash')
      .eq('username', username.trim())
      .maybeSingle()
    if (error) throw error
    if (!user) return Response.json({ error: 'user not found' }, { status: 404 })

    if (user.pin_hash === null) {
      // 최초 로그인: 전달된 PIN을 설정한다
      const { error: upErr } = await db
        .from('users')
        .update({ pin_hash: hashPin(pin) })
        .eq('id', user.id)
      if (upErr) throw upErr
    } else {
      const { ok, needsUpgrade } = checkPin(user.pin_hash, pin)
      if (!ok) return Response.json({ error: 'invalid pin' }, { status: 401 })
      if (needsUpgrade) {
        const { error: upErr } = await db
          .from('users')
          .update({ pin_hash: hashPin(pin) })
          .eq('id', user.id)
        if (upErr) throw upErr
      }
    }

    const maxAge = autoLogin === true ? THIRTY_DAYS : ONE_DAY
    const secret = process.env.SESSION_SECRET
    if (!secret) throw new Error('SESSION_SECRET 이 설정되지 않았습니다')

    const token = signSession(
      {
        user_id: user.id,
        username: user.username,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + maxAge,
      },
      secret,
    )

    const parts = [
      `${SESSION_COOKIE}=${token}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
    ]
    if (autoLogin === true) parts.push(`Max-Age=${maxAge}`)
    if (process.env.NODE_ENV === 'production') parts.push('Secure')

    return Response.json(
      { user: { id: user.id, username: user.username, role: user.role } },
      { headers: { 'Set-Cookie': parts.join('; ') } },
    )
  } catch (err) {
    return toResponse(err)
  }
}
```

`autoLogin`이 `false`면 `Max-Age`를 붙이지 않아 브라우저 세션 쿠키가 된다(창을 닫으면 사라짐). 토큰 자체의 `exp`는 1일이다.

- [ ] **Step 4: `src/app/api/auth/logout/route.ts` 구현**

```ts
import { SESSION_COOKIE } from '@/lib/server/auth'

export async function POST() {
  return Response.json(
    { ok: true },
    {
      headers: {
        'Set-Cookie': `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
      },
    },
  )
}
```

- [ ] **Step 5: `src/app/api/auth/session/route.ts` 구현**

```ts
import { getSession, toResponse } from '@/lib/server/auth'

export async function GET() {
  try {
    const s = await getSession()
    if (!s) return Response.json({ error: 'unauthorized' }, { status: 401 })
    return Response.json({
      user: { id: s.user_id, username: s.username, role: s.role },
    })
  } catch (err) {
    return toResponse(err)
  }
}
```

- [ ] **Step 6: 개발 서버를 띄우고 로그인 왕복을 검증**

Run:
```bash
npm run dev > /tmp/ddodun-dev.log 2>&1 &
until curl -sf localhost:3000/api/auth/session -o /dev/null -w '%{http_code}' | grep -q 401; do sleep 1; done
echo "server up"

echo "--- 없는 사용자 ---"
curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:3000/api/auth/login \
  -H 'content-type: application/json' -d '{"username":"nobody","pin":"1234","autoLogin":false}'

echo "--- 틀린 PIN ---"
curl -s -o /dev/null -w '%{http_code}\n' -X POST localhost:3000/api/auth/login \
  -H 'content-type: application/json' -d '{"username":"jindun","pin":"0000","autoLogin":false}'

echo "--- 올바른 PIN (실제 PIN으로 치환) ---"
curl -s -c /tmp/ddodun-cookie -X POST localhost:3000/api/auth/login \
  -H 'content-type: application/json' -d '{"username":"jindun","pin":"REAL_PIN","autoLogin":true}'

echo; echo "--- 세션 조회 ---"
curl -s -b /tmp/ddodun-cookie localhost:3000/api/auth/session
```

Expected:
- 없는 사용자 → `404`
- 틀린 PIN → `401`
- 올바른 PIN → `{"user":{"id":"eea07b65-...","username":"jindun","role":"athlete"}}`
- 세션 조회 → 같은 user 객체

`REAL_PIN`은 실행자가 실제 PIN으로 바꾼다. Step 1에서 `role` 컬럼을 추가했으므로 `"role":"athlete"`가 함께 나와야 한다.

- [ ] **Step 7: 평문 PIN이 해시로 업그레이드되었는지 확인**

Run:
```bash
set -a && . ./.env.local && set +a
curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?select=username,pin_hash" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Accept-Profile: ddodun"
```
Expected: `jindun`의 `pin_hash`가 `scrypt$...`로 시작한다. 아직 로그인하지 않은 `chacha`는 평문 그대로다.

- [ ] **Step 8: 개발 서버 종료 및 커밋**

```bash
kill %1
git add src/app/api/auth
git commit -m "feat(auth): 로그인/로그아웃/세션 조회 API 라우트 추가"
```

---

## Task 5: 클라이언트를 서버 세션으로 전환

**Files:**
- Create: `src/hooks/useSession.ts`
- Modify: `src/lib/auth.ts`, `src/components/auth/AuthGuard.tsx`, `src/app/login/page.tsx`, `src/app/page.tsx`, `src/app/pr/page.tsx`, `src/app/settings/page.tsx`, `src/app/workout/page.tsx`
- Delete: `src/lib/api/users.ts`

**Interfaces:**
- Consumes: `/api/auth/*` (Task 4)
- Produces:
  - `interface SessionUser { id: string; username: string; role: 'athlete' | 'coach' }`
  - `useSession(): { user: SessionUser | null; loading: boolean }`
  - `logout(): Promise<void>` (`src/lib/auth.ts`)
  - `getLastUsername(): string` / `setLastUsername(username: string): void` (유지)

기존 `getLoggedInUser()`와 `setLoggedInUser()`는 제거한다. 페이지들은 `user.id`를 계속 쓰지만 출처가 localStorage에서 서버 세션으로 바뀐다. API 함수 시그니처는 이 태스크에서 바꾸지 않는다 — 태스크 9·10에서 바꾼다.

- [ ] **Step 1: `src/lib/auth.ts` 교체**

전체 내용을 다음으로 바꾼다.

```ts
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
```

- [ ] **Step 2: `src/hooks/useSession.ts` 생성**

```ts
'use client'

import { useEffect, useState } from 'react'
import type { SessionUser } from '@/lib/auth'

export function useSession(): { user: SessionUser | null; loading: boolean } {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetch('/api/auth/session')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (alive) setUser(data?.user ?? null)
      })
      .catch(() => {
        if (alive) setUser(null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return { user, loading }
}
```

- [ ] **Step 3: `src/components/auth/AuthGuard.tsx` 교체**

```tsx
'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from '@/hooks/useSession'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.replace('/login')
    }
  }, [loading, user, pathname, router])

  if (loading) return null
  if (pathname === '/login') return <>{children}</>
  if (!user) return null
  return <>{children}</>
}
```

- [ ] **Step 4: `src/app/login/page.tsx` 수정**

`@/lib/api/users`와 `setLoggedInUser` import를 제거하고, username 단계와 PIN 단계를 하나의 로그인 호출로 합친다.

import 문을 다음으로 교체한다.

```tsx
import { getLastUsername, setLastUsername } from '@/lib/auth'
```

`handleNext`(username 제출)는 사용자 존재 여부만 확인해야 하는데, 이제 그 조회 API가 없다. **PIN 입력 화면으로 그냥 진행시키고, 존재하지 않는 사용자는 로그인 시점에 판별한다.** `handleNext`를 다음으로 교체한다.

```tsx
  async function handleNext() {
    if (!username.trim()) return
    setUsernameError('')
    setStep('pin-verify')
  }
```

PIN 제출 핸들러(기존 `verifyPin`을 호출하던 함수)를 다음으로 교체한다. 함수 이름은 기존 파일에서 사용하는 이름을 유지한다.

```tsx
  async function submitPin(pin: string) {
    setPinError(false)
    setPinErrorMessage('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), pin, autoLogin }),
      })
      if (res.status === 404) {
        setStep('username')
        setUsernameError('등록되지 않은 사용자입니다')
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
```

기존의 `pin-setup` / `pin-setup-confirm` 단계는 서버가 최초 로그인 시 PIN을 자동 설정하므로 더 이상 필요 없다. 해당 단계와 관련 상태(`setupPin`, `user`)를 제거하고 `Step` 타입을 다음으로 좁힌다.

```tsx
type Step = 'username' | 'pin-verify'
```

- [ ] **Step 5: 나머지 4개 페이지에서 `getLoggedInUser()` 교체**

`src/app/page.tsx`, `src/app/pr/page.tsx`, `src/app/settings/page.tsx`, `src/app/workout/page.tsx` 각각에서:

- `import { getLoggedInUser } from '@/lib/auth'` → `import { useSession } from '@/hooks/useSession'`
- 컴포넌트 본문의 `const user = getLoggedInUser()` → `const { user } = useSession()`
- `user`가 `null`인 동안 데이터 조회를 하지 않도록, `user?.id`를 쓰는 `useEffect`의 의존성 배열에 `user`를 추가하고 본문 첫 줄에 `if (!user) return`을 넣는다.
- `settings/page.tsx`의 로그아웃 버튼은 `logout()`이 이제 async이므로 `await logout()` 후 `router.replace('/login')`을 호출하도록 바꾼다.

Run: `npx tsc --noEmit`
Expected: 에러 없음. 에러가 나면 해당 지점을 위 규칙대로 수정한다.

- [ ] **Step 6: `src/lib/api/users.ts` 삭제**

```bash
git rm src/lib/api/users.ts
npx tsc --noEmit
```
Expected: 에러 없음 (import 하던 곳은 Step 4에서 제거됨)

- [ ] **Step 7: 빌드 및 브라우저 왕복 확인**

Run: `npm run build`
Expected: 성공

그다음 `npm run dev`로 띄우고 브라우저에서 수동 확인한다. **PIN 인증 화면이 헤드리스 브라우저를 막으므로 이 단계는 사람이 직접 해야 한다.**

1. `/login`에서 `jindun`으로 로그인 → 홈으로 이동
2. 홈에 오늘/최근 운동이 이전과 동일하게 보임
3. 개발자도구 Application → Cookies에 `ddodun_session`이 `HttpOnly`로 존재
4. Local Storage에 `ddodun-user`가 **없음** (`ddodun-last-username`만 있음)
5. 설정에서 로그아웃 → `/login`으로 이동, 쿠키 사라짐

- [ ] **Step 8: 커밋**

```bash
git add -A src/lib/auth.ts src/hooks/useSession.ts src/components/auth/AuthGuard.tsx src/app
git commit -m "refactor(auth): localStorage 세션을 서버 httpOnly 쿠키 세션으로 전환"
```

---

## Task 6: 마이그레이션 SQL 작성 + 사전 스냅샷

**Files:**
- Create: `docs/sql/migration-coach-athlete.sql`, `scripts/snapshot-invariants.mjs`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `docs/sql/migration-coach-athlete.sql` — 사용자가 Supabase SQL Editor에서 실행
  - `node scripts/snapshot-invariants.mjs <출력파일>` — 불변식 스냅샷 JSON 생성

이 프로젝트의 Supabase 마이그레이션은 사용자가 수동으로 실행한다. 스크립트가 대신 실행하지 않는다.

- [ ] **Step 1: `scripts/snapshot-invariants.mjs` 작성**

```js
#!/usr/bin/env node
// 마이그레이션 전후 불변식 스냅샷. 사용법: node scripts/snapshot-invariants.mjs <out.json>
import { readFileSync, writeFileSync } from 'node:fs'

const out = process.argv[2]
if (!out) {
  console.error('사용법: node scripts/snapshot-invariants.mjs <out.json>')
  process.exit(1)
}

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)

const URL_BASE = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`
const HEADERS = {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  'Accept-Profile': 'ddodun',
}

async function all(path) {
  const rows = []
  const STEP = 1000
  for (let from = 0; ; from += STEP) {
    const res = await fetch(`${URL_BASE}/${path}`, {
      headers: { ...HEADERS, Range: `${from}-${from + STEP - 1}` },
    })
    if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`)
    const page = await res.json()
    rows.push(...page)
    if (page.length < STEP) break
  }
  return rows
}

const users = await all('users?select=id,username')
const templates = await all('workout_templates?select=id,date,extra_group_id')
const logs = await all('workout_logs?select=id,user_id,template_id')
const summaries = await all('workout_day_summaries?select=user_id,date,blocks')

const templateIds = new Set(templates.map(t => t.id))
const programTemplates = templates.filter(t => t.extra_group_id === null)
const extraTemplates = templates.filter(t => t.extra_group_id !== null)

// 날짜별 프로그램 템플릿 id (선수 무관 — 마이그레이션 후에는 배정으로 결정된다)
const byDate = {}
for (const t of programTemplates) (byDate[t.date] ??= []).push(t.id)
for (const d of Object.keys(byDate)) byDate[d].sort()

// 추가운동 행별 로그 주인
const extraOwners = {}
for (const t of extraTemplates) {
  const owners = [...new Set(logs.filter(l => l.template_id === t.id).map(l => l.user_id))]
  extraOwners[t.id] = owners.sort()
}

const danglingLogs = logs.filter(l => l.template_id && !templateIds.has(l.template_id)).map(l => l.id)
const danglingSummaryRefs = []
for (const s of summaries) {
  for (const b of s.blocks ?? []) {
    for (const id of b.template_ids ?? []) {
      if (!templateIds.has(id)) danglingSummaryRefs.push({ user_id: s.user_id, date: s.date, id })
    }
  }
}

const snapshot = {
  counts: {
    users: users.length,
    templates: templates.length,
    programTemplates: programTemplates.length,
    extraTemplates: extraTemplates.length,
    logs: logs.length,
    summaries: summaries.length,
  },
  users: users.map(u => u.id).sort(),
  programTemplatesByDate: byDate,
  extraOwners,
  danglingLogs,
  danglingSummaryRefs,
}

writeFileSync(out, JSON.stringify(snapshot, null, 2))
console.log(`스냅샷 저장: ${out}`)
console.log(JSON.stringify(snapshot.counts, null, 2))

const multiOwner = Object.entries(extraOwners).filter(([, o]) => o.length > 1)
if (multiOwner.length > 0) {
  console.error('\n경고: 로그 주인이 2명 이상인 추가운동 행이 있습니다. 마이그레이션 전에 수동 확인이 필요합니다.')
  console.error(JSON.stringify(multiOwner, null, 2))
  process.exit(2)
}
const noOwner = Object.entries(extraOwners).filter(([, o]) => o.length === 0)
if (noOwner.length > 0) {
  console.error('\n경고: 로그가 없어 주인을 판별할 수 없는 추가운동 행이 있습니다.')
  console.error(JSON.stringify(noOwner.map(([id]) => id), null, 2))
  process.exit(2)
}
```

- [ ] **Step 2: 사전 스냅샷 생성 및 사전 조건 확인**

Run: `node scripts/snapshot-invariants.mjs /tmp/ddodun-before.json`

Expected: 종료코드 0, `templates: 741`, `programTemplates: 735`, `extraTemplates: 6`, `logs: 659`, `danglingLogs: []`, `danglingSummaryRefs: []`

종료코드가 2면 **여기서 멈추고** 출력된 행을 사람이 확인한 뒤 마이그레이션 SQL의 5단계를 그에 맞게 조정한다.

`workout_day_summaries` 조회가 `permission denied`로 실패하면, 그 테이블에 service role 권한이 없는 것이다. Supabase SQL Editor에서 다음을 먼저 실행한다.

```sql
GRANT ALL ON ddodun.workout_day_summaries TO service_role;
```

- [ ] **Step 3: `docs/sql/migration-coach-athlete.sql` 작성**

```sql
-- 코치/선수 분리 마이그레이션 (A. 기반 공사)
-- Supabase SQL Editor에서 1회 실행.
-- 실행 전: scripts/snapshot-invariants.mjs 가 종료코드 0으로 통과해야 한다.
-- 실행 전: 아래 :coach_username 을 실제 코치 계정명으로 치환할 것.

BEGIN;

-- 1. 역할 컬럼
ALTER TABLE ddodun.users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'athlete';
ALTER TABLE ddodun.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE ddodun.users ADD CONSTRAINT users_role_check CHECK (role IN ('athlete', 'coach'));

-- 2. 코치 계정 신규 생성 (pin_hash NULL → 첫 로그인 시 설정됨)
INSERT INTO ddodun.users (username, role) VALUES ('coach', 'coach');

-- 3. 프로그램 테이블
CREATE TABLE ddodun.programs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id        uuid NOT NULL REFERENCES ddodun.users(id),
  title           text NOT NULL,
  week_start_date date NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_programs_week ON ddodun.programs (week_start_date);

CREATE TABLE ddodun.program_versions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id   uuid NOT NULL REFERENCES ddodun.programs(id) ON DELETE CASCADE,
  version_no   int  NOT NULL,
  status       text NOT NULL CHECK (status IN ('draft', 'published')),
  source_text  text,
  note         text,
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, version_no)
);

CREATE TABLE ddodun.program_version_templates (
  version_id  uuid NOT NULL REFERENCES ddodun.program_versions(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES ddodun.workout_templates(id) ON DELETE CASCADE,
  PRIMARY KEY (version_id, template_id)
);
CREATE INDEX idx_pvt_template ON ddodun.program_version_templates (template_id);

CREATE TABLE ddodun.program_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  uuid NOT NULL REFERENCES ddodun.programs(id) ON DELETE CASCADE,
  athlete_id  uuid NOT NULL REFERENCES ddodun.users(id) ON DELETE CASCADE,
  version_id  uuid NOT NULL REFERENCES ddodun.program_versions(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, athlete_id)
);
CREATE INDEX idx_assignments_athlete ON ddodun.program_assignments (athlete_id);

-- 4. 개인 추가운동 소유자 컬럼
ALTER TABLE ddodun.workout_templates
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES ddodun.users(id);
CREATE INDEX idx_templates_owner ON ddodun.workout_templates (owner_user_id, date)
  WHERE owner_user_id IS NOT NULL;

-- 5. 추가운동 6행의 소유자를 연결된 로그의 user_id로 채운다
UPDATE ddodun.workout_templates t
SET owner_user_id = sub.user_id
FROM (
  SELECT template_id, MIN(user_id::text)::uuid AS user_id
  FROM ddodun.workout_logs
  WHERE template_id IS NOT NULL
  GROUP BY template_id
) sub
WHERE t.id = sub.template_id
  AND t.extra_group_id IS NOT NULL;

DO $$
DECLARE orphan int;
BEGIN
  SELECT count(*) INTO orphan
  FROM ddodun.workout_templates
  WHERE extra_group_id IS NOT NULL AND owner_user_id IS NULL;
  IF orphan > 0 THEN
    RAISE EXCEPTION '소유자를 판별할 수 없는 추가운동 행 % 건. 중단합니다.', orphan;
  END IF;
END $$;

-- 6. 기존 735행을 주(월요일) 단위 레거시 프로그램 v1으로 묶는다
WITH coach AS (
  SELECT id FROM ddodun.users WHERE role = 'coach' ORDER BY created_at LIMIT 1
),
weeks AS (
  SELECT DISTINCT date_trunc('week', date)::date AS ws
  FROM ddodun.workout_templates
  WHERE extra_group_id IS NULL
),
ins_p AS (
  INSERT INTO ddodun.programs (coach_id, title, week_start_date)
  SELECT coach.id, to_char(weeks.ws, 'YYYY-MM-DD') || ' 주간 (레거시)', weeks.ws
  FROM weeks CROSS JOIN coach
  RETURNING id, week_start_date
),
ins_v AS (
  INSERT INTO ddodun.program_versions (program_id, version_no, status, published_at, note)
  SELECT id, 1, 'published', now(), '마이그레이션으로 생성된 레거시 버전'
  FROM ins_p
  RETURNING id, program_id
)
INSERT INTO ddodun.program_version_templates (version_id, template_id)
SELECT v.id, t.id
FROM ins_v v
JOIN ins_p p ON p.id = v.program_id
JOIN ddodun.workout_templates t
  ON t.extra_group_id IS NULL
 AND t.date BETWEEN p.week_start_date AND p.week_start_date + 6;

-- 7. 기존 선수 전원에게 모든 레거시 프로그램의 v1을 배정
INSERT INTO ddodun.program_assignments (program_id, athlete_id, version_id)
SELECT v.program_id, u.id, v.id
FROM ddodun.program_versions v
CROSS JOIN ddodun.users u
WHERE u.role = 'athlete';

-- 8. 사후 점검 (실패하면 트랜잭션 전체 롤백)
DO $$
DECLARE unlinked int;
BEGIN
  SELECT count(*) INTO unlinked
  FROM ddodun.workout_templates t
  WHERE t.extra_group_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM ddodun.program_version_templates pvt WHERE pvt.template_id = t.id
    );
  IF unlinked > 0 THEN
    RAISE EXCEPTION '어떤 버전에도 연결되지 않은 프로그램 템플릿 % 건. 롤백합니다.', unlinked;
  END IF;
END $$;

COMMIT;
```

`date_trunc('week', date)`는 PostgreSQL에서 월요일을 반환한다.

- [ ] **Step 4: 커밋** (아직 실행하지 않는다)

```bash
git add docs/sql/migration-coach-athlete.sql scripts/snapshot-invariants.mjs
git commit -m "feat(db): 코치/선수 분리 마이그레이션 SQL 및 불변식 스냅샷 스크립트"
```

---

## Task 7: 마이그레이션 실행 및 검증

**Files:**
- Create: `scripts/verify-migration.mjs`

**Interfaces:**
- Consumes: `scripts/snapshot-invariants.mjs` 출력 (Task 6)
- Produces: `node scripts/verify-migration.mjs <before.json> <after.json>` — 불변식 4개 판정, 실패 시 종료코드 1

- [ ] **Step 1: `scripts/verify-migration.mjs` 작성**

```js
#!/usr/bin/env node
// 마이그레이션 전후 스냅샷 비교. 사용법: node scripts/verify-migration.mjs <before.json> <after.json>
import { readFileSync } from 'node:fs'

const [beforePath, afterPath] = process.argv.slice(2)
if (!beforePath || !afterPath) {
  console.error('사용법: node scripts/verify-migration.mjs <before.json> <after.json>')
  process.exit(1)
}

const before = JSON.parse(readFileSync(beforePath, 'utf8'))
const after = JSON.parse(readFileSync(afterPath, 'utf8'))

const failures = []
function check(name, cond, detail) {
  if (cond) {
    console.log(`  OK   ${name}`)
  } else {
    console.log(`  FAIL ${name}`)
    failures.push({ name, detail })
  }
}

console.log('불변식 검증')

// 1. 모든 로그의 template_id가 존재하는 행을 가리킨다
check(
  '1. 고아 로그 없음',
  after.danglingLogs.length === 0,
  after.danglingLogs,
)

// 2. 프로그램 템플릿의 날짜별 id 집합이 완전히 동일하다
const dates = [...new Set([
  ...Object.keys(before.programTemplatesByDate),
  ...Object.keys(after.programTemplatesByDate),
])].sort()
const changed = dates.filter(d => {
  const b = (before.programTemplatesByDate[d] ?? []).join(',')
  const a = (after.programTemplatesByDate[d] ?? []).join(',')
  return b !== a
})
check('2. 날짜별 프로그램 템플릿 id 집합 동일', changed.length === 0, changed)

// 3. 저장된 요약의 template_ids가 전부 유효하다
check(
  '3. 요약의 template_ids 전부 유효',
  after.danglingSummaryRefs.length === 0,
  after.danglingSummaryRefs,
)

// 4. 행 수가 보존되었다 (코치 계정 1명 증가는 허용)
check(
  '4. 템플릿/로그 행 수 보존',
  after.counts.templates === before.counts.templates &&
    after.counts.logs === before.counts.logs &&
    after.counts.programTemplates === before.counts.programTemplates &&
    after.counts.extraTemplates === before.counts.extraTemplates,
  { before: before.counts, after: after.counts },
)

if (failures.length > 0) {
  console.error('\n실패한 불변식:')
  console.error(JSON.stringify(failures, null, 2))
  console.error('\n마이그레이션을 롤백해야 합니다.')
  process.exit(1)
}
console.log('\n모든 불변식 통과')
```

불변식 4의 `extraTemplates` 소유자 검증은 마이그레이션 SQL의 `DO $$` 블록이 트랜잭션 안에서 이미 강제한다(소유자 없으면 예외 → 롤백). 스냅샷 스크립트도 사전에 같은 조건을 확인한다.

- [ ] **Step 2: 사전 스냅샷 재생성**

Run: `node scripts/snapshot-invariants.mjs /tmp/ddodun-before.json`
Expected: 종료코드 0

- [ ] **Step 3: 마이그레이션 실행 (사용자 수동)**

이 단계는 실행자가 사람에게 요청한다. 자동 실행하지 않는다.

> `docs/sql/migration-coach-athlete.sql` 의 2번 블록에서 코치 계정명(`'coach'`)을 원하는 이름으로 바꾼 뒤, Supabase SQL Editor에서 파일 전체를 실행해 주세요. 성공하면 알려주세요.

- [ ] **Step 4: 사후 스냅샷 생성 및 비교**

Run:
```bash
node scripts/snapshot-invariants.mjs /tmp/ddodun-after.json
node scripts/verify-migration.mjs /tmp/ddodun-before.json /tmp/ddodun-after.json
```
Expected: `모든 불변식 통과`, 종료코드 0

실패하면 Supabase SQL Editor에서 아래로 롤백하고 원인을 수정한다.

```sql
BEGIN;
DROP TABLE IF EXISTS ddodun.program_assignments;
DROP TABLE IF EXISTS ddodun.program_version_templates;
DROP TABLE IF EXISTS ddodun.program_versions;
DROP TABLE IF EXISTS ddodun.programs;
ALTER TABLE ddodun.workout_templates DROP COLUMN IF EXISTS owner_user_id;
DELETE FROM ddodun.users WHERE role = 'coach';
ALTER TABLE ddodun.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE ddodun.users DROP COLUMN IF EXISTS role;
COMMIT;
```

- [ ] **Step 5: 배정 결과 확인**

Run:
```bash
set -a && . ./.env.local && set +a
H=(-H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" -H "Accept-Profile: ddodun")
echo "programs:";    curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/programs?select=id" "${H[@]}" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))"
echo "assignments:"; curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/program_assignments?select=id" "${H[@]}" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))"
echo "linked:";      curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/program_version_templates?select=template_id" "${H[@]}" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))"
```
Expected: `linked`가 735, `assignments`가 (프로그램 수 × 선수 2명)

- [ ] **Step 6: 커밋**

```bash
git add scripts/verify-migration.mjs
git commit -m "feat(db): 마이그레이션 불변식 검증 스크립트 및 실행 완료"
```

---

## Task 8: 프로그램 기반 템플릿 해석 + 운동 조회 API

**Files:**
- Create: `src/lib/server/programs.ts`, `src/lib/server/programs.test.ts`, `src/app/api/workouts/[date]/route.ts`, `src/app/api/calendar/[year]/[month]/route.ts`
- Modify: `src/lib/api/workout-templates.ts`

**Interfaces:**
- Consumes: `db` (Task 3), `requireUser`/`toResponse` (Task 3)
- Produces:
  - `weekStartOf(date: string): string` — 해당 날짜가 속한 주의 월요일 `YYYY-MM-DD`
  - `resolveTemplates(athleteId: string, date: string): Promise<WorkoutTemplate[]>` — 배정된 버전의 그 날짜 템플릿 + 본인 추가운동
  - `resolveTemplateDates(athleteId: string, startDate: string, endDate: string): Promise<string[]>`
  - `GET /api/workouts/[date]` → `{ templates: WorkoutTemplate[], extras: WorkoutTemplate[] }`
  - `GET /api/calendar/[year]/[month]` → `{ dates: string[] }`
  - `src/lib/api/workout-templates.ts`의 `getTemplatesByDate(date)` / `getExtraTemplatesByDate(date)` / `getTemplateDatesByMonth(year, month)` / `getTemplateDatesByRange(start, end)` — 시그니처 유지, 본문만 fetch로 교체

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/server/programs.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { weekStartOf } from './programs.ts'

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
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module './programs.ts'`

- [ ] **Step 3: `src/lib/server/programs.ts` 구현**

```ts
import { db } from './db'

export interface WorkoutTemplate {
  id: string
  date: string
  day_of_week: string
  section: string
  workout_type: string
  title: string | null
  description: string | null
  prescribed_sets: number | null
  prescribed_reps: string | null
  prescribed_weight: string | null
  prescribed_time: string | null
  rest_seconds: number | null
  notes: string | null
  sort_order: number
  extra_group_id: string | null
  extra_order: number | null
  owner_user_id: string | null
}

const COLUMNS =
  'id, date, day_of_week, section, workout_type, title, description, prescribed_sets, prescribed_reps, prescribed_weight, prescribed_time, rest_seconds, notes, sort_order, extra_group_id, extra_order, owner_user_id'

/** 주어진 날짜가 속한 주의 월요일. 입력·출력 모두 YYYY-MM-DD. */
export function weekStartOf(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  const dow = d.getUTCDay() // 0=일 … 6=토
  const back = dow === 0 ? 6 : dow - 1
  d.setUTCDate(d.getUTCDate() - back)
  return d.toISOString().slice(0, 10)
}

/** 선수에게 배정된, 해당 날짜를 포함하는 버전의 id. 없으면 null. */
async function assignedVersionId(athleteId: string, date: string): Promise<string | null> {
  const ws = weekStartOf(date)
  const { data, error } = await db
    .from('program_assignments')
    .select('version_id, programs!inner(week_start_date)')
    .eq('athlete_id', athleteId)
    .eq('programs.week_start_date', ws)
    .order('assigned_at', { ascending: false })
    .limit(1)
  if (error) throw error
  return data?.[0]?.version_id ?? null
}

/** 코치 프로그램 템플릿 (추가운동 제외). */
export async function resolveTemplates(athleteId: string, date: string): Promise<WorkoutTemplate[]> {
  const versionId = await assignedVersionId(athleteId, date)
  if (!versionId) return []

  const { data, error } = await db
    .from('program_version_templates')
    .select(`template_id, workout_templates!inner(${COLUMNS})`)
    .eq('version_id', versionId)
    .eq('workout_templates.date', date)
    .is('workout_templates.extra_group_id', null)
  if (error) throw error

  const rows = (data ?? []).map(
    r => (r as unknown as { workout_templates: WorkoutTemplate }).workout_templates,
  )
  rows.sort((a, b) =>
    a.section === b.section ? a.sort_order - b.sort_order : a.section.localeCompare(b.section),
  )
  return rows
}

/** 본인 소유 추가운동. */
export async function resolveExtras(athleteId: string, date: string): Promise<WorkoutTemplate[]> {
  const { data, error } = await db
    .from('workout_templates')
    .select(COLUMNS)
    .eq('date', date)
    .eq('owner_user_id', athleteId)
    .not('extra_group_id', 'is', null)
    .order('extra_order')
    .order('sort_order')
  if (error) throw error
  return (data ?? []) as WorkoutTemplate[]
}

/** 기간 내에 선수에게 운동이 배정된 날짜 목록. */
export async function resolveTemplateDates(
  athleteId: string,
  startDate: string,
  endDate: string,
): Promise<string[]> {
  const { data: assigns, error: aErr } = await db
    .from('program_assignments')
    .select('version_id')
    .eq('athlete_id', athleteId)
  if (aErr) throw aErr

  const versionIds = (assigns ?? []).map(a => a.version_id)
  if (versionIds.length === 0) return []

  const { data, error } = await db
    .from('program_version_templates')
    .select('workout_templates!inner(date)')
    .in('version_id', versionIds)
    .gte('workout_templates.date', startDate)
    .lte('workout_templates.date', endDate)
  if (error) throw error

  const dates = (data ?? []).map(
    r => (r as unknown as { workout_templates: { date: string } }).workout_templates.date,
  )
  return [...new Set(dates)].sort()
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 21 tests

- [ ] **Step 5: `src/app/api/workouts/[date]/route.ts` 구현**

```ts
import { requireUser, toResponse } from '@/lib/server/auth'
import { resolveTemplates, resolveExtras } from '@/lib/server/programs'

export async function GET(_req: Request, ctx: { params: Promise<{ date: string }> }) {
  try {
    const session = await requireUser()
    const { date } = await ctx.params
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }
    const [templates, extras] = await Promise.all([
      resolveTemplates(session.user_id, date),
      resolveExtras(session.user_id, date),
    ])
    return Response.json({ templates, extras })
  } catch (err) {
    return toResponse(err)
  }
}
```

- [ ] **Step 6: `src/app/api/calendar/[year]/[month]/route.ts` 구현**

```ts
import { requireUser, toResponse } from '@/lib/server/auth'
import { resolveTemplateDates } from '@/lib/server/programs'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ year: string; month: string }> },
) {
  try {
    const session = await requireUser()
    const { year, month } = await ctx.params
    const y = Number(year)
    const m = Number(month)
    if (!Number.isInteger(y) || !Number.isInteger(m) || m < 1 || m > 12) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }
    const start = `${y}-${String(m).padStart(2, '0')}-01`
    const end =
      m === 12
        ? `${y}-12-31`
        : new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)
    const dates = await resolveTemplateDates(session.user_id, start, end)
    return Response.json({ dates })
  } catch (err) {
    return toResponse(err)
  }
}
```

- [ ] **Step 7: `src/lib/api/workout-templates.ts` 본문 교체**

`WorkoutTemplate` 인터페이스에 `owner_user_id: string | null`을 추가하고, 네 함수의 본문을 fetch로 바꾼다. `duplicateSectionToToday`와 `deleteExtraGroup`은 태스크 10에서 바꾸므로 이 단계에서는 그대로 둔다.

```ts
async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url}: ${res.status}`)
  return res.json()
}

export async function getTemplateDatesByMonth(year: number, month: number): Promise<string[]> {
  const { dates } = await getJson<{ dates: string[] }>(`/api/calendar/${year}/${month}`)
  return dates
}

export async function getTemplateDatesByRange(startDate: string, endDate: string): Promise<string[]> {
  const { dates } = await getJson<{ dates: string[] }>(
    `/api/calendar/range?start=${startDate}&end=${endDate}`,
  )
  return dates
}

export async function getTemplatesByDate(date: string): Promise<WorkoutTemplate[]> {
  const { templates } = await getJson<{ templates: WorkoutTemplate[] }>(`/api/workouts/${date}`)
  return templates
}

export async function getExtraTemplatesByDate(date: string): Promise<WorkoutTemplate[]> {
  const { extras } = await getJson<{ extras: WorkoutTemplate[] }>(`/api/workouts/${date}`)
  return extras
}
```

- [ ] **Step 8: `src/app/api/calendar/range/route.ts` 추가**

`getTemplateDatesByRange`가 쓰는 엔드포인트다.

```ts
import { requireUser, toResponse } from '@/lib/server/auth'
import { resolveTemplateDates } from '@/lib/server/programs'

export async function GET(req: Request) {
  try {
    const session = await requireUser()
    const url = new URL(req.url)
    const start = url.searchParams.get('start')
    const end = url.searchParams.get('end')
    const ok = (s: string | null) => s !== null && /^\d{4}-\d{2}-\d{2}$/.test(s)
    if (!ok(start) || !ok(end)) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }
    const dates = await resolveTemplateDates(session.user_id, start!, end!)
    return Response.json({ dates })
  } catch (err) {
    return toResponse(err)
  }
}
```

Next.js 라우트 매칭에서 정적 세그먼트 `range`가 동적 세그먼트 `[year]`보다 우선하므로 충돌하지 않는다.

- [ ] **Step 9: 타입 체크 및 빌드**

Run: `npx tsc --noEmit && npm run build`
Expected: 성공

- [ ] **Step 10: 조회 결과가 마이그레이션 전과 같은지 확인**

Run:
```bash
npm run dev > /tmp/ddodun-dev.log 2>&1 &
until curl -sf localhost:3000/api/auth/session -o /dev/null -w '%{http_code}' | grep -q 401; do sleep 1; done
curl -s -c /tmp/ddodun-cookie -X POST localhost:3000/api/auth/login \
  -H 'content-type: application/json' -d '{"username":"jindun","pin":"REAL_PIN","autoLogin":true}' > /dev/null
for d in 2026-08-03 2026-08-10 2026-07-30; do
  echo -n "$d templates: "
  curl -s -b /tmp/ddodun-cookie "localhost:3000/api/workouts/$d" | python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d['templates']),'extras',len(d['extras']))"
done
kill %1
```
Expected: `2026-08-03` 6, `2026-08-10` 7, `2026-07-30` 7 (`docs/sql/week23·24·22-templates.sql`의 해당 요일 행 수와 일치)

- [ ] **Step 11: 커밋**

```bash
git add src/lib/server/programs.ts src/lib/server/programs.test.ts src/app/api/workouts src/app/api/calendar src/lib/api/workout-templates.ts
git commit -m "feat(workout): 템플릿 조회를 프로그램 배정 기반 서버 API로 전환"
```

---

## Task 9: 로그·요약 라우트 이관

**Files:**
- Create: `src/app/api/logs/route.ts`, `src/app/api/logs/[date]/route.ts`, `src/app/api/logs/dates/route.ts`, `src/app/api/summaries/[date]/route.ts`

`/api/logs/dates`(정적)와 `/api/logs/[date]`(동적)가 같은 레벨에 있다. Next.js는 정적 세그먼트를 우선 매칭하므로 충돌하지 않는다.
- Modify: `src/lib/api/workout-logs.ts`, `src/lib/api/day-summaries.ts`, `src/lib/day-summary.ts`, 호출부 5개 파일

**Interfaces:**
- Consumes: `requireUser`/`toResponse`/`db` (Task 3)
- Produces:
  - `GET /api/logs/[date]` → `{ logs: WorkoutLog[] }`
  - `POST /api/logs` — body는 `Partial<WorkoutLog> & { date: string }` → `{ log: WorkoutLog }`. `user_id`는 세션에서 주입되며 body의 값은 무시된다
  - `DELETE /api/logs?id=<uuid>` → `{ ok: true }`. 본인 로그가 아니면 403
  - `GET /api/logs/dates?year=&month=` → `{ dates: string[] }`
  - `GET /api/summaries/[date]` → `{ summary: DaySummary | null }`
  - `PUT /api/summaries/[date]` — body `{ text, blocks }` → `{ summary: DaySummary }`
  - `src/lib/api/workout-logs.ts`: `getLogDatesByMonth(year, month)`, `getLogsByDate(date)`, `upsertLog(log)`, `deleteLog(id)` — **`userId` 인자 제거**
  - `src/lib/api/day-summaries.ts`: `getDaySummary(date)`, `upsertDaySummary(date, text, blocks)` — **`userId` 인자 제거**

- [ ] **Step 1: `src/app/api/logs/route.ts` 구현**

```ts
import { db } from '@/lib/server/db'
import { requireUser, toResponse, HttpError } from '@/lib/server/auth'

export async function POST(req: Request) {
  try {
    const session = await requireUser()
    const body = await req.json()
    if (typeof body?.date !== 'string') {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }

    if (body.id) {
      const { data: existing, error: exErr } = await db
        .from('workout_logs')
        .select('user_id')
        .eq('id', body.id)
        .maybeSingle()
      if (exErr) throw exErr
      if (!existing) throw new HttpError(404, 'not found')
      if (existing.user_id !== session.user_id) throw new HttpError(403, 'forbidden')

      const { id, created_at, user_id, ...updates } = body
      const { data, error } = await db
        .from('workout_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return Response.json({ log: data })
    }

    const { id, created_at, user_id, ...insert } = body
    const { data, error } = await db
      .from('workout_logs')
      .insert({ ...insert, user_id: session.user_id })
      .select()
      .single()
    if (error) throw error
    return Response.json({ log: data })
  } catch (err) {
    return toResponse(err)
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireUser()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return Response.json({ error: 'bad request' }, { status: 400 })

    const { data: existing, error: exErr } = await db
      .from('workout_logs')
      .select('user_id')
      .eq('id', id)
      .maybeSingle()
    if (exErr) throw exErr
    if (!existing) throw new HttpError(404, 'not found')
    if (existing.user_id !== session.user_id) throw new HttpError(403, 'forbidden')

    const { error } = await db.from('workout_logs').delete().eq('id', id)
    if (error) throw error
    return Response.json({ ok: true })
  } catch (err) {
    return toResponse(err)
  }
}
```

- [ ] **Step 2: `src/app/api/logs/[date]/route.ts` 구현**

```ts
import { db } from '@/lib/server/db'
import { requireUser, toResponse } from '@/lib/server/auth'

export async function GET(_req: Request, ctx: { params: Promise<{ date: string }> }) {
  try {
    const session = await requireUser()
    const { date } = await ctx.params
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }
    const { data, error } = await db
      .from('workout_logs')
      .select(
        'id, date, user_id, template_id, section, is_custom, exercise_name, completed, result_value, result_unit, sets_detail, memo, created_at',
      )
      .eq('user_id', session.user_id)
      .eq('date', date)
      .order('section')
      .order('created_at')
    if (error) throw error
    return Response.json({ logs: data ?? [] })
  } catch (err) {
    return toResponse(err)
  }
}
```

- [ ] **Step 3: `src/app/api/logs/dates/route.ts` 구현**

```ts
import { db } from '@/lib/server/db'
import { requireUser, toResponse } from '@/lib/server/auth'

export async function GET(req: Request) {
  try {
    const session = await requireUser()
    const url = new URL(req.url)
    const year = Number(url.searchParams.get('year'))
    const month = Number(url.searchParams.get('month'))
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`

    const { data, error } = await db
      .from('workout_logs')
      .select('date')
      .eq('user_id', session.user_id)
      .eq('completed', true)
      .gte('date', start)
      .lt('date', end)
    if (error) throw error
    return Response.json({ dates: [...new Set((data ?? []).map(d => d.date))] })
  } catch (err) {
    return toResponse(err)
  }
}
```

- [ ] **Step 4: `src/app/api/summaries/[date]/route.ts` 구현**

```ts
import { db } from '@/lib/server/db'
import { requireUser, toResponse } from '@/lib/server/auth'

export async function GET(_req: Request, ctx: { params: Promise<{ date: string }> }) {
  try {
    const session = await requireUser()
    const { date } = await ctx.params
    const { data, error } = await db
      .from('workout_day_summaries')
      .select('*')
      .eq('user_id', session.user_id)
      .eq('date', date)
      .maybeSingle()
    if (error) throw error
    return Response.json({ summary: data })
  } catch (err) {
    return toResponse(err)
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ date: string }> }) {
  try {
    const session = await requireUser()
    const { date } = await ctx.params
    const { text, blocks } = await req.json()
    if (typeof text !== 'string' || !Array.isArray(blocks)) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }
    const { data, error } = await db
      .from('workout_day_summaries')
      .upsert(
        { user_id: session.user_id, date, text, blocks, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,date' },
      )
      .select()
      .single()
    if (error) throw error
    return Response.json({ summary: data })
  } catch (err) {
    return toResponse(err)
  }
}
```

- [ ] **Step 5: `src/lib/api/workout-logs.ts` 본문 교체**

`WorkoutLog` 인터페이스는 유지하고 네 함수를 다음으로 바꾼다.

```ts
export async function getLogDatesByMonth(year: number, month: number): Promise<string[]> {
  const res = await fetch(`/api/logs/dates?year=${year}&month=${month}`)
  if (!res.ok) throw new Error(`getLogDatesByMonth: ${res.status}`)
  const { dates } = await res.json()
  return dates
}

export async function getLogsByDate(date: string): Promise<WorkoutLog[]> {
  const res = await fetch(`/api/logs/${date}`)
  if (!res.ok) throw new Error(`getLogsByDate: ${res.status}`)
  const { logs } = await res.json()
  return logs
}

export async function upsertLog(log: Partial<WorkoutLog> & { date: string }): Promise<WorkoutLog> {
  const res = await fetch('/api/logs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(log),
  })
  if (!res.ok) throw new Error(`upsertLog: ${res.status}`)
  const { log: saved } = await res.json()
  return saved
}

export async function deleteLog(id: string): Promise<void> {
  const res = await fetch(`/api/logs?id=${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`deleteLog: ${res.status}`)
}
```

- [ ] **Step 6: `src/lib/api/day-summaries.ts` 본문 교체**

```ts
export async function getDaySummary(date: string): Promise<DaySummary | null> {
  const res = await fetch(`/api/summaries/${date}`)
  if (!res.ok) throw new Error(`getDaySummary: ${res.status}`)
  const { summary } = await res.json()
  return summary
}

export async function upsertDaySummary(
  date: string,
  text: string,
  blocks: DaySummaryBlock[],
): Promise<DaySummary> {
  const res = await fetch(`/api/summaries/${date}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, blocks }),
  })
  if (!res.ok) throw new Error(`upsertDaySummary: ${res.status}`)
  const { summary } = await res.json()
  return summary
}
```

- [ ] **Step 7: 호출부에서 `userId` 인자 제거**

Run: `npx tsc --noEmit`

타입 에러가 나는 모든 지점에서 첫 번째 `userId` 인자를 지운다. 대상 파일은 `src/app/page.tsx`, `src/app/workout/page.tsx`, `src/components/home/TodaySummary.tsx`, `src/components/workout/WorkoutSection.tsx`, `src/components/workout/CustomWorkoutForm.tsx`, `src/lib/day-summary.ts`이다.

`src/lib/day-summary.ts`와 `CustomWorkoutForm`은 `userId`를 prop으로 받고 있을 수 있다. 더 이상 쓰이지 않으면 prop 자체를 제거하고 부모의 전달도 지운다.

에러가 0이 될 때까지 반복한다.

- [ ] **Step 8: 빌드 및 브라우저 왕복 확인**

Run: `npm run build`
Expected: 성공

`npm run dev` 후 브라우저에서 (사람이 직접):
1. 운동 화면에서 결과값 입력 → 새로고침 → 값이 유지됨
2. 홈의 오늘 요약이 이전과 동일하게 생성됨
3. 캘린더에 기록한 날짜가 표시됨

- [ ] **Step 9: 커밋**

```bash
git add src/app/api/logs src/app/api/summaries src/lib/api src/lib/day-summary.ts src/app src/components
git commit -m "refactor(api): 로그·요약 조회/저장을 서버 API 라우트로 이관"
```

---

## Task 10: PR·WOD·대회 라우트 이관 및 추가운동 소유자 적용

**Files:**
- Create: `src/app/api/pr/onerm/route.ts`, `src/app/api/pr/nrm/route.ts`, `src/app/api/pr/pace/route.ts`, `src/app/api/wod/route.ts`, `src/app/api/competitions/route.ts`, `src/app/api/workouts/duplicate/route.ts`, `src/app/api/workouts/extra/[groupId]/route.ts`
- Modify: `src/lib/api/pr.ts`, `src/lib/api/wod.ts`, `src/lib/api/competitions.ts`, `src/lib/api/workout-templates.ts`

**Interfaces:**
- Consumes: `requireUser`/`toResponse`/`HttpError`/`db` (Task 3)
- Produces:
  - `src/lib/api/pr.ts`: `getAll1RM()`, `upsert1RM(exerciseName, weight, weightUnit)`, `delete1RM(id)`, `getAllNRM()`, `upsertNRM(exerciseName, repMax, weight, weightUnit)`, `deleteNRM(id)`, `getAllPaceRecords()`, `upsertPaceRecord(equipment, distance, timeSeconds)`, `deletePaceRecord(id)` — **`userId` 인자 제거**
  - `src/lib/api/wod.ts`: `getAllWodRecords()`, `getWodRecords(wodName)`, `createWodRecord(record)`, `deleteWodRecord(id)` — **`userId` 인자 제거**
  - `src/lib/api/competitions.ts`: `getCompetitionsByMonth(year, month)`, `getCompetitionByDate(date)`, `createCompetition(comp)`, `updateCompetition(id, comp)`, `deleteCompetition(id)` — **`userId` 인자 제거**
  - `src/lib/api/workout-templates.ts`: `duplicateSectionToDate(date, templates)` — **`duplicateSectionToToday`를 대체**. `deleteExtraGroup(extraGroupId)` 유지

기존 `pr.ts`의 세 upsert 함수는 `.upsert()`가 아니라 **select-then-update/insert** 패턴을 쓴다. 해당 테이블에 unique 제약이 있다는 보장이 없으므로 이 패턴을 그대로 옮긴다. 실제 테이블·키는 다음과 같다(기존 코드에서 확인함).

| 라우트 | 테이블 | 조회 키 | update 컬럼 |
|---|---|---|---|
| `pr/onerm` | `user_1rm` | `user_id`, `exercise_name` | `weight`, `weight_unit`, `updated_at` |
| `pr/nrm` | `user_nrm` | `user_id`, `exercise_name`, `rep_max` | `weight`, `weight_unit`, `updated_at` |
| `pr/pace` | `user_pace_records` | `user_id`, `equipment`, `distance` | `time_seconds`, `updated_at` |

- [ ] **Step 1: `src/app/api/pr/onerm/route.ts` 구현**

```ts
import { db } from '@/lib/server/db'
import { requireUser, toResponse, HttpError } from '@/lib/server/auth'

export async function GET() {
  try {
    const session = await requireUser()
    const { data, error } = await db
      .from('user_1rm')
      .select('*')
      .eq('user_id', session.user_id)
      .order('exercise_name')
    if (error) throw error
    return Response.json({ records: data ?? [] })
  } catch (err) {
    return toResponse(err)
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireUser()
    const { exerciseName, weight, weightUnit } = await req.json()
    if (typeof exerciseName !== 'string') {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }

    const { data: existing } = await db
      .from('user_1rm')
      .select('id')
      .eq('user_id', session.user_id)
      .eq('exercise_name', exerciseName)
      .maybeSingle()

    if (existing) {
      const { data, error } = await db
        .from('user_1rm')
        .update({ weight, weight_unit: weightUnit, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      return Response.json({ record: data })
    }

    const { data, error } = await db
      .from('user_1rm')
      .insert({
        user_id: session.user_id,
        exercise_name: exerciseName,
        weight,
        weight_unit: weightUnit,
      })
      .select()
      .single()
    if (error) throw error
    return Response.json({ record: data })
  } catch (err) {
    return toResponse(err)
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireUser()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return Response.json({ error: 'bad request' }, { status: 400 })

    const { data: existing, error: exErr } = await db
      .from('user_1rm')
      .select('user_id')
      .eq('id', id)
      .maybeSingle()
    if (exErr) throw exErr
    if (!existing) throw new HttpError(404, 'not found')
    if (existing.user_id !== session.user_id) throw new HttpError(403, 'forbidden')

    const { error } = await db.from('user_1rm').delete().eq('id', id)
    if (error) throw error
    return Response.json({ ok: true })
  } catch (err) {
    return toResponse(err)
  }
}
```

- [ ] **Step 2: `pr/nrm`·`pr/pace` 라우트 구현**

Step 1의 파일을 복사해 위 표대로 바꾼다.

`src/app/api/pr/nrm/route.ts` — 테이블 `user_nrm`. POST body는 `{ exerciseName, repMax, weight, weightUnit }`. 조회 조건에 `.eq('rep_max', repMax)`를 추가하고, insert에 `rep_max: repMax`를 포함한다. GET은 `.order('exercise_name')` 뒤에 `.order('rep_max')`를 추가한다.

`src/app/api/pr/pace/route.ts` — 테이블 `user_pace_records`. POST body는 `{ equipment, distance, timeSeconds }`. 조회 조건은 `.eq('equipment', equipment).eq('distance', distance)`, update는 `{ time_seconds: timeSeconds, updated_at: ... }`, insert는 `{ user_id, equipment, distance, time_seconds: timeSeconds }`. GET은 `.order('equipment')`.

- [ ] **Step 3: `src/app/api/wod/route.ts` 구현**

```ts
import { db } from '@/lib/server/db'
import { requireUser, toResponse, HttpError } from '@/lib/server/auth'

export async function GET(req: Request) {
  try {
    const session = await requireUser()
    const name = new URL(req.url).searchParams.get('name')
    let q = db
      .from('wod_records')
      .select('*')
      .eq('user_id', session.user_id)
      .order('recorded_at', { ascending: false })
    if (name) q = q.eq('wod_name', name)
    const { data, error } = await q
    if (error) throw error
    return Response.json({ records: data ?? [] })
  } catch (err) {
    return toResponse(err)
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireUser()
    const body = await req.json()
    const { id, user_id, created_at, ...record } = body
    const { data, error } = await db
      .from('wod_records')
      .insert({ ...record, user_id: session.user_id })
      .select()
      .single()
    if (error) throw error
    return Response.json({ record: data })
  } catch (err) {
    return toResponse(err)
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireUser()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return Response.json({ error: 'bad request' }, { status: 400 })

    const { data: existing, error: exErr } = await db
      .from('wod_records')
      .select('user_id')
      .eq('id', id)
      .maybeSingle()
    if (exErr) throw exErr
    if (!existing) throw new HttpError(404, 'not found')
    if (existing.user_id !== session.user_id) throw new HttpError(403, 'forbidden')

    const { error } = await db.from('wod_records').delete().eq('id', id)
    if (error) throw error
    return Response.json({ ok: true })
  } catch (err) {
    return toResponse(err)
  }
}
```

- [ ] **Step 4: `src/app/api/competitions/route.ts` 구현**

```ts
import { db } from '@/lib/server/db'
import { requireUser, toResponse, HttpError } from '@/lib/server/auth'

async function assertOwnCompetition(id: string, userId: string) {
  const { data, error } = await db
    .from('competitions')
    .select('user_id')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new HttpError(404, 'not found')
  if (data.user_id !== userId) throw new HttpError(403, 'forbidden')
}

export async function GET(req: Request) {
  try {
    const session = await requireUser()
    const params = new URL(req.url).searchParams
    const date = params.get('date')

    if (date) {
      const { data, error } = await db
        .from('competitions')
        .select('*')
        .eq('user_id', session.user_id)
        .eq('date', date)
        .maybeSingle()
      if (error) throw error
      return Response.json({ competition: data })
    }

    const year = Number(params.get('year'))
    const month = Number(params.get('month'))
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`

    const { data, error } = await db
      .from('competitions')
      .select('*')
      .eq('user_id', session.user_id)
      .gte('date', start)
      .lt('date', end)
      .order('date')
    if (error) throw error
    return Response.json({ competitions: data ?? [] })
  } catch (err) {
    return toResponse(err)
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireUser()
    const body = await req.json()
    const { id, user_id, created_at, ...comp } = body
    const { data, error } = await db
      .from('competitions')
      .insert({ ...comp, user_id: session.user_id })
      .select()
      .single()
    if (error) throw error
    return Response.json({ competition: data })
  } catch (err) {
    return toResponse(err)
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireUser()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return Response.json({ error: 'bad request' }, { status: 400 })
    await assertOwnCompetition(id, session.user_id)

    const body = await req.json()
    const { id: _i, user_id, created_at, ...updates } = body
    const { data, error } = await db
      .from('competitions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return Response.json({ competition: data })
  } catch (err) {
    return toResponse(err)
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireUser()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return Response.json({ error: 'bad request' }, { status: 400 })
    await assertOwnCompetition(id, session.user_id)

    const { error } = await db.from('competitions').delete().eq('id', id)
    if (error) throw error
    return Response.json({ ok: true })
  } catch (err) {
    return toResponse(err)
  }
}
```

- [ ] **Step 5: 추가운동 라우트 구현**

`src/app/api/workouts/duplicate/route.ts`:

```ts
import { db } from '@/lib/server/db'
import { requireUser, toResponse } from '@/lib/server/auth'

const DOW_CODES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

export async function POST(req: Request) {
  try {
    const session = await requireUser()
    const { date, templates } = await req.json()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Array.isArray(templates) || templates.length === 0) {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }

    const dow = DOW_CODES[new Date(`${date}T00:00:00Z`).getUTCDay()]

    const { data: existing, error: exErr } = await db
      .from('workout_templates')
      .select('extra_order')
      .eq('date', date)
      .eq('owner_user_id', session.user_id)
      .not('extra_group_id', 'is', null)
      .order('extra_order', { ascending: false })
      .limit(1)
    if (exErr) throw exErr
    const nextOrder = (existing?.[0]?.extra_order ?? 0) + 1
    const extraGroupId = crypto.randomUUID()

    const rows = templates.map((t: Record<string, unknown>) => ({
      date,
      day_of_week: dow,
      section: '추가운동',
      workout_type: t.workout_type,
      title: t.title,
      description: t.description,
      prescribed_sets: t.prescribed_sets,
      prescribed_reps: t.prescribed_reps,
      prescribed_weight: t.prescribed_weight,
      prescribed_time: t.prescribed_time,
      rest_seconds: t.rest_seconds,
      notes: t.notes,
      sort_order: t.sort_order,
      extra_group_id: extraGroupId,
      extra_order: nextOrder,
      owner_user_id: session.user_id,
    }))

    const { data, error } = await db.from('workout_templates').insert(rows).select()
    if (error) throw error
    return Response.json({ templates: data ?? [] })
  } catch (err) {
    return toResponse(err)
  }
}
```

`src/app/api/workouts/extra/[groupId]/route.ts`:

```ts
import { db } from '@/lib/server/db'
import { requireUser, toResponse, HttpError } from '@/lib/server/auth'

export async function DELETE(_req: Request, ctx: { params: Promise<{ groupId: string }> }) {
  try {
    const session = await requireUser()
    const { groupId } = await ctx.params

    const { data: rows, error: selErr } = await db
      .from('workout_templates')
      .select('id, owner_user_id')
      .eq('extra_group_id', groupId)
    if (selErr) throw selErr
    if (!rows || rows.length === 0) throw new HttpError(404, 'not found')
    if (rows.some(r => r.owner_user_id !== session.user_id)) {
      throw new HttpError(403, 'forbidden')
    }

    const ids = rows.map(r => r.id)
    const { error: logErr } = await db.from('workout_logs').delete().in('template_id', ids)
    if (logErr) throw logErr
    const { error: tplErr } = await db
      .from('workout_templates')
      .delete()
      .eq('extra_group_id', groupId)
    if (tplErr) throw tplErr

    return Response.json({ ok: true })
  } catch (err) {
    return toResponse(err)
  }
}
```

- [ ] **Step 6: 클라이언트 API 파일 본문 교체**

`src/lib/api/workout-templates.ts`의 `duplicateSectionToToday`를 삭제하고 다음을 추가한다.

```ts
export async function duplicateSectionToDate(
  date: string,
  templates: WorkoutTemplate[],
): Promise<WorkoutTemplate[]> {
  if (templates.length === 0) return []
  const res = await fetch('/api/workouts/duplicate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ date, templates }),
  })
  if (!res.ok) throw new Error(`duplicateSectionToDate: ${res.status}`)
  const { templates: created } = await res.json()
  return created
}

export async function deleteExtraGroup(extraGroupId: string): Promise<void> {
  const res = await fetch(`/api/workouts/extra/${extraGroupId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`deleteExtraGroup: ${res.status}`)
}
```

`src/lib/supabase` import를 이 파일에서 제거한다.

`pr.ts`·`wod.ts`·`competitions.ts`도 같은 방식으로 각 함수 본문을 `fetch`로 교체하고 `userId` 인자를 제거한다.

- [ ] **Step 7: `duplicateSectionToToday` 호출부 수정**

Run: `grep -rn "duplicateSectionToToday" src`

나오는 모든 지점을 `duplicateSectionToDate(date, templates)`로 바꾼다. `date`는 해당 컴포넌트가 이미 보고 있는 날짜를 넘긴다(오늘 고정이 아니다). 호출부가 `getToday()`를 쓰고 있었다면 그 import도 제거한다.

- [ ] **Step 8: 타입 체크 및 빌드**

Run: `npx tsc --noEmit && npm run build`
Expected: 성공. 남은 타입 에러는 `userId` 인자 제거 누락이므로 해당 지점을 수정한다.

- [ ] **Step 9: 커밋**

```bash
git add src/app/api src/lib/api src/components src/app
git commit -m "refactor(api): PR·WOD·대회·추가운동을 서버 API로 이관, 추가운동에 소유자 적용"
```

---

## Task 11: anon 권한 회수 및 최종 검증

**Files:**
- Delete: `src/lib/supabase.ts`
- Create: `docs/sql/revoke-anon.sql`

**Interfaces:**
- Consumes: 태스크 8~10에서 모든 클라이언트 DB 접근이 제거되었음
- Produces: 없음 (최종 상태)

- [ ] **Step 1: 클라이언트에 Supabase 직접 접근이 남아있지 않은지 확인**

Run: `grep -rn "from '@/lib/supabase'" src`
Expected: 출력 없음

출력이 있으면 해당 파일을 태스크 9·10의 패턴대로 마저 이관한 뒤 진행한다.

- [ ] **Step 2: `src/lib/supabase.ts` 삭제**

```bash
git rm src/lib/supabase.ts
npx tsc --noEmit && npm run build
```
Expected: 성공

- [ ] **Step 3: `docs/sql/revoke-anon.sql` 작성**

```sql
-- anon 롤의 ddodun 스키마 접근 권한 회수.
-- 실행 전 확인: 클라이언트 코드에 Supabase 직접 접근이 남아있지 않아야 한다.
--   grep -rn "from '@/lib/supabase'" src   → 출력이 없어야 함
-- 실행 후 앱의 모든 DB 접근은 서버의 service role 을 통해서만 이루어진다.

REVOKE ALL ON ALL TABLES IN SCHEMA ddodun FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA ddodun FROM anon;
REVOKE ALL ON SCHEMA ddodun FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA ddodun REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA ddodun REVOKE ALL ON SEQUENCES FROM anon;
```

- [ ] **Step 4: 회수 실행 (사용자 수동)**

실행자는 사람에게 요청한다.

> `docs/sql/revoke-anon.sql` 을 Supabase SQL Editor에서 실행해 주세요.

- [ ] **Step 5: anon 접근이 실제로 막혔는지 확인**

Run:
```bash
set -a && . ./.env.local && set +a
curl -s -o /dev/null -w '%{http_code}\n' \
  "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?select=username,pin_hash" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Accept-Profile: ddodun"
```
Expected: `401` 또는 `403` (`200`이면 회수가 안 된 것이다)

- [ ] **Step 6: 주차 삽입 스크립트가 여전히 동작하는지 확인**

Run:
```bash
cd /Users/chacha/lab/ddodun
node .claude/skills/ddodun-weekly-workout/scripts/validate.mjs app/docs/sql/week24-templates.sql | tail -3
```
Expected: `problems: 0` (service role 을 쓰므로 회수의 영향을 받지 않는다)

- [ ] **Step 7: 완료 기준 전체 확인**

스펙 A.6의 완료 기준을 하나씩 확인한다. 브라우저 확인은 사람이 직접 한다.

| 기준 | 확인 방법 |
|---|---|
| 기존 두 선수가 이전과 똑같은 화면을 본다 | `jindun`·`chacha`로 각각 로그인해 홈·운동·PR·캘린더 확인 |
| 선수 A의 추가운동이 B에게 보이지 않는다 | `chacha`로 로그인해 2026-07-18(‌`jindun` 소유 추가운동 날짜)에 추가운동이 없는지 확인 |
| anon 키로 DB 접근 불가 | Step 5 |
| PIN이 평문으로 저장되지 않는다 | 두 계정 모두 로그인 후 `pin_hash`가 `scrypt$`로 시작하는지 확인 |
| 불변식 4개 통과 | 태스크 7 Step 4 |

- [ ] **Step 8: 커밋**

```bash
git add -A docs/sql/revoke-anon.sql src
git commit -m "feat(security): anon 롤 권한 회수 및 클라이언트 Supabase 클라이언트 제거"
```

---

## 스펙 커버리지

| 스펙 섹션 | 담당 태스크 |
|---|---|
| A.1 데이터 모델 (4개 테이블, `owner_user_id`, `role`) | 6 |
| A.1 조회 규칙 (배정 → 버전 → 날짜 + 본인 추가운동) | 8 |
| A.2 발행 규칙 (과거/오늘/미래) | **B로 이월** — 발행 UI가 없는 A에서는 적용 지점이 없다 |
| A.2 권한 매트릭스 — 선수 로그 날짜 무관 | 9 (기존 동작 유지) |
| A.2 권한 매트릭스 — 추가운동 본인 소유·날짜 무관 | 10 |
| A.3 세션 | 1, 4, 5 |
| A.3 권한 게이트 | 3 |
| A.3 라우트 구성 | 4, 8, 9, 10 |
| A.3 기존 코드 영향 최소화 (`userId` 인자 제거) | 9, 10 |
| A.3 DB 조이기 (`REVOKE`) | 11 |
| A.3 PIN 해싱 | 2, 4 |
| A.4 마이그레이션 7단계 | 6, 7 |
| A.5 검증 (불변식 4개) | 6, 7 |
| A.6 완료 기준 | 11 |

**A.2 발행 규칙에 대한 메모:** 과거/오늘/미래 분기와 인플레이스 수정은 코치가 프로그램을 발행할 때만 발생한다. A에는 발행 UI도 코치 라우트도 없으므로 구현할 지점이 없다. 스키마(`program_versions.status`, `note`)는 태스크 6에서 준비되며, 규칙 자체는 B의 첫 태스크에서 구현한다. `requireCoach`도 태스크 3에서 만들어 두므로 B가 바로 쓸 수 있다.
