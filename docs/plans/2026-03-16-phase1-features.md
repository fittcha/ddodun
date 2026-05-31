# Phase 1 기능 구현 계획 (캘린더 → 운동 기록 → PR)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** DDODUN Phase 1 MVP의 3개 핵심 화면(캘린더/운동기록/PR)을 순차적으로 구현

**Architecture:** Supabase `ddodun` 스키마에 나머지 테이블 생성 → 캘린더 뷰(홈) → 운동 기록 페이지 → PR 페이지 순서. 각 화면은 독립적인 API 레이어 + 페이지 컴포넌트로 구성. 자동 저장은 800ms 디바운스 패턴.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Supabase (ddodun schema), lucide-react

**기존 코드:**
- `app/src/lib/supabase.ts` — Supabase 클라이언트 (ddodun 스키마)
- `app/src/lib/auth.ts` — 인증 헬퍼
- `app/src/components/` — AuthGuard, Header, BottomNav, ClientLayout
- `app/src/app/` — layout, login, settings, workout(빈), pr(빈), page(빈 홈)

---

## Task 1: Supabase 나머지 테이블 생성

**목표:** workout_templates, workout_logs, competitions, user_1rm, user_nrm, user_pace_records, user_settings 테이블 생성

**파일:**
- 수정: `docs/schema.sql` (전체 SQL 추가)

**SQL (Supabase SQL Editor에서 실행):**

```sql
-- workout_templates
CREATE TABLE ddodun.workout_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  day_of_week text NOT NULL,
  section text NOT NULL,
  workout_type text NOT NULL DEFAULT 'custom',
  title text,
  description text,
  prescribed_sets int,
  prescribed_reps text,
  prescribed_weight text,
  prescribed_time text,
  rest_seconds int,
  notes text,
  sort_order int DEFAULT 0
);

-- workout_logs
CREATE TABLE ddodun.workout_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  template_id uuid REFERENCES ddodun.workout_templates(id),
  section text,
  is_custom boolean DEFAULT false,
  exercise_name text,
  completed boolean DEFAULT false,
  result_value text,
  result_unit text,
  sets_detail jsonb,
  memo text,
  created_at timestamptz DEFAULT now()
);

-- competitions
CREATE TABLE ddodun.competitions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  name text NOT NULL,
  team_name text,
  team_members text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- user_1rm
CREATE TABLE ddodun.user_1rm (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_name text UNIQUE NOT NULL,
  weight decimal,
  weight_unit text DEFAULT 'lb',
  updated_at timestamptz DEFAULT now()
);

-- user_nrm
CREATE TABLE ddodun.user_nrm (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_name text NOT NULL,
  rep_max int NOT NULL CHECK (rep_max BETWEEN 2 AND 10),
  weight decimal,
  weight_unit text DEFAULT 'lb',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(exercise_name, rep_max)
);

-- user_pace_records
CREATE TABLE ddodun.user_pace_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment text NOT NULL,
  distance text NOT NULL,
  time_seconds int,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(equipment, distance)
);

-- user_settings
CREATE TABLE ddodun.user_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  theme text DEFAULT 'classic',
  default_weight_unit text DEFAULT 'lb',
  updated_at timestamptz DEFAULT now()
);

-- RLS (모든 테이블)
ALTER TABLE ddodun.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddodun.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddodun.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddodun.user_1rm ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddodun.user_nrm ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddodun.user_pace_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddodun.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON ddodun.workout_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON ddodun.workout_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON ddodun.competitions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON ddodun.user_1rm FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON ddodun.user_nrm FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON ddodun.user_pace_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON ddodun.user_settings FOR ALL USING (true) WITH CHECK (true);

-- schema reload
NOTIFY pgrst, 'reload schema';
```

---

## Task 2: API 레이어 — 캘린더 데이터

**목표:** 캘린더에 필요한 Supabase 쿼리 함수들

**파일:**
- 생성: `app/src/lib/api/workout-templates.ts`
- 생성: `app/src/lib/api/workout-logs.ts`
- 생성: `app/src/lib/api/competitions.ts`

**workout-templates.ts:**
- `getTemplateDatesByMonth(year, month)` → 해당 월에 템플릿이 있는 날짜 목록 (distinct dates)
- `getTemplatesByDate(date)` → 해당 날짜의 템플릿 목록 (section, sort_order 정렬)

**workout-logs.ts:**
- `getLogDatesByMonth(year, month)` → 해당 월에 기록이 있는 날짜 목록
- `getLogsByDate(date)` → 해당 날짜의 로그 목록
- `upsertLog(log)` → 로그 저장 (insert or update)
- `deleteLog(id)` → 로그 삭제

**competitions.ts:**
- `getCompetitionsByMonth(year, month)` → 해당 월 대회 목록
- `getCompetitionByDate(date)` → 해당 날짜 대회
- `createCompetition(comp)` → 대회 등록
- `updateCompetition(id, comp)` → 대회 수정
- `deleteCompetition(id)` → 대회 삭제

---

## Task 3: 캘린더 컴포넌트

**목표:** 월간 캘린더 그리드 + 날짜별 도트 + 월 이동 + 오늘 강조

