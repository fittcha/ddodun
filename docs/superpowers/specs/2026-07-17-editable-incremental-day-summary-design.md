# 편집 가능·증분 누적 "오늘 운동 요약" 설계

- **날짜**: 2026-07-17
- **대상 앱**: DDODUN (`/Users/chacha/lab/ddodun/app`)
- **구조 전제**: 단일 사용자 앱(관리자/실사용자 1명).

## 1. 배경 / 문제

홈 화면 `TodaySummary`("오늘 운동 요약")는 완료 로그로부터 매번 텍스트를 **재생성**한다(`generateSummaryText`). 사용자가 텍스트를 수정할 수 있는 textarea가 있지만:

1. 새 데이터가 들어와 `generatedText`가 바뀌면(다른 운동 완료 등) 편집 중이 아닐 때 `setText(null)`로 **편집이 통째로 버려지고 재생성 텍스트로 덮인다**(`TodaySummary.tsx:190-195`).
2. 편집은 컴포넌트 state일 뿐 **어디에도 저장되지 않아** 새로고침/페이지 이탈 시 사라진다.

원하는 동작: 요약을 **사용자 소유 문서**로 바꾸어, 편집이 유지되고, 새로 완료한 운동은 **덧붙고**, 이미 반영된 운동의 데이터 변경은 **해당 섹션만 새로 반영**되게 한다.

## 2. 확정된 규칙 (브레인스토밍)

- **저장**: Supabase 신규 테이블(기기 간 동기화).
- **append 형식**: 새 완료 운동은 **섹션 헤더 블록**("A." 등)으로 추가하되, **섹션 순서(A→B→C…→추가운동, `localeCompare`)에 맞는 위치에 삽입**한다. 예: A·C가 이미 있고 B를 나중에 완료하면 A와 C 사이에 들어간다(끝에 붙지 않음).
- **신규 완료** → 섹션 블록 append.
- **완료 해제** → **아무것도 안 함**(요약에서 자동 제거하지 않음). 한 번 반영된 운동은 이후 완료 해제돼도 문서에 남는다.
- **무게/메모/결과 변경**(이미 반영된 운동) → **해당 섹션 블록을 통째로 재생성해 교체**.
- **편집 vs 갱신 충돌**: **데이터가 이긴다.** 손으로 편집한 섹션이라도 그 운동의 무게/메모를 앱에서 바꾸면 그 섹션은 재생성되어 편집이 덮어써진다. 단, **데이터를 바꾸지 않은 섹션의 편집과, 섹션에 속하지 않는 자유 메모는 유지**된다.
- **재생성 버튼**: 저장 문서를 버리고 현재 완료 상태로 전체 재생성(탈출구).
- 테이블 부재/조회 실패 시 홈은 기존 자동생성 텍스트로 **안전 폴백**(홈이 깨지지 않음).

## 3. 저장 스키마 (신규 테이블)

`ddodun.workout_day_summaries` (마이그레이션 SQL은 `docs/sql/`에 작성, **코드 배포보다 먼저** Supabase에서 직접 실행):

```sql
CREATE TABLE IF NOT EXISTS ddodun.workout_day_summaries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  date date NOT NULL,
  text text NOT NULL DEFAULT '',
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
```

- `text`: 사용자가 보는/편집하는 문서 전체.
- `blocks`: 섹션 단위 추적 배열. 각 원소:
  ```
  { "key": string,            // 섹션 라벨: "A"~"F" 또는 "추가운동"
    "template_ids": string[], // 이 섹션에 반영된 template_id (반영 후에는 완료 해제돼도 유지)
    "sig": string,            // 이 섹션의 데이터 시그니처 (무게/결과/메모 기반)
    "auto_snippet": string }  // 마지막으로 생성해 text에 넣은 이 블록의 정확한 텍스트
  ```
- **detached 플래그 없음** (데이터가 이기므로 불필요).

## 4. API (신규 `src/lib/api/day-summaries.ts`)

```ts
export interface DaySummaryBlock {
  key: string
  template_ids: string[]
  sig: string
  auto_snippet: string
}
export interface DaySummary {
  text: string
  blocks: DaySummaryBlock[]
}

// 없으면 null. (테이블 부재/조회 실패는 호출부에서 catch → null 취급하여 폴백)
export async function getDaySummary(userId: string, date: string): Promise<DaySummary | null>

// upsert (on conflict user_id,date do update set text, blocks, updated_at)
export async function upsertDaySummary(
  userId: string, date: string, text: string, blocks: DaySummaryBlock[]
): Promise<void>
```

## 5. 핵심 로직 (재조정 = reconcile)

