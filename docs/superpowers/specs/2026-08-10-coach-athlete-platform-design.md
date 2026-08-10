# 코치/선수 분리 및 다중 선수 지원 — 설계

작성일: 2026-08-10

## 배경

현재 DDODUN은 선수 1명을 전제로 만들어져 있다. 실제 운영은 이렇게 돌아간다.

1. 코치가 카카오톡에 주간 운동 이미지를 올린다
2. 사용자가 Claude Code로 그 이미지를 읽혀 `ddodun.workout_templates`에 SQL로 삽입한다
3. 선수가 앱에서 기록한다
4. 선수가 하루치 요약을 카톡 포맷으로 복사해 코치에게 보낸다

2번이 앱 밖의 수작업이고, 3~4번이 선수 1명 가정 위에 서 있다. 이걸 코치 계정과 선수 계정이 분리된 구조로 바꾸고, 선수가 여러 명이어도 동작하게 만든다.

## 현재 상태에서 확인된 사실

측정 시점 2026-08-10, 프로덕션 DB 기준.

| 항목 | 값 |
|---|---|
| `workout_templates` | 741행 (프로그램 735 + 선수 개인 추가운동 6) |
| `workout_logs` | 659행 |
| `users` | 2명 (`chacha` 26 logs, `jindun` 630 logs) |
| 추가운동 6행 소유 | `jindun` 4, `chacha` 2 |

구조적 사실:

- **`workout_templates`에 `user_id`가 없다.** 템플릿이 전역이라 모든 선수가 같은 행을 본다.
- **`workout_logs`, `workout_day_summaries`는 이미 `user_id`로 분리되어 있다.** 선수별 기록은 이미 다중 선수 대응이 되어 있다.
- **`duplicateSectionToToday`가 선수 화면에서 `workout_templates`에 행을 쓴다**(추가운동 복제). 이 행에 소유자가 없어서, 선수가 둘 이상이면 A선수의 추가운동이 B선수 화면에 뜬다. **현존 버그다.**
- **`template_id`가 모든 조인의 키다.** 특히 `workout_day_summaries.blocks` JSONB 안에 `template_ids` 배열이 저장되어 있다. 따라서 **기존 템플릿 행의 id는 반드시 살아남아야 한다.** 이것이 이 설계 전체를 지배하는 제약이다.
- **`users.pin_hash`가 평문이다.** 컬럼 이름만 `_hash`이고 값은 `"1216"` 같은 4자리 그대로다.
- **`anon` 롤에 `GRANT ALL`이 걸려 있고 RLS가 사실상 없다.** anon 키만 있으면 누구나 전 사용자 데이터와 PIN을 읽고 쓸 수 있다. 선수가 1명일 땐 감수할 만했으나 남의 기록이 들어오면 안 된다.

## 확정된 결정

| 주제 | 결정 |
|---|---|
| 규모 | 코치 1명 + 선수 N명. 체육관/테넌트 개념 없음 |
| 운동 입력 | 코치가 **텍스트를 붙여넣고** 기존 파서로 구조화. 단 입력 경로는 교체 가능한 모듈로 격리 |
| 배정 | 프로그램을 발행하고 **받을 선수를 선택**. 그룹/반 개념 없음 |
| 결과 공유 | **선수가 '공유'를 누른 날만** 코치가 본다 |
| 권한 | Next.js **API Route를 경유**해 서버에서 강제. Supabase Auth로 가지 않고 PIN 로그인 유지 |
| 버전 충돌 | 날짜 기준. 과거 잠금 / 오늘은 확인 후 덮어쓰기 / 내일 이후는 자유 |
| 기존 계정 | `chacha`·`jindun` 둘 다 선수. **코치 계정은 신규 생성** |

### 입력 경로를 격리하는 이유

코치가 주간 운동을 원래 어디에 작성하는지(엑셀/시트 등 텍스트 원본이 있는지, 이미지로 바로 만드는지) 아직 확인되지 않았다. 텍스트 원본이 없다면 코치에게 타이핑을 요구하게 되어 1안이 실패한다. 그래서 "텍스트 → 템플릿 초안"을 인터페이스 하나로 가두고, 실패 시 LLM 이미지 파싱으로 그 모듈만 교체할 수 있게 한다.

