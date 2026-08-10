#!/usr/bin/env node
// 마이그레이션 전후 불변식 스냅샷. 사용법: node scripts/snapshot-invariants.mjs <out.json>
import { readFileSync, writeFileSync } from 'node:fs'

const out = process.argv[2]
if (!out) {
  console.error('사용법: node scripts/snapshot-invariants.mjs <out.json>')
  process.exit(1)
}

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)

const URL_BASE = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`
const HEADERS = {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  'Accept-Profile': 'ddodun',
}

async function all(path) {
  const rows = []
  const STEP = 1000
  for (let from = 0; ; from += STEP) {
    const res = await fetch(`${URL_BASE}/${path}`, {
      headers: { ...HEADERS, Range: `${from}-${from + STEP - 1}` },
    })
    if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`)
    const page = await res.json()
    rows.push(...page)
    if (page.length < STEP) break
  }
  return rows
}

const users = await all('users?select=id,username')
const templates = await all('workout_templates?select=id,date,extra_group_id')
const logs = await all('workout_logs?select=id,user_id,template_id')
const summaries = await all('workout_day_summaries?select=user_id,date,blocks')

const templateIds = new Set(templates.map(t => t.id))
const programTemplates = templates.filter(t => t.extra_group_id === null)
const extraTemplates = templates.filter(t => t.extra_group_id !== null)

// 날짜별 프로그램 템플릿 id (선수 무관 — 마이그레이션 후에는 배정으로 결정된다)
const byDate = {}
for (const t of programTemplates) (byDate[t.date] ??= []).push(t.id)
for (const d of Object.keys(byDate)) byDate[d].sort()

// 추가운동 행별 로그 주인
const extraOwners = {}
for (const t of extraTemplates) {
  const owners = [...new Set(logs.filter(l => l.template_id === t.id).map(l => l.user_id))]
  extraOwners[t.id] = owners.sort()
}

const danglingLogs = logs.filter(l => l.template_id && !templateIds.has(l.template_id)).map(l => l.id)
const danglingSummaryRefs = []
for (const s of summaries) {
  for (const b of s.blocks ?? []) {
    for (const id of b.template_ids ?? []) {
      if (!templateIds.has(id)) danglingSummaryRefs.push({ user_id: s.user_id, date: s.date, id })
    }
  }
}

const snapshot = {
  counts: {
    users: users.length,
    templates: templates.length,
    programTemplates: programTemplates.length,
    extraTemplates: extraTemplates.length,
    logs: logs.length,
    summaries: summaries.length,
  },
  users: users.map(u => u.id).sort(),
  programTemplatesByDate: byDate,
  extraOwners,
  danglingLogs,
  danglingSummaryRefs,
}

writeFileSync(out, JSON.stringify(snapshot, null, 2))
console.log(`스냅샷 저장: ${out}`)
console.log(JSON.stringify(snapshot.counts, null, 2))

const multiOwner = Object.entries(extraOwners).filter(([, o]) => o.length > 1)
if (multiOwner.length > 0) {
  console.error('\n경고: 로그 주인이 2명 이상인 추가운동 행이 있습니다. 마이그레이션 전에 수동 확인이 필요합니다.')
  console.error(JSON.stringify(multiOwner, null, 2))
  process.exit(2)
}
const noOwner = Object.entries(extraOwners).filter(([, o]) => o.length === 0)
if (noOwner.length > 0) {
  console.error('\n경고: 로그가 없어 주인을 판별할 수 없는 추가운동 행이 있습니다.')
  console.error(JSON.stringify(noOwner.map(([id]) => id), null, 2))
  process.exit(2)
}
