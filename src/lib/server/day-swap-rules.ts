import { weekStartOf } from './week.ts'

/** 날짜 바꾸기 판정에 필요한 workout_logs 컬럼만. */
export interface LogLike {
  date: string
  template_id: string | null
  is_custom: boolean
  completed: boolean
  result_value: string | null
  memo: string | null
  sets_detail: unknown
}

function hasValue(v: unknown): boolean {
  if (v === null || v === undefined) return false
  if (typeof v === 'string') return v.trim() !== ''
  if (Array.isArray(v)) return v.some(hasValue)
  if (typeof v === 'object') return Object.values(v).some(hasValue)
  return true
}

function detailHasValue(raw: unknown): boolean {
  let detail = raw
  if (typeof raw === 'string') {
    try { detail = JSON.parse(raw) } catch { return raw.trim() !== '' }
  }
  if (!detail || typeof detail !== 'object' || Array.isArray(detail)) return hasValue(detail)
  // 단위 토글만 해도 weight_unit 이 저장된다. 그것만으로는 기록이 아니다.
  const { weight_unit: _unit, ...rest } = detail as Record<string, unknown>
  return hasValue(rest)
}

/**
 * 체크했다 해제해도 빈 행이 남고 지우는 화면이 없다. 행이 있다는 것만으로 기록으로
 * 치면 실수 한 번에 그 날이 영영 바꿀 수 없게 되므로, 실제 내용이 있는 행만 센다.
 */
export function hasContent(log: LogLike): boolean {
  return log.completed || hasValue(log.result_value) || hasValue(log.memo) || detailHasValue(log.sets_detail)
}

/** 그 날짜의 코치 템플릿에 붙은, 내용 있는 로그가 있는 날짜들. 선수는 가리지 않는다. */
export function computeRecordDates(
  logs: LogLike[],
  templateIdsByDate: Map<string, Set<string>>,
): Set<string> {
  const dates = new Set<string>()
  for (const log of logs) {
    if (log.is_custom || !log.template_id) continue
    if (!templateIdsByDate.get(log.date)?.has(log.template_id)) continue
    if (hasContent(log)) dates.add(log.date)
  }
  return dates
}

/** 두 날짜를 바꿔도 되면 null, 아니면 화면에 보여줄 사유. */
export function checkSwap(
  a: string,
  b: string,
  ctx: { coachDates: Set<string>; recordDates: Set<string> },
): string | null {
  if (a === b) return '같은 날짜끼리는 바꿀 수 없어요'
  if (weekStartOf(a) !== weekStartOf(b)) return '같은 주 안에서만 바꿀 수 있어요'
  if (!ctx.coachDates.has(a) || !ctx.coachDates.has(b)) return '운동이 없는 날은 바꿀 수 없어요'
  if (ctx.recordDates.has(a) || ctx.recordDates.has(b)) return '기록이 있는 날은 바꿀 수 없어요'
  return null
}