```ts
interface ProgramDraftSource {
  parse(input: string): ParsedProgramDraft   // { days: [{ date, sections: [...] }] }
}
```

코치 콘솔·배정·결과 조회는 `ParsedProgramDraft`에만 의존하고 입력 형식을 모른다.

## 범위 분해

한 스펙에 다 넣으면 뭉개지므로 3개 하위 프로젝트로 자른다. 각각 스펙 → 계획 → 구현 사이클을 돈다.

| | 내용 | 사용자에게 보이는 변화 |
|---|---|---|
| **A. 기반 공사** | 역할·프로그램/버전/배정 스키마, 추가운동 소유자 분리, 서버 API 경계, PIN 해싱, 마이그레이션 | 없음 (기존 앱 그대로 동작) |
| **B. 코치 콘솔** | 선수 관리, 텍스트 붙여넣기 → 파싱 미리보기 → 발행/배정 | 코치 화면 신설 |
| **C. 결과 공유** | 선수 '공유' 버튼, 코치 결과 조회 뷰 | 양방향 완성 |

**이 문서는 A를 설계한다.** B·C는 A가 끝난 뒤 각각 별도 스펙으로 작성한다.

---

# A. 기반 공사

## A.1 데이터 모델

```
programs                    프로그램(주간) 메타
  id, coach_id, title, week_start_date, created_at

program_versions            발행 단위. published 이후 불변.
  id, program_id, version_no, status('draft'|'published'),
  source_text, published_at, note, created_at

program_version_templates   버전 ↔ 템플릿 행 (N:M)
  version_id, template_id
  PRIMARY KEY (version_id, template_id)

workout_templates           기존 테이블. id 유지. 컬럼 1개 추가.
  ...기존 컬럼...
  + owner_user_id  uuid     선수 개인 추가운동 전용. 프로그램 행은 NULL.

program_assignments         선수가 볼 버전 고정
  id, program_id, athlete_id, version_id, assigned_at
  UNIQUE (program_id, athlete_id)

users                       기존 테이블. 컬럼 1개 추가.
  + role  text NOT NULL DEFAULT 'athlete'   'athlete' | 'coach'
```

### N:M 조인 테이블이 필요한 이유

`workout_templates`에 `program_version_id` 컬럼을 두는 단순한 방법을 쓰면, 새 버전을 만들 때 735행을 전부 복제해야 하고 행 id가 새로 생긴다. 그러면 이전 버전을 보던 선수의 로그와 저장된 요약(`blocks.template_ids`)이 가리키는 행이 배정 버전 밖으로 밀려난다. **id 보존 제약이 깨진다.**

조인 테이블을 쓰면 **새 버전은 바뀐 날짜의 행만 새로 만들고, 안 바뀐 날짜는 이전 버전의 행을 그대로 승계**할 수 있다. v2를 발행해도 월~수가 그대로면 그 행들은 v1 행을 재사용하고, 목요일만 고쳤으면 목요일 행만 새로 생긴다. 선수의 로그와 요약은 그대로 붙어 있다.

### 조회 규칙

선수가 특정 날짜의 운동을 볼 때:

```
1. 그 날짜를 포함하는 프로그램 중 해당 선수에게 배정된 것을 찾는다
   (program_assignments ⋈ programs
    WHERE date BETWEEN week_start_date AND week_start_date + 6)
2. 배정에 고정된 version_id의 program_version_templates로 템플릿 행을 얻고,
   그중 date가 일치하는 행만 취한다
3. 여기에 owner_user_id = 본인이고 date가 일치하는 추가운동 행을 더한다
```

프로그램의 주간 범위는 `week_start_date`(월요일)부터 6일 뒤(일요일)까지로 정의한다. 운동은 월~금이지만 범위는 주 단위로 잡아 주말 추가운동도 같은 프로그램에 속하게 한다.

배정이 없는 날짜는 **빈 화면**이 된다(2번에서 아무것도 안 나옴). 선수가 중간에 합류하면 그 이전 주차는 보이지 않는다. 코치가 과거 프로그램을 소급 배정하면 그때 보인다.

한 선수에게 같은 날짜를 포함하는 프로그램이 둘 이상 배정되는 상황은 만들지 않는다. 발행/배정 UI(B)에서 주간이 겹치는 배정을 막고, 그럼에도 발생하면 `week_start_date`가 늦은 쪽을 취한다.

