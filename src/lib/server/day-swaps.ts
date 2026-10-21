// 상대 경로 + .ts 확장자로만 import 한다 — 일회용 node 검증 스크립트가 이 모듈을 바로 불러 쓴다.
import { db } from './db.ts'
import { HttpError } from './http.ts'
import { coachTemplatesInWeek } from './programs.ts'
import { weekStartOf } from './week.ts'
import { checkSwap, computeRecordDates, type LogLike } from './day-swap-rules.ts'

export interface WeekSwapState {
  coachDates: string[]
  recordDates: string[]
}

const DOW_CODES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const dowOf = (date: string) => DOW_CODES[new Date(`${date}T00:00:00Z`).getUTCDay()]

async function loadWeek(athleteId: string, date: string) {
  const templates = await coachTemplatesInWeek(athleteId, weekStartOf(date))
  if (!templates) return null

  const idsByDate = new Map<string, Set<string>>()
  for (const t of templates) {
    if (!idsByDate.has(t.date)) idsByDate.set(t.date, new Set())
    idsByDate.get(t.date)!.add(t.id)
  }

  // 교환은 같은 프로그램의 모든 선수에게 반영되므로 기록도 선수를 가리지 않고 센다.
  let logs: LogLike[] = []
  if (templates.length > 0) {
    const { data, error } = await db
      .from('workout_logs')
      .select('date, template_id, is_custom, completed, result_value, memo, sets_detail')
      .in('template_id', templates.map(t => t.id))
    if (error) throw error
    logs = (data ?? []) as LogLike[]
  }

  return {
    idsByDate,
    coachDates: new Set(idsByDate.keys()),
    recordDates: computeRecordDates(logs, idsByDate),
  }
}

export async function getWeekState(athleteId: string, date: string): Promise<WeekSwapState> {
  const week = await loadWeek(athleteId, date)
  if (!week) return { coachDates: [], recordDates: [] }
  return { coachDates: [...week.coachDates].sort(), recordDates: [...week.recordDates].sort() }
}

/** 두 날짜의 코치 템플릿 date·day_of_week 를 맞바꾼다. 같은 프로그램의 모든 선수에게 반영된다. */
export async function swapDays(athleteId: string, a: string, b: string): Promise<void> {
  const week = await loadWeek(athleteId, a)
  if (!week) throw new HttpError(409, '이번 주 배정된 프로그램이 없어요')
  const reason = checkSwap(a, b, week)
  if (reason) throw new HttpError(409, reason)

  const aIds = [...week.idsByDate.get(a)!]
  const bIds = [...week.idsByDate.get(b)!]

  // ponytail: 트랜잭션이 아니라 update 2번 + 실패 시 보상. 같은 날을 동시에 바꾸는 경쟁도 막지 못한다.
  // 둘 다 문제가 되면 DB 함수(RPC) 하나로 묶을 것.
  const move = (ids: string[], to: string) =>
    db.from('workout_templates').update({ date: to, day_of_week: dowOf(to) }).in('id', ids)
  const first = await move(aIds, b)
  if (first.error) throw first.error
  const second = await move(bIds, a)
  if (second.error) {
    // 두 번째가 실제로는 반영됐는데 에러만 받았을 수도 있으니 양쪽 모두 원래 날짜로 되돌린다.
    const [ra, rb] = await Promise.all([move(aIds, a), move(bIds, b)])
    if (ra.error || rb.error) {
      console.error('day swap 보상 실패 — 수동 복구 필요', { a, b, aIds, bIds, ra: ra.error, rb: rb.error })
    }
    throw second.error
  }
}