`TodaySummary`가 담당. 입력: `templates`(코치+추가운동, Task 6로 이미 합쳐 들어옴), `logs`(그날 전체 로그), `stored`(getDaySummary 결과 | null). 홈 로드/가시성 갱신 시(편집 중이 아닐 때) 실행.

### 5.1 보조 함수

- `logByTemplate: Map<template_id, WorkoutLog>` — 그날 로그 전체(완료 여부 무관)를 template_id로 매핑.
- `templateById: Map<template_id, WorkoutTemplate>`.
- `sectionOf(id)` = `templateById.get(id).section` (추가운동은 "추가운동").
- `genSectionBlock(sectionKey, includedIds)`: 주어진 template_id들을 **완료 여부와 무관하게** 현재 로그 데이터로 렌더해 한 섹션 블록 텍스트를 만든다. 형식은 기존 `generateSummaryText`의 섹션 렌더링(헤더 `"${key}."` + title/description + `→ 결과` + `📝 메모`, orphan-result 병합 포함)을 그대로 재사용하되, **완료 필터를 적용하지 않고** `includedIds`만 대상으로 한다. → 기존 `generateSummaryText`를 리팩터해 "섹션 1개 + id 목록 + 완료필터여부" 를 받는 내부 헬퍼로 분리하고, 전체 생성/리셋은 완료필터=on, 섹션 재생성은 off로 호출.
- `sigOf(includedIds)`: 각 id의 현재 로그에서 (weight, result, memo) 추출해 `id→{w,r,m}`를 id 정렬 후 `JSON.stringify`. 멤버십(id 증가)도 시그니처에 반영됨.

### 5.2 최초/문서 없음 & 재생성 버튼

`stored == null`(또는 리셋):
- `completedIds` = 완료 로그의 template_id 집합(우리가 아는 템플릿만).
- 완료가 하나도 없으면 저장 안 함, 표시 없음.
- 섹션별로 `completedIds`를 묶어 각 블록 생성:
  - `text` = 섹션들을 기존 순서(section localeCompare)로 `genSectionBlock` 결과를 `"\n\n"`로 결합.
  - `blocks` = 섹션별 `{ key, template_ids: 그 섹션 완료 ids, sig, auto_snippet }`.
- `upsertDaySummary` 저장.

### 5.3 증분 재조정 (`stored != null`)

`text = stored.text`, `blocks = stored.blocks` 복사 후:

1. **신규 완료 흡수**: `newIds = 완료 template_id − (모든 block.template_ids 합집합)`.
   - `newIds`를 섹션별로 묶는다.
   - 각 섹션 S에 대해:
     - S 블록이 이미 있으면 → 그 블록의 `template_ids`에 새 id 추가(멤버십 증가 → 3단계에서 재생성됨).
     - S 블록이 없으면 → **새 블록을 섹션 순서 위치에 삽입**: `included = S의 새 완료 ids`, `snippet = genSectionBlock(S, included)`.
       - `blocks`를 섹션 순서(`localeCompare`)로 유지하며 S가 들어갈 인덱스를 구한다.
       - **삽입 위치 결정**: S보다 뒤 순서인 첫 기존 블록 N(예: C)을 찾아, `N.auto_snippet`이 `text`에 verbatim 있으면 그 앞에 `snippet + "\n\n"`을 삽입. 없으면(뒤 블록이 없거나 N을 사용자가 편집해 못 찾음) → `text += (text?"\n\n":"") + snippet` (끝에 붙이는 폴백).
       - `blocks`에 `{key:S, template_ids:included, sig:sigOf(included), auto_snippet:snippet}`를 순서 위치에 삽입.
2. **데이터 변경/멤버십 증가 반영**: 각 기존 블록 B에 대해 `newSig = sigOf(B.template_ids)`:
   - `newSig === B.sig` → 변화 없음, 건드리지 않음. *(완료 해제만 일어난 경우 무게/메모/결과가 그대로라 sig 불변 → 자동으로 "제거 안 함")*
   - `newSig !== B.sig` (무게/메모/결과 변경 또는 1단계에서 멤버십 증가) → `newSnippet = genSectionBlock(B.key, B.template_ids)`:
     - `text`에 `B.auto_snippet`이 **verbatim 존재** → 그 자리에서 `text.replace(B.auto_snippet, newSnippet)`.
     - 없으면(사용자가 그 섹션을 편집함) → `text += "\n\n" + newSnippet` (최신 데이터를 끝에 붙임; 데이터가 이김. 편집본이 남아 중복될 수 있음 — §7 한계).
     - `B.auto_snippet = newSnippet`, `B.sig = newSig`.
3. **정리 & 저장**: 3개 이상 연속 개행 정리. `text`/`blocks`가 `stored`와 달라졌을 때만 `upsertDaySummary`. **멱등**(동일 입력 재실행 시 변화 없음 → 저장 없음)이라 루프 없음.
4. `displayText = text`.