3번이 추가운동 유출 버그를 닫는다.

## A.2 발행 규칙

발행 시 각 날짜를 세 구간으로 나눠 처리한다.

| 날짜 | 동작 |
|---|---|
| **과거** (`date < today`) | 잠금. 편집기에서 읽기 전용. 새 버전에 이전 행을 그대로 승계. 코치가 고쳐도 발행 시 무시하고 경고를 띄운다 |
| **오늘** (`date = today`) | 이미 기록한 선수가 있으면 "N명이 기록했습니다 — 덮어쓸까요?" 확인. 코치가 진행하면 새 행으로 교체 |
| **미래** (`date > today`) | 확인 없이 덮어쓰기 |

이 규칙이 "**과거 날짜의 행은 절대 바뀌지 않는다**"를 불변식으로 보장하고, 그래서 A.1의 행 승계가 안전하다.

`today`는 서버 시각 기준(KST)으로 판정한다. 클라이언트 시각을 믿지 않는다.

## A.3 서버 API 경계

### 세션

`POST /api/auth/login`에서 서버가 PIN을 검증하고 서명된 httpOnly 쿠키를 발급한다.

- 페이로드: `{ user_id, username, role, exp }`
- 서명: `node:crypto` HMAC-SHA256, 시크릿은 환경변수 `SESSION_SECRET`
- 쿠키 속성: `httpOnly`, `SameSite=Lax`, `Secure`(프로덕션)
- 자동 로그인 체크 시 `maxAge` 30일, 미체크 시 세션 쿠키

**클라이언트가 자기 `user_id`를 들고 다니지 않게 되는 것이 이 작업의 요점이다.** 현재의 localStorage 저장(`src/lib/auth.ts`)은 제거한다. 단 "마지막 로그인 username"은 편의 기능이므로 localStorage에 남긴다.

### 권한 게이트

서버 헬퍼 3개. 모든 라우트가 이 중 하나로 시작한다.

```ts
requireUser(req)             // 세션 없으면 401
requireCoach(req)            // role !== 'coach' 면 403
assertOwn(session, userId)   // 본인 아니면 403
```

### 라우트 구성

```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/session

GET    /api/workouts/[date]        본인에게 배정된 그날 템플릿 + 추가운동
POST   /api/workouts/duplicate     추가운동 복제 (owner_user_id = 세션 사용자)
DELETE /api/workouts/extra/[id]    본인 소유 확인 후 삭제
GET    /api/logs/[date]
POST   /api/logs                   upsert. user_id는 세션에서 주입
GET    /api/summaries/[date]
PUT    /api/summaries/[date]
GET    /api/pr/...                 본인 것만
GET    /api/calendar/[year]/[month]
```

코치 전용 라우트(`/api/coach/*`)는 B에서 추가한다. A에서는 게이트 헬퍼만 만들어 둔다.

### 기존 코드 영향 최소화

`src/lib/api/` 8개 파일의 **함수 시그니처를 유지한 채 본문만** `supabase.from(...)` → `fetch('/api/...')`로 바꾼다. 화면 컴포넌트는 수정하지 않는다.

예외적으로 `userId` 인자는 **제거한다**. 서버가 세션에서 꺼내므로 클라이언트가 남의 id를 넣을 방법 자체를 없앤다. 이 인자를 넘기던 호출부만 수정 대상이다.

### DB 조이기

```sql
REVOKE ALL ON ALL TABLES IN SCHEMA ddodun FROM anon;
REVOKE ALL ON SCHEMA ddodun FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA ddodun REVOKE ALL ON TABLES FROM anon;
```

이후 DB 접근은 서버의 service role 뿐이다. anon 키가 유출돼도 무의미해진다.

주차별 삽입 스크립트(`.claude/skills/ddodun-weekly-workout/scripts/insert.mjs`)는 이미 service role 키를 쓰므로 계속 동작한다. 다만 B가 완성되면 이 경로는 코치 콘솔로 대체된다.

### PIN 해싱

`node:crypto`의 `scrypt`로 교체한다(의존성 추가 없음). 저장 형식은 `scrypt$<salt_hex>$<hash_hex>`.

기존 계정은 평문이므로, 로그인 시 저장값이 `scrypt$`로 시작하지 않으면 평문으로 간주해 직접 비교하고, 일치하면 그 자리에서 해시로 교체한다. 컬럼명 `pin_hash`는 그대로 둔다.

