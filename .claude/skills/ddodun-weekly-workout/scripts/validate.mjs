#!/usr/bin/env node
// validate.mjs <path-to-weekN-templates.sql>
//
// Replicates src/components/workout/WorkoutSection.tsx (parseDescription / isSectionTitle /
// leadingRest) EXACTLY, then runs it over a week SQL file and prints the per-section group
// structure so you can eyeball it against the coach images. Also runs structural checks:
//   - section letters sequential per day (A,B,C…)   - sort_order = 1..N per day
//   - 2nd+ template in a section has setInfo|leadingRest (else it won't get its own group)
//   - no lone (unescaped) apostrophe inside an E'…' string
// Exits non-zero if any check fails. If the parser source changes, update this file to match.

import { readFileSync } from 'node:fs'

const file = process.argv[2]
if (!file) { console.error('usage: validate.mjs <path-to-sql>'); process.exit(2) }

// ---------- verbatim parser logic (keep in sync with WorkoutSection.tsx) ----------
function parseDescription(desc) {
  if (!desc) return { setInfo: null, exercises: [], notes: [], orderedLines: [] }
  const lines = desc.split('\n').map(l => l.trim()).filter(Boolean)
  const nxPattern = /^\d+\s*x\s/i
  const nxCount = lines.filter(l => nxPattern.test(l)).length
  const dashRepPattern = /^\d+(-\d+)+$/
  const dashRepCount = lines.filter(l => dashRepPattern.test(l)).length
  let setInfo = null
  const exercises = [], notes = [], orderedLines = []
  for (const line of lines) {
    if (!setInfo && /^\d+\s+sets?/i.test(line)) setInfo = line
    else if (!setInfo && nxCount === 1 && nxPattern.test(line)) setInfo = line
    else if (!setInfo && /^every\s+/i.test(line)) setInfo = line
    else if (!setInfo && /^\d+\s+rounds?/i.test(line)) setInfo = line
    else if (!setInfo && /^EMOM\s+\d+/i.test(line)) setInfo = line
    else if (!setInfo && /^accumulate\s+/i.test(line)) setInfo = line
    else if (!setInfo && /^for\s+time/i.test(line)) setInfo = line
    else if (!setInfo && dashRepCount === 1 && dashRepPattern.test(line)) setInfo = line
    else if (!setInfo && /^\d+(-\d+)+\s+minutes?\s/i.test(line)) setInfo = line
    else if (!setInfo && /\(\d+:\d+\)$/.test(line)) setInfo = line
    else if (setInfo && exercises.length === 0 && line.startsWith('(')) setInfo = `${setInfo} · ${line}`
    else if (/^\d+\s+rounds?\s+for/i.test(line)) orderedLines.push({ text: line, type: 'subheader' })
    else if (
      line.startsWith('*') || line.startsWith('@') || line.startsWith('- Rest')
      || /^Rest\s+/i.test(line) || line === '+' || /^\d+\s*x\s/i.test(line)
      || (dashRepCount > 1 && dashRepPattern.test(line))
      || /^[-—]\s*\w*\s*into\s*[-—]/i.test(line)
    ) { notes.push(line); orderedLines.push({ text: line, type: 'note' }) }
    else { exercises.push(line); orderedLines.push({ text: line, type: 'exercise' }) }
  }
  return { setInfo, exercises, notes, orderedLines }
}
const isSectionTitle = t => !!t && /^(amrap|emom|e\d+mom|for\s+time)/i.test(t)
const hasLeadingRest = p => p.orderedLines.length > 0 && p.orderedLines[0].type === 'note'
  && (/^Rest\s+/i.test(p.orderedLines[0].text)
    || /^[-—]\s*\w*\s*into\s*[-—]/i.test(p.orderedLines[0].text)
    || /and\s+then/i.test(p.orderedLines[0].text))

// ---------- extract VALUES tuples ----------
const sql = readFileSync(file, 'utf8')
const rowRe = /\('(\d{4}-\d\d-\d\d)',\s*'(\w+)',\s*'(\w)',\s*'(\w+)',\s*(NULL|'(?:[^']|'')*'),\s*(NULL|E'(?:[^']|'')*'),\s*(\d+)\)/g
const decode = s => s === 'NULL' ? null
  : s.replace(/^E?'/, '').replace(/'$/, '').replace(/''/g, "'").replace(/\\n/g, '\n')

