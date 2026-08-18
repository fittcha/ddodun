import { createClient } from '@supabase/supabase-js'

function makeClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL 및 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다')
  }
  return createClient(url, serviceKey, {
    db: { schema: 'ddodun' },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

type Db = ReturnType<typeof makeClient>

let client: Db | null = null

function getClient(): Db {
  if (!client) client = makeClient()
  return client
}

/**
 * 서버 전용 Supabase 클라이언트 (service role). 클라이언트 컴포넌트에서 import 하지 말 것.
 *
 * 지연 생성한다. 예전에는 모듈 최상위에서 환경변수를 검사하고 throw 했는데, Next.js 가
 * 빌드 중 라우트 모듈을 평가해 페이지 데이터를 수집하면서 그 throw 가 빌드 자체를
 * 실패시켰다 ("Failed to collect page data for /api/auth/login"). 환경변수가 빌드 환경에
 * 없을 수 있으므로 검사는 실제 사용 시점으로 미룬다 — 그러면 빌드는 통과하고, 설정이
 * 빠진 경우 해당 요청이 500 과 함께 서버 로그에 명확한 메시지를 남긴다.
 */
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const c = getClient()
    const value = Reflect.get(c as object, prop, receiver)
    return typeof value === 'function' ? value.bind(c) : value
  },
})