### 5.4 편집

- textarea 수정 → 로컬 `text` 상태 → **디바운스(≈800ms) 저장**으로 `text`만 upsert(blocks 유지).
- 편집한 섹션은 다음 재조정에서 sig가 그대로면(무게/메모 안 바꿈) 건드리지 않으므로 편집 유지. 그 섹션 데이터를 바꾸면 §5.3-2에 따라 재생성(데이터가 이김).
- 섹션에 속하지 않는 자유 메모(어느 block.auto_snippet에도 없는 텍스트)는 재조정이 절대 건드리지 않아 항상 유지.

### 5.5 재생성 버튼

헤더에 "처음부터"(또는 아이콘) 버튼 → §5.2를 강제 실행해 `text`/`blocks` 덮어쓰기 저장.

## 6. 컴포넌트 / 파일 변경

- **신규** `src/lib/api/day-summaries.ts`: 타입 + `getDaySummary` + `upsertDaySummary`.
- `src/app/page.tsx`: `loadData`의 today 로드에 `getDaySummary(userId, todayStr)` 추가(실패 시 null), `TodaySummary`에 `stored`, `userId`, `date`, 그리고 저장 콜백 전달. (홈이 데이터 소유 유지)
- `src/components/home/TodaySummary.tsx`:
  - `generateSummaryText`를 "섹션 1개 렌더" 내부 헬퍼로 리팩터(전체/섹션 재사용).
  - reconcile 로직(§5) — 데이터 변경 시 `useEffect`(편집 중 아닐 때)로 실행 + `onSave` 호출.
  - 디바운스 저장, "처음부터" 버튼.
  - `stored`가 있으면 완료가 새로 없더라도 저장된 문서를 표시.
- `docs/sql/migration-day-summaries.sql`: 신규 테이블 생성(직접 실행, 코드보다 먼저).

## 7. 알려진 한계 (모델 본질상)

- **verbatim 매칭**: 데이터 변경된 섹션을 `text` 안에서 옛 `auto_snippet`으로 찾아 교체. 사용자가 그 섹션을 편집해 스니펫이 바뀌었으면 못 찾아 **끝에 최신 블록을 새로 붙인다**(옛 편집본이 남아 중복 가능). "편집 + 이후 그 섹션 데이터 변경"이 겹치는 드문 경우이며 "처음부터" 버튼으로 정리 가능.
- 서로 다른 두 섹션 블록 텍스트가 완전히 동일하면 첫 일치 기준 처리(드묾).
- **순서 삽입**도 이웃 블록의 `auto_snippet` 위치에 의존한다. 뒤 순서 이웃 블록을 사용자가 편집해 못 찾으면 새 블록은 끝에 붙는다(순서가 어긋날 수 있음). 흔치 않으며 "처음부터"로 정리 가능.
- 완료 해제는 절대 제거하지 않음(설계 의도). 잘못 추가된 항목은 직접 편집 삭제 또는 "처음부터"로 정리.

## 8. 에러 처리

- `getDaySummary` 실패(테이블 부재 등) → 홈에서 catch → `stored=null` 취급 → `TodaySummary`는 기존처럼 자동생성 텍스트 표시(저장은 조용히 실패 로깅). 홈 정상.
- `upsertDaySummary` 실패 → 콘솔 로깅, 화면은 로컬 상태 유지(다음 로드 때 재시도).
- ⚠️ 마이그레이션은 코드 배포 전에 실행. (Task 5 마이그레이션과 동일 원칙; 단 이 기능은 폴백이 있어 미실행 시에도 홈은 안 깨지고 요약 저장/증분만 동작 안 함.)

## 9. 테스트 계획 (라이브 E2E)

1. 완료 없음 → 요약 미표시.
2. A 완료 → A 블록 표시·저장.
3. B 완료 → A 유지 + B 블록 append (편집 안 했을 때).
3b. A·C 완료 후 B 완료 → **B가 A와 C 사이(섹션 순서)에 삽입**됨(끝이 아님).
4. A 텍스트에 메모 추가(편집) → C 완료 → A 편집 유지 + C append.
5. 미편집 B의 무게 변경 → B 섹션만 재생성·교체(다른 섹션·A 편집 유지).
6. B 완료 해제(데이터 그대로) → 요약 변화 없음(제거 안 됨).
7. 편집한 A의 무게 변경 → A 재생성(데이터가 이김; 한계대로 끝에 붙거나 교체).
8. 새로고침/다른 기기 → 저장된 문서 그대로.
9. "처음부터" → 현재 완료 상태로 재생성.
10. 테이블 부재 시뮬레이션 → 홈 폴백 정상.
11. 추가운동(Task 6) 완료 → "추가운동" 블록으로 동일하게 append.
