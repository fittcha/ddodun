#!/usr/bin/env node
// insert.mjs <path-to-weekN-templates.sql> [--force] [--dry-run]
//
// Parses a validated week SQL file, decodes E'…' strings to real values, and POSTs them as JSON
// to Supabase (schema ddodun) using SUPABASE_SERVICE_ROLE_KEY from app/.env.local.
// The .sql file is the single source of truth; the insert is derived from it.
//
//   --dry-run : print the JSON payload + duplicate check, do not POST
//   --force   : insert even if rows already exist for these dates (default: abort)
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

if (DRY) { console.log(JSON.stringify(rows, null, 2)); console.log('\n(dry-run — nothing inserted)'); process.exit(0) }

const res = await fetch(`${URL_}/rest/v1/workout_templates`, {
  method: 'POST',
  headers: { ...H, 'Content-Type': 'application/json', 'Content-Profile': 'ddodun', Prefer: 'return=representation' },
  body: JSON.stringify(rows),
})
const text = await res.text()
console.log('HTTP', res.status)
if (!res.ok) { console.error(text); process.exit(1) }
console.log(`inserted ${JSON.parse(text).length} rows ✓`)

// verify round-trip
const after = await (await fetch(q, { headers: { ...H, 'Accept-Profile': 'ddodun' } })).json()
console.log(`DB now has ${after.length} rows for ${dates[0]}…${dates.at(-1)} ✓`)