**파일:**
- 생성: `app/src/components/calendar/Calendar.tsx`
- 생성: `app/src/lib/date-utils.ts` (날짜 유틸: 월의 날짜 배열, 요일 계산 등)

**Calendar.tsx 구조:**
- props: `onDateSelect(date)`, `templateDates`, `logDates`, `competitionDates`
- 상단: `< 2026년 3월 >` + "오늘" 버튼
- 그리드: 월~일 7열, 날짜 셀마다 도트 표시
  - 다크그린 도트: logDates에 포함
  - 회색 도트: templateDates에만 포함 (logDates에는 없음)
  - 빨간 도트: competitionDates에 포함
- 오늘: accent 원형 배경
- 날짜 탭 → onDateSelect 콜백

---

## Task 4: 대회 등록 모달

**목표:** 대회 CRUD 모달 (등록/수정/삭제)

**파일:**
- 생성: `app/src/components/calendar/CompetitionModal.tsx`

**CompetitionModal.tsx:**
- props: `isOpen`, `onClose`, `competition?` (수정 시), `onSave`, `onDelete?`
- 입력: 날짜(date input), 대회명(필수), 팀명, 팀원, 메모
- 저장/삭제 버튼
- 바텀 시트 스타일 (모바일 UX)

---

## Task 5: 홈 페이지 (캘린더 뷰) 조립

**목표:** page.tsx에 캘린더 + 대회 모달 + 이번 달 요약 통합

**파일:**
- 수정: `app/src/app/page.tsx`

**구성:**
1. Calendar 컴포넌트 (월간 데이터 fetch + 도트 표시)
2. `+` 버튼 → CompetitionModal 열기
3. 날짜 탭 → `router.push('/workout?date=YYYY-MM-DD')`
4. 이번 달 요약: 운동 일수 / 총 평일 수, 다가오는 대회
5. useEffect로 월 변경 시 데이터 re-fetch

---

## Task 6: 운동 기록 페이지 — 날짜 네비게이션 + 템플릿 로드

**목표:** /workout 페이지에 날짜 이동 + 코치 템플릿 섹션 표시

**파일:**
- 수정: `app/src/app/workout/page.tsx`

**구성:**
1. URL searchParams에서 date 읽기 (없으면 오늘)
2. 날짜 < > 화살표 네비게이션
3. 해당 날짜 대회 정보 카드 (있을 경우)
4. 해당 날짜 템플릿 로드 → 섹션별(A~G) 카드 표시
5. 각 섹션: title, description, workout_type 뱃지

---

## Task 7: 운동 기록 페이지 — 기록 입력 + 자동 저장

**목표:** 각 섹션별 완료/결과 기록 + 개인 운동 추가 + 자동 저장

**파일:**
- 생성: `app/src/components/workout/WorkoutSection.tsx`
- 생성: `app/src/hooks/useDebounce.ts`
- 수정: `app/src/app/workout/page.tsx`

**WorkoutSection.tsx:**
- 완료 체크박스
- result_value 입력 (workout_type에 따라 placeholder 변경)
- memo 입력
- 800ms 디바운스 자동 저장 (useRef + useEffect)

**개인 추가 운동:**
- 하단 "운동 추가" 버튼
- 자유 형식 운동명 + 결과 + 메모

---

## Task 8: PR 페이지 — 1RM

**목표:** 12종 기본 운동 1RM 카드 그리드 + 커스텀 운동 추가

**파일:**
- 생성: `app/src/lib/api/pr.ts`
- 수정: `app/src/app/pr/page.tsx`

**pr.ts API:**
- `getAll1RM()` → 전체 1RM 목록
- `upsert1RM(exercise, weight, unit)` → 저장
- `delete1RM(id)` → 삭제

**PR 페이지 1RM 섹션:**
- 기본 12종 카드 (4열 그리드)
- 각 카드: 운동명(한글) + 무게 입력 + lb/kg 토글
- 800ms 디바운스 자동 저장
- 커스텀 운동 추가 버튼 (기본 12종 뒤에 추가)

---

## Task 9: PR 페이지 — nRM + 페이스 기록

**목표:** nRM 등록/표시 + 페이스 기록 등록/표시

**파일:**
- 수정: `app/src/lib/api/pr.ts` (nRM, pace 함수 추가)
- 수정: `app/src/app/pr/page.tsx`
- 생성: `app/src/components/pr/NrmAddModal.tsx`
- 생성: `app/src/components/pr/PaceAddModal.tsx`

**nRM 섹션:**
- n값 기준 그룹핑 표시
- "+ nRM 추가" 버튼 → NrmAddModal (운동선택 → n값 → 무게)
- 카드 탭 → 수정/삭제

**페이스 섹션:**
- 종목별 그룹핑 (Rowing, Ski-erg)
- "+ 페이스 추가" 버튼 → PaceAddModal (종목 → 거리 → mm:ss)
- 카드 탭 → 수정/삭제

---

## Task 10: 빌드 확인 + UX 리뷰

**목표:** 전체 빌드 성공 + 플로우 테스트

- `npm run build` 성공 확인
- 캘린더 → 날짜 탭 → 운동 기록 플로우
- PR 페이지 1RM/nRM/페이스 CRUD
- 대회 등록/수정/삭제
- 테마 전환 동작 확인
