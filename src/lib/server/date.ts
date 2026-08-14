/** 형식뿐 아니라 실존하는 달력 날짜인지까지 확인한다 (예: 2026-02-30 거부). */
export function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}
