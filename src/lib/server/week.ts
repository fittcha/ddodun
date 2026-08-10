/** 주어진 날짜가 속한 주의 월요일. 입력·출력 모두 YYYY-MM-DD. */
export function weekStartOf(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  const dow = d.getUTCDay() // 0=일 … 6=토
  const back = dow === 0 ? 6 : dow - 1
  d.setUTCDate(d.getUTCDate() - back)
  return d.toISOString().slice(0, 10)
}