const rows = []
let m
while ((m = rowRe.exec(sql))) {
  rows.push({
    date: m[1], day: m[2], section: m[3], type: m[4],
    titleRaw: m[5], descRaw: m[6],
    title: decode(m[5]), desc: decode(m[6]), sort: +m[7],
  })
}

let problems = 0
const flag = msg => { problems++; console.log('   ⚠️  ' + msg) }

// row-count sanity: a lone unescaped apostrophe terminates the E'…' match early and the whole
// tuple is silently dropped by rowRe. Compare against the count of date-prefixed tuple starts.
const expectedTuples = (sql.match(/\(\s*'\d{4}-\d\d-\d\d'\s*,/g) || []).length
if (rows.length < expectedTuples)
  flag(`only parsed ${rows.length}/${expectedTuples} VALUES rows — a row failed to match, almost always an unescaped apostrophe (use '' in E'…')`)

// lone-apostrophe check on the raw (still SQL-escaped) strings
for (const r of rows) {
  for (const raw of [r.titleRaw, r.descRaw]) {
    if (raw === 'NULL') continue
    const inner = raw.replace(/^E?'/, '').replace(/'$/, '').replace(/''/g, '')
    if (inner.includes("'")) flag(`${r.day} ${r.section}#${r.sort}: lone unescaped apostrophe — use '' in SQL`)
  }
}

const byDay = {}
for (const r of rows) (byDay[r.day] ||= []).push(r)

for (const day of Object.keys(byDay)) {
  const drows = byDay[day]
  console.log(`\n===== ${day} (${drows[0].date}) — ${drows.length} rows =====`)
  const letters = [...new Set(drows.map(r => r.section))]
  const expected = letters.map((_, i) => String.fromCharCode(65 + i))
  if (letters.join('') !== expected.join(''))
    flag(`${day}: section letters not sequential: got ${letters.join('')}, expected ${expected.join('')}`)
  const sorts = drows.map(r => r.sort)
  if (sorts.join(',') !== sorts.map((_, i) => i + 1).join(','))
    flag(`${day}: sort_order not 1..N: ${sorts.join(',')}`)

  const sections = {}
  for (const r of drows) (sections[r.section] ||= []).push(r)
  for (const sec of Object.keys(sections)) {
    const tmpls = sections[sec]
    let label = null
    for (const t of tmpls) if (isSectionTitle(t.title)) label = t.title
    if (!label) { const p = parseDescription(tmpls[0].desc); if (p.setInfo) label = p.setInfo }
    console.log(` ${sec}. ${tmpls.length} template(s)${label ? `  [header: "${label}"]` : ''}`)
    tmpls.forEach((t, idx) => {
      const p = parseDescription(t.desc)
      const sep = idx > 0 && (p.setInfo || hasLeadingRest(p))
      const titleSec = isSectionTitle(t.title)
      console.log(`    └ row${idx + 1} so=${t.sort} type=${t.type} title=${t.title ? `"${t.title}"${titleSec ? '(SECTION)' : ''}` : 'NULL'}`
        + (idx > 0 ? (sep ? ' [NEW GROUP ✓]' : ' [⚠ NO SEPARATOR — merges into prev group]') : ''))
      if (idx > 0 && !sep) flag(`${day} ${sec}#${idx + 1}: 2nd+ template lacks setInfo/leadingRest → no own group`)
      if (p.setInfo) console.log(`         setInfo : ${JSON.stringify(p.setInfo)}`)
      for (const ol of p.orderedLines) {
        const mark = ol.type === 'exercise' ? '🏋' : ol.type === 'note' ? '  ·' : ' ▸'
        console.log(`         ${mark} [${ol.type}] ${ol.text}`)
      }
    })
  }
}
console.log(`\n================  total rows: ${rows.length}  |  problems: ${problems}  ================`)
process.exit(problems ? 1 : 0)
