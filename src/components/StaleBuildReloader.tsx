'use client'

import { useEffect } from 'react'

const RELOAD_MARK = 'ddodun-stale-reload-at'
const MIN_INTERVAL_MS = 30_000

/**
 * 배포가 나가면 이미 열려 있던 탭은 예전 JS 청크를 들고 있는데, 서버에는 그 청크가
 * 더 이상 없다. 그러면 화면 전환이나 버튼 조작이 조용히 실패한다 — 에러 메시지도
 * 없이 아무 일도 일어나지 않아, 사용자 눈에는 "로그인이 안 된다"로 보인다.
 * 홈 화면에 추가해 쓰는 경우 탭이 몇 주씩 살아 있어 특히 자주 겪는다.
 *
 * 청크 로드 실패를 감지하면 한 번 새로고침해서 새 빌드를 받아온다.
 * 새로고침 후에도 같은 실패가 반복되면(진짜 네트워크 문제 등) 무한 새로고침이
 * 되므로, 마지막 새로고침 시각을 남겨 30초 안에는 다시 시도하지 않는다.
 */
function isChunkLoadFailure(message: string): boolean {
  return (
    /ChunkLoadError/i.test(message) ||
    /Loading chunk [\w-]+ failed/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message)
  )
}

function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_MARK) || 0)
    if (Date.now() - last < MIN_INTERVAL_MS) return
    sessionStorage.setItem(RELOAD_MARK, String(Date.now()))
  } catch {
    // sessionStorage 를 못 쓰는 환경이면 루프 방지를 포기하는 대신 새로고침도 하지 않는다
    return
  }
  window.location.reload()
}

export default function StaleBuildReloader() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      if (isChunkLoadFailure(e.message || '')) reloadOnce()
    }
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason
      const message =
        typeof reason === 'string' ? reason : (reason?.message ?? reason?.name ?? '')
      if (isChunkLoadFailure(String(message))) reloadOnce()
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  return null
}
