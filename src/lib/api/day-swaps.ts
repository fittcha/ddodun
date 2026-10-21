import { apiFetch } from './http'

export interface WeekSwapState {
  coachDates: string[]
  recordDates: string[]
}

export async function getWeekSwapState(date: string): Promise<WeekSwapState> {
  const res = await apiFetch(`/api/day-swaps?date=${date}`)
  if (!res.ok) throw new Error(`getWeekSwapState: ${res.status}`)
  return res.json()
}

/** 실패하면 서버가 준 사유 문구를 담아 throw 한다 (토스트에 그대로 띄운다). */
export async function swapDays(dateA: string, dateB: string): Promise<void> {
  const res = await apiFetch('/api/day-swaps', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ dateA, dateB }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? '바꾸지 못했어요')
  }
}
