#!/usr/bin/env node
// 주차별 운동 프로그램 전체를 하나의 마크다운으로 내보낸다.
// 사용법: node scripts/export-programs.mjs [출력경로]
//   기본 출력: docs/workout-programs-all.md
//
// DB 를 기준으로 뽑는다. 주차 SQL 파일이 아니라 DB 를 읽는 이유는, 운영 중 발생한
// 변경(예: 8월 4주차 수/목 교체, 표시 오류 수정)이 DB 에만 반영돼 있기 때문이다.
// 즉 이 파일은 "선수가 실제로 본 프로그램"이다.
//
// 개인 추가운동(extra_group_id 가 있는 행)은 코치 프로그램이 아니므로 본문에서 제외하고
// 맨 끝에 따로 목록만 붙인다.

import { readFileSync, writeFileSync } from 'node:fs'

const out = process.argv[2] ?? 'docs/workout-programs-all.md'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const BASE = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`
const HEAD = {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  'Accept-Profile': 'ddodun',
}

async function all(path, order) {
  const rows = []
  const STEP = 1000
  for (let from = 0; ; ) {
    const sep = path.includes('?') ? '&' : '?'
    const res = await fetch(`${BASE}/${path}${sep}order=${order}`, {
      headers: { ...HEAD, Range: `${from}-${from + STEP - 1}` },
    })
    if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`)
    const page = await res.json()
    rows.push(...page)
    if (page.length === 0) break
    from += page.length
    const total = (res.headers.get('content-range') || '').split('/')[1]
    if (total && total !== '*' && rows.length >= Number(total)) break
  }
  return rows
}

const templates = await all(
  'workout_templates?select=date,day_of_week,section,workout_type,title,description,sort_order,extra_group_id,owner_user_id',
  'date,sort_order',
)
const users = await all('users?select=id,username', 'username')
const nameOf = Object.fromEntries(users.map(u => [u.id, u.username]))

const program = templates.filter(t => t.extra_group_id === null)
const extras = templates.filter(t => t.extra_group_id !== null)

const DOW_KO = { MON: '월', TUE: '화', WED: '수', THU: '목', FRI: '금', SAT: '토', SUN: '일' }

function mondayOf(iso) {
  const d = new Date(`${iso}T00:00:00Z`)
  const back = d.getUTCDay() === 0 ? 6 : d.getUTCDay() - 1
  d.setUTCDate(d.getUTCDate() - back)
  return d.toISOString().slice(0, 10)
}
const short = iso => iso.slice(5).replace('-', '.')

// 주 → 날짜 → 섹션 → 행들
const weeks = new Map()
for (const t of program) {
  const wk = mondayOf(t.date)
  if (!weeks.has(wk)) weeks.set(wk, new Map())
  const days = weeks.get(wk)
  if (!days.has(t.date)) days.set(t.date, new Map())
  const secs = days.get(t.date)
  if (!secs.has(t.section)) secs.set(t.section, [])
  secs.get(t.section).push(t)
}
const weekKeys = [...weeks.keys()].sort()

const L = []
L.push('# DDODUN 주차별 운동 프로그램 전체')
L.push('')
L.push(`생성: \`node scripts/export-programs.mjs\` · 총 ${weekKeys.length}주 / ${program.length}개 항목`)
L.push(`기간: ${weekKeys[0]} ~ ${program.at(-1).date}`)
L.push('')
L.push('DB 기준으로 뽑았다. 주차 SQL 파일이 아니라 DB 를 읽으므로, 운영 중 바뀐 내용까지')
L.push('반영된 "선수가 실제로 본 프로그램"이다. 개인 추가운동은 맨 끝에 따로 정리했다.')
L.push('')

// 목차
L.push('## 목차')
L.push('')
for (const wk of weekKeys) {
  const days = weeks.get(wk)
  const n = [...days.values()].reduce((a, s) => a + [...s.values()].reduce((b, r) => b + r.length, 0), 0)
  const last = [...days.keys()].sort().at(-1)
  L.push(`- [${wk} 주간 (${short(wk)}~${short(last)})](#${wk.replace(/-/g, '')}) — ${n}개 항목`)
}
L.push('')
L.push('---')
L.push('')

for (const wk of weekKeys) {
  const days = weeks.get(wk)
  const dayKeys = [...days.keys()].sort()
  const n = dayKeys.reduce((a, d) => a + [...days.get(d).values()].reduce((b, r) => b + r.length, 0), 0)

  L.push(`<a id="${wk.replace(/-/g, '')}"></a>`)
  L.push(`## ${wk} 주간 (${short(wk)}~${short(dayKeys.at(-1))})`)
  L.push('')
  L.push(`${dayKeys.length}일 / ${n}개 항목`)
  L.push('')

  for (const date of dayKeys) {
    const secs = days.get(date)
    const dow = [...secs.values()][0][0].day_of_week
    L.push(`### ${DOW_KO[dow] ?? dow} ${date}`)
    L.push('')
    for (const sec of [...secs.keys()].sort()) {
      const rows = secs.get(sec)
      const types = [...new Set(rows.map(r => r.workout_type))].join(', ')
      L.push(`**${sec}.** _(${types})_`)
      L.push('')
      L.push('```')
      rows.forEach((r, i) => {
        if (i > 0) L.push('')
        if (r.title) L.push(r.title)
        if (r.description) L.push(...r.description.split('\n'))
      })
      L.push('```')
      L.push('')
    }
  }
  L.push('---')
  L.push('')
}

if (extras.length) {
  L.push('## 부록 — 개인 추가운동')
  L.push('')
  L.push('선수가 앱에서 직접 복제해 붙인 운동. 코치 프로그램이 아니며 본인에게만 보인다.')
  L.push('')
  for (const e of extras) {
    L.push(`- **${e.date}** (${nameOf[e.owner_user_id] ?? '소유자 미지정'}) — ${(e.title || (e.description || '').split('\n')[0] || '').slice(0, 60)}`)
  }
  L.push('')
}

writeFileSync(out, L.join('\n'))
console.log(`${out} 저장`)
console.log(`  ${weekKeys.length}주 / 프로그램 ${program.length}항목 / 추가운동 ${extras.length}항목`)
console.log(`  ${weekKeys[0]} ~ ${program.at(-1).date}`)
