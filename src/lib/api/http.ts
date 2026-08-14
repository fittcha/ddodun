/**
 * 클라이언트 API 모듈이 공통으로 쓰는 fetch 래퍼.
 * 세션이 만료되면 서버는 401을 반환하지만, useSession/AuthGuard는 마운트 시 한 번만 세션을 확인하므로
 * 탭을 오래 열어둔 채 세션이 만료되면 이후의 모든 요청이 조용히 401만 반환하고 화면엔 아무 표시도 없다.
 * 401을 감지하면 /login 으로 보낸다. 이미 /login 이면 다시 보내지 않는다 (리다이렉트 루프 방지).
 * 로그인 폼 자체의 PIN 오류(401)는 이 래퍼를 거치지 않는 별도 경로이므로 영향받지 않는다.
 */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init)
  if (res.status === 401 && typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
  return res
}
