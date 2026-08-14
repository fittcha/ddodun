#!/usr/bin/env node
// 마이그레이션 전후 스냅샷 비교. 사용법: node scripts/verify-migration.mjs <before.json> <after.json>
import { readFileSync } from 'node:fs'

const [beforePath, afterPath] = process.argv.slice(2)
if (!beforePath || !afterPath) {
  console.error('사용법: node scripts/verify-migration.mjs <before.json> <after.json>')
  process.exit(1)
}

const before = JSON.parse(readFileSync(beforePath, 'utf8'))
const after = JSON.parse(readFileSync(afterPath, 'utf8'))

const failures = []
function check(name, cond, detail) {
  if (cond) {
    console.log(`  OK   ${name}`)
  } else {
    console.log(`  FAIL ${name}`)
    failures.push({ name, detail })
  }
}

console.log('불변식 검증')

// 1. 모든 로그의 template_id가 존재하는 행을 가리킨다
check(
  '1. 고아 로그 없음',
  after.danglingLogs.length === 0,
  after.danglingLogs,
)

// 2. 프로그램 템플릿의 날짜별 id 집합이 완전히 동일하다
const dates = [...new Set([
  ...Object.keys(before.programTemplatesByDate),
  ...Object.keys(after.programTemplatesByDate),
])].sort()
const changed = dates.filter(d => {
  const b = (before.programTemplatesByDate[d] ?? []).join(',')
  const a = (after.programTemplatesByDate[d] ?? []).join(',')
  return b !== a
})
check('2. 날짜별 프로그램 템플릿 id 집합 동일', changed.length === 0, changed)

// 3. 저장된 요약의 template_ids가 전부 유효하다
check(
  '3. 요약의 template_ids 전부 유효',
  after.danglingSummaryRefs.length === 0,
  after.danglingSummaryRefs,
)

// 4. 행 수가 보존되었다 (코치 계정 1명 증가는 허용)
check(
  '4. 템플릿/로그 행 수 보존',
  after.counts.templates === before.counts.templates &&
    after.counts.logs === before.counts.logs &&
    after.counts.programTemplates === before.counts.programTemplates &&
    after.counts.extraTemplates === before.counts.extraTemplates,
  { before: before.counts, after: after.counts },
)

if (failures.length > 0) {
  console.error('\n실패한 불변식:')
  console.error(JSON.stringify(failures, null, 2))
  console.error('\n마이그레이션을 롤백해야 합니다.')
  process.exit(1)
}
console.log('\n모든 불변식 통과')
