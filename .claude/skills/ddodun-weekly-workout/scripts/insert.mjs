#!/usr/bin/env node
// insert.mjs <path-to-weekN-templates.sql> [--force] [--dry-run]
//
// Parses a validated week SQL file, decodes E'…' strings to real values, and POSTs them as JSON
// to Supabase (schema ddodun) using SUPABASE_SERVICE_ROLE_KEY from app/.env.local.
// The .sql file is the single source of truth; the insert is derived from it.
//
// After inserting the rows, this script also builds the program layer that makes them visible
// to athletes (see app/src/lib/server/programs.ts resolveTemplates): a coach `programs` row per
// Monday covered, a published `program_versions` row, `program_version_templates` links for every
// inserted coach row, and `program_assignments` for every athlete. Without this layer the rows
// exist in the DB but no athlete's calendar or workout page will ever show them — silently.
//
//   --dry-run : print the JSON payload + duplicate/program checks, do not write anything
//   --force   : insert rows even if some already exist for these dates (default: abort); also
//               allows reusing an existing week's program/version instead of aborting (see below)
//
// Finds .env.local by walking up from the SQL file path (robust to where this script lives).

import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const file = process.argv[2]
const FORCE = process.argv.includes('--force')
const DRY = process.argv.includes('--dry-run')
if (!file) { console.error('usage: insert.mjs <path-to-sql> [--force] [--dry-run]'); process.exit(2) }

