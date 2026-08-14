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