## A.4 마이그레이션

한 트랜잭션으로 실행한다. **기존 741행의 id는 하나도 바꾸지 않는다.**

```
1. users.role 컬럼 추가 (NOT NULL DEFAULT 'athlete')
   → 기존 chacha, jindun은 자동으로 'athlete'
2. 코치 계정 신규 생성 (username은 실행 시 지정, role='coach', pin_hash는 NULL로 두고 첫 로그인 시 설정)
3. programs / program_versions / program_version_templates / program_assignments 생성
4. workout_templates.owner_user_id 컬럼 추가
5. 추가운동 6행의 owner_user_id를 연결된 로그의 user_id로 채움
   → 로그가 없는 고아 행이 있으면 마이그레이션 중단하고 수동 확인
6. 프로그램 행 735행을 date 기준 주(월요일) 단위로 GROUP BY
   → 레거시 프로그램 N개 생성, 각각 version_no=1 / status='published'
   → program_version_templates로 기존 행 연결
   → coach_id는 2번에서 만든 코치 계정
7. chacha·jindun에게 전 주차 assignment 생성 (각 프로그램의 v1)
```

주차별 SQL 파일이 이미 주 단위로 관리되어 있어 6번의 그룹핑이 기존 자산과 정확히 일치한다.

`source_text`는 레거시 버전에 대해 NULL로 둔다(원본 텍스트가 없으므로).

## A.5 검증

이 프로젝트에는 테스트 프레임워크가 없다. 기존 방식(`tsc` + `next build` + 라이브 DB 왕복)을 유지하되, 마이그레이션은 **불변식을 사전/사후 비교하는 스크립트**로 검증한다.

`scripts/verify-migration.mjs`를 만들어 마이그레이션 전후로 실행하고 결과를 비교한다.

| # | 불변식 | 실패 시 |
|---|---|---|
| 1 | 모든 `workout_logs.template_id`가 존재하는 템플릿 행을 가리킨다 (659건) | 롤백 |
| 2 | 각 (선수, 날짜) 조합에서 보이는 템플릿 id 집합이 마이그레이션 전과 **완전히 동일**하다 | 롤백 |
| 3 | 저장된 `workout_day_summaries.blocks[].template_ids`가 전부 유효하다 | 롤백 |
| 4 | 추가운동 6행이 모두 `owner_user_id`를 갖는다 | 롤백 |

2번이 핵심이다. 마이그레이션 전에는 "그 날짜의 모든 템플릿", 후에는 "배정된 버전의 템플릿 + 본인 추가운동"으로 경로가 완전히 달라지는데, 결과가 같아야 한다.

서버 API 경계 작업은 다음으로 검증한다.

- `tsc --noEmit`, `next build` 통과
- anon 키로 `ddodun` 스키마 직접 접근이 **거부**되는지 확인 (REVOKE가 실제로 걸렸는지)
- 로그인 → 기록 → 요약 생성 왕복을 실제 브라우저에서 1회 수행
  (참고: PIN 인증 화면이 헤드리스 브라우저를 막으므로 이 단계는 수동 확인이 필요하다)

## A.6 완료 기준

- 기존 두 선수가 로그인해서 **이전과 똑같은 화면**을 본다
- 선수 A의 추가운동이 선수 B에게 보이지 않는다
- anon 키로는 DB에 접근할 수 없다
- PIN이 평문으로 저장되지 않는다
- 불변식 4개가 전부 통과한다

## 이후 작업 (별도 스펙)

**B. 코치 콘솔** — 선수 관리, `ProgramDraftSource` 구현(텍스트 파서), 파싱 미리보기, 발행/배정 UI. 발행 규칙(A.2)의 UI 구현이 여기 포함된다.

**C. 결과 공유** — `workout_day_summaries`에 공유 플래그 추가, 선수 공유 버튼, 코치 결과 조회 뷰.

## 미해결 질문

- 코치가 주간 운동을 원래 어디에 작성하는지 확인 필요. 텍스트 원본이 없으면 B에서 `ProgramDraftSource`를 LLM 이미지 파싱 구현으로 교체한다.
- 코치 계정의 username을 무엇으로 할지는 마이그레이션 실행 시점에 정한다.