// locate .env.local by walking up from the SQL file (app/docs/sql/weekN.sql -> app/.env.local)
let envPath = null
for (let dir = resolve(dirname(file)); ; dir = dirname(dir)) {
  const c = resolve(dir, '.env.local')
  if (existsSync(c)) { envPath = c; break }
  if (dirname(dir) === dir) break
}
if (!envPath) { console.error(`could not find .env.local above ${file}`); process.exit(1) }
const env = readFileSync(envPath, 'utf8')
const URL_ = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim()
const KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim()
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` }

const sql = readFileSync(file, 'utf8')
const rowRe = /\('(\d{4}-\d\d-\d\d)',\s*'(\w+)',\s*'(\w)',\s*'(\w+)',\s*(NULL|'(?:[^']|'')*'),\s*(NULL|E'(?:[^']|'')*'),\s*(\d+)\)/g
const decode = s => s === 'NULL' ? null
  : s.replace(/^E?'/, '').replace(/'$/, '').replace(/''/g, "'").replace(/\\n/g, '\n')

const rows = []
let m
while ((m = rowRe.exec(sql))) {
  rows.push({
    date: m[1], day_of_week: m[2], section: m[3], workout_type: m[4],
    title: decode(m[5]), description: decode(m[6]), sort_order: +m[7],
  })
}
if (!rows.length) { console.error('no rows parsed — check SQL format'); process.exit(1) }
// guard: a lone unescaped apostrophe silently drops its tuple from rowRe → fewer rows inserted.
const expectedTuples = (sql.match(/\(\s*'\d{4}-\d\d-\d\d'\s*,/g) || []).length
if (rows.length < expectedTuples) {
  console.error(`only parsed ${rows.length}/${expectedTuples} rows — a tuple failed to match (unescaped apostrophe? use '') — aborting`)
  process.exit(1)
}
const dates = [...new Set(rows.map(r => r.date))].sort()
console.log(`parsed ${rows.length} rows covering ${dates[0]}…${dates.at(-1)}`)

// duplicate guard
const q = `${URL_}/rest/v1/workout_templates?date=gte.${dates[0]}&date=lte.${dates.at(-1)}&select=date,section,sort_order`
const existing = await (await fetch(q, { headers: { ...H, 'Accept-Profile': 'ddodun' } })).json()
if (existing.length) {
  console.log(`⚠️  ${existing.length} rows already exist for these dates.`)
  if (!FORCE) { console.error('aborting — pass --force to insert anyway (may duplicate)'); process.exit(1) }
}

// --- program layer helpers (coach → athlete visibility) ---
// mirrors src/lib/server/week.ts weekStartOf: UTC, Monday-start week.
function weekStartOf(date) {
  const d = new Date(`${date}T00:00:00Z`)
  const dow = d.getUTCDay() // 0=일 … 6=토
  const back = dow === 0 ? 6 : dow - 1
  d.setUTCDate(d.getUTCDate() - back)
  return d.toISOString().slice(0, 10)
}

async function getJson(url) {
  const res = await fetch(url, { headers: { ...H, 'Accept-Profile': 'ddodun' } })
  const text = await res.text()
  if (!res.ok) { console.error(`HTTP ${res.status} GET ${url}`); console.error(text); process.exit(1) }
  return text ? JSON.parse(text) : []
}

async function postJson(table, rows, { onConflict, resolution } = {}) {
  const qs = onConflict ? `?on_conflict=${onConflict}` : ''
  const prefer = ['return=representation', resolution && `resolution=${resolution}`].filter(Boolean).join(',')
  const res = await fetch(`${URL_}/rest/v1/${table}${qs}`, {
    method: 'POST',
    headers: { ...H, 'Content-Type': 'application/json', 'Content-Profile': 'ddodun', Prefer: prefer },
    body: JSON.stringify(rows),
  })
  const text = await res.text()
  if (!res.ok) { console.error(`HTTP ${res.status} POST ${table}`); console.error(text); process.exit(1) }
  return text ? JSON.parse(text) : []
}

/**
 * 이번 배치가 걸치는 주(월요일) 목록에 대해, 이미 그 주 프로그램이 있는지 미리 확인한다.
 * --force 없이 하나라도 있으면 아무것도 쓰기 전에 중단한다 (템플릿 삽입 전에 호출할 것).
 * 이미 있으면 재사용(중복 생성 금지)하고, 없으면 새로 만든다 — 절대 같은 주에 프로그램을 2개 만들지 않는다.
 */
async function planProgramWeeks(weeks) {
  const plan = []
  for (const week of weeks) {
    const found = await getJson(`${URL_}/rest/v1/programs?week_start_date=eq.${week}&select=id,title`)
    if (found.length && !FORCE) {
      console.error(`⚠️  program already exists for week ${week} (id ${found[0].id}, "${found[0].title}").`)
      console.error('aborting — pass --force to reuse the existing program/version instead of creating a duplicate')
      process.exit(1)
    }
    plan.push({ week, existing: found[0] ?? null })
  }
  return plan
}

async function ensureProgramLayer(insertedRows, plan) {
  const coachRows = insertedRows.filter(r => r.extra_group_id == null)
  if (!coachRows.length) { console.log('(no coach rows inserted — skipping program layer)'); return }

  const coaches = await getJson(`${URL_}/rest/v1/users?role=eq.coach&select=id&order=created_at.asc&limit=1`)
  if (!coaches.length) { console.error('no user with role=coach found — cannot create programs'); process.exit(1) }
  const coachId = coaches[0].id
  const athletes = await getJson(`${URL_}/rest/v1/users?role=eq.athlete&select=id`)

  for (const { week, existing } of plan) {
    const rowsForWeek = coachRows.filter(r => weekStartOf(r.date) === week)
    if (!rowsForWeek.length) continue

    let programId, versionId
    if (existing) {
      programId = existing.id
      const versions = await getJson(
        `${URL_}/rest/v1/program_versions?program_id=eq.${programId}&order=version_no.desc&limit=1&select=id,version_no`,
      )
      if (versions.length) {
        versionId = versions[0].id
        console.log(`↻ week ${week}: reusing program ${programId} / version ${versions[0].version_no} (--force)`)
      } else {
        const [v] = await postJson('program_versions', [
          { program_id: programId, version_no: 1, status: 'published', published_at: new Date().toISOString() },
        ])
        versionId = v.id
        console.log(`↻ week ${week}: reusing program ${programId}, created version 1 (${versionId})`)
      }
    } else {
      const [p] = await postJson('programs', [{ coach_id: coachId, title: `${week} 주간`, week_start_date: week }])
      programId = p.id
      const [v] = await postJson('program_versions', [
        { program_id: programId, version_no: 1, status: 'published', published_at: new Date().toISOString() },
      ])
      versionId = v.id
      console.log(`✓ week ${week}: created program ${programId} / version ${versionId}`)
    }

    const links = rowsForWeek.map(r => ({ version_id: versionId, template_id: r.id }))
    await postJson('program_version_templates', links)
    console.log(`  linked ${links.length} templates`)

    if (athletes.length) {
      await postJson(
        'program_assignments',
        athletes.map(a => ({ program_id: programId, athlete_id: a.id, version_id: versionId })),
        { onConflict: 'program_id,athlete_id', resolution: 'ignore-duplicates' },
      )
    }
    console.log(`  assigned ${athletes.length} athletes`)
  }
}

const weeks = [...new Set(rows.map(r => weekStartOf(r.date)))].sort()
const plan = await planProgramWeeks(weeks)

if (DRY) {
  console.log(JSON.stringify(rows, null, 2))
  console.log('\nprogram plan:')
  for (const p of plan) {
    console.log(`  ${p.week}: ${p.existing ? `reuse existing program ${p.existing.id} (--force)` : 'create new program'}`)
  }
  console.log('\n(dry-run — nothing inserted)')
  process.exit(0)
}

const res = await fetch(`${URL_}/rest/v1/workout_templates`, {
  method: 'POST',
  headers: { ...H, 'Content-Type': 'application/json', 'Content-Profile': 'ddodun', Prefer: 'return=representation' },
  body: JSON.stringify(rows),
})
const text = await res.text()
console.log('HTTP', res.status)
if (!res.ok) { console.error(text); process.exit(1) }
const inserted = JSON.parse(text)
console.log(`inserted ${inserted.length} rows ✓`)

// verify round-trip
const after = await (await fetch(q, { headers: { ...H, 'Accept-Profile': 'ddodun' } })).json()
console.log(`DB now has ${after.length} rows for ${dates[0]}…${dates.at(-1)} ✓`)

await ensureProgramLayer(inserted, plan)
