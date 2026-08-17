import { db } from '@/lib/server/db'
import { toResponse } from '@/lib/server/auth'

/**
 * 로그인 화면이 "PIN 입력"과 "PIN 설정" 중 무엇을 띄울지 정하기 위한 조회.
 *
 * 존재하지 않는 사용자도 needsSetup:false 로 응답한다. 그래야 이 엔드포인트가
 * 계정 존재 여부를 새로 흘리지 않는다 — 없는 사용자는 기존과 똑같이 PIN 입력
 * 화면으로 간 뒤 제출 시점에 404 를 받는다.
 */
export async function GET(req: Request) {
  try {
    const username = new URL(req.url).searchParams.get('username')
    if (typeof username !== 'string' || username.trim() === '') {
      return Response.json({ error: 'bad request' }, { status: 400 })
    }

    const { data: user, error } = await db
      .from('users')
      .select('pin_hash')
      .eq('username', username.trim())
      .maybeSingle()
    if (error) throw error

    return Response.json({ needsSetup: user != null && user.pin_hash === null })
  } catch (err) {
    return toResponse(err)
  }
}
