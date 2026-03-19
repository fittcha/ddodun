/** 캘린더용 (일-토) */
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
/** 운동 탭 주간 스트립용 (월-일, getWeekDays 순서와 일치) */
const WEEK_DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

export { DAY_LABELS, WEEK_DAY_LABELS }

export function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()

  // Sunday = 0, Saturday = 6
  const startDow = firstDay.getDay()

  const days: (number | null)[] = []

  // Leading blanks
  for (let i = 0; i < startDow; i++) days.push(null)

  // Days
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  // Trailing blanks to fill last row
  while (days.length % 7 !== 0) days.push(null)

  return days
}

export function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function getToday(): string {
  const now = new Date()
  return formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

export function getWeekdaysInMonth(year: number, month: number): number {
  const lastDay = new Date(year, month, 0).getDate()
  let count = 0
  for (let d = 1; d <= lastDay; d++) {
    const dow = new Date(year, month - 1, d).getDay()
    if (dow >= 1 && dow <= 5) count++
  }
  return count
}

export function getDayOfWeekLabel(dateStr: string): string {
  const labels = ['일', '월', '화', '수', '목', '금', '토']
  const d = new Date(dateStr + 'T00:00:00')
  return labels[d.getDay()]
}

export function getDday(dateStr: string): number {
  const today = new Date(getToday() + 'T00:00:00')
  const target = new Date(dateStr + 'T00:00:00')
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/** Get the 7 days of the week (Mon~Sun) containing the given date */
export function getWeekDays(dateStr: string): string[] {
  const d = new Date(dateStr + 'T00:00:00')
  let dow = d.getDay() - 1 // Mon=0 ... Sun=6
  if (dow < 0) dow = 6
  const monday = new Date(d)
  monday.setDate(d.getDate() - dow)
  const days: string[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    days.push(formatDate(day.getFullYear(), day.getMonth() + 1, day.getDate()))
  }
  return days
}
