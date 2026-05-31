# DDODUN 구현 진행 현황

## Phase 1 MVP 진행 상태

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| 1 | Next.js 프로젝트 초기화 + 기본 설정 | ✅ 완료 | Next.js 16 + TS + Tailwind v4 + Supabase |
| 2 | 테마 시스템 + globals.css | ✅ 완료 | Classic/Gold/Warm 3테마, CSS 변수 |
| 3 | 인증 시스템 (login, PIN, AuthGuard) | ✅ 완료 | 2026bp 패턴 기반, ddodun-* 키 |
| 4 | 레이아웃 + 하단 네비게이션 | ✅ 완료 | Header + BottomNav 3탭 + ClientLayout |
| 5 | 빈 페이지 + 설정 페이지 (로그아웃) | ✅ 완료 | 홈/운동/PR 빈 페이지 + 설정 |
| 6 | Supabase SQL 스키마 문서 | ✅ 완료 | docs/schema.sql |
| 7 | 빌드 확인 + UX 테스트 | ✅ 완료 | 빌드 성공, UX 리뷰 반영 완료 |
| 8 | 홈 - 캘린더 뷰 + 대회 등록 | ✅ 완료 | 월간 그리드, 운동/대회 도트, 대회 CRUD |
| 9 | 운동 기록 페이지 | ✅ 완료 | 주간 날짜 스트립, 섹션별 운동 렌더링 |
| 10 | 운동 UI 리디자인 | ✅ 완료 | 이미지 기반 렌더링 규칙, 그룹별 결과/메모 |
| 11 | PR 페이지 (1RM/nRM/페이스) | ✅ 완료 | 4열 카드 그리드, nRM/페이스 모달 |
| 12 | 무게 계산기 (플로팅) | ✅ 완료 | 직접입력/1RM 모드, 퍼센트 계산 |
| 13 | PR API user_id 필터 적용 | ✅ 완료 | 멀티유저 지원 |
| 14 | 오늘의 운동 요약 | ✅ 완료 | 완료 체크된 운동만 텍스트 요약 + 복사 |
| 15 | 멀티세트 결과 입력 | ✅ 완료 | Rounds/Reps/Time/Cal 모두 세트 추가 가능 |
| 16 | Cal 결과 타입 추가 | ✅ 완료 | WT/Rounds/Reps/Time + Cal |
| 17 | 성능 최적화 | ✅ 완료 | React.memo, useMemo, useCallback, 디바운스 |
| 18 | PWA 설정 | ✅ 완료 | manifest.json + 앱 아이콘 (192/512) + favicon |
| 19 | GitHub 레포 + Vercel 배포 | ✅ 완료 | ddodun.vercel.app |
| 20 | Supabase RLS + GRANT 설정 | ✅ 완료 | anon 역할 권한, 프로덕션 인증 동작 |
| 21 | UI/UX 스타일 다수 조정 | ✅ 완료 | 아래 상세 |
| 22 | EMOM 복사/요약 분별 포맷 | ✅ 완료 | 1MIN: 10 Bar muscleup @95lb |
| 23 | 결과 모드/패널 상태 영속화 | ✅ 완료 | result_type, _result_open, _memo_open |
| 24 | 렌더링 최적화 2차 | ✅ 완료 | memo ID비교, useMemo 캐싱 |
| 25 | 클라이언트 캐시 (dateCache) | ✅ 완료 | 방문한 날짜 즉시 표시 |
| 26 | 캘린더 일-토 + 완료 도트 필터 | ✅ 완료 | completed=true만 다크그린 도트 |
| 27 | 복사 토스트 | ✅ 완료 | 1초간 '복사됨' 표시 |
| 28 | 운동 검색 (롱프레스) | ✅ 완료 | 1초 롱프레스 → YouTube/Google 검색 팝업 |

## 2026-03-16 운동 UI 리디자인 상세

### 운동 이미지 → UI 렌더링 시스템

코치 운동 이미지의 텍스트를 DB에 넣으면 자동으로 올바른 UI로 렌더링되는 규칙 체계를 구축함.

#### description 줄 분류 (`parseDescription`)

| 순서 | 패턴 | 분류 | UI |
|------|------|------|-----|
| 1 | `N Sets`, `N x M`, `Every ...` | **setInfo** | 섹션 헤더 라벨 또는 구분 행 서브헤더 |
| 2 | setInfo 다음 줄이 `(`로 시작 | **setInfo 보충** | `·`로 이어붙임 (예: `3 Sets · (0:40 On / 0:20 Off)`) |
| 3 | `21-15-9` (렙스킴 `N-N-N`) | **subheader** | 회색 서브헤더 행 |
| 4 | `N rounds for time of :` | **subheader** | 회색 서브헤더 행 |
| 5 | `* ...`, `@ ...`, `- Rest ...`, `Rest N:NN` | **note** | 이전 운동에 붙어서 표시 (회색 이탤릭, border 없음, `pb-1.5`) |
| 6 | `* Rest as needed` | **separator용** | note에서 제외, 템플릿 간 구분 행 텍스트로 사용 |
| 7 | 나머지 | **exercise** | 운동 행 + lb 버튼 |

#### title 3분기 렌더링

| title 유형 | 렌더링 |
|------------|--------|
| 섹션 타이틀 (`AMRAP N`, `EMOM N`, `For time`) | title → 섹션 헤더 라벨, description 각 줄 → 개별 운동 행 + lb 버튼 |
| 일반 운동명 (`Back Squat`, `3 Front Squat`) | title → 운동 행 + lb 버튼, description → 아래 설명 텍스트 |
| NULL | description 각 줄 → 개별 운동 행 + lb 버튼 |

#### 같은 섹션 내 그룹 분리

- setInfo가 있는 다음 템플릿에서 **새 그룹** 시작
- 각 그룹은 독립 결과/메모 패널 보유
- 첫 그룹 버튼: 섹션 헤더 오른편
- 이후 그룹 버튼: setInfo 행 오른편
- 구분 행: `Rest as needed` 또는 `Rest N:NN` 텍스트 표시, 없으면 빈 구분선

#### 결과 패널

- 5가지 모드: **WT** (세트별 무게), **Rounds** (R + 추가렙), **Reps**, **Time** (mm:ss), **Cal**
- 전체 너비, 오른정렬 레이아웃
- 모든 모드에서 `+ 세트` 버튼으로 멀티세트 추가 가능
- WT: `+ 세트` 버튼만 왼정렬, 나머지 오른정렬
- 숫자 입력칸: 스피너 제거 (`appearance: textfield`), 내부 중앙정렬, font-bold 제거

#### EMOM Builder

- 분별 입력: 숫자 → reps/cal 토글 → 동작명 → +wt → 쓰레기통(삭제)
- `+ 분` 버튼으로 분 추가

#### lb 버튼

- 닫힘: `w-5 h-5 rounded-full border border-text-secondary/30` (배경 없음, 작은 동그라미)
- 열림: −5 / 입력칸 / +5 / 단위토글 / ✕ 인라인

### 무게 계산기 (플로팅)

- 운동 탭 하단 right-4 bottom-20 플로팅 버튼 (계산기 아이콘)
- 클릭 시 하단 패널 (bottom-[4rem]) 에 계산기 표시
- 두 모드: **직접입력** (무게 타이핑) / **1RM** (PR에 등록된 운동 선택)
- `[무게] × [n]% = [결과]` 형식
- 퍼센트 ±5 버튼 + 직접 입력
- 결과: accent 색상 pill 스타일
- user_id 기반 1RM 데이터 조회

### PR API user_id 적용

- `pr.ts` 전체 함수에 `userId` 파라미터 추가
- `getAll1RM(userId)`, `upsert1RM(userId, ...)`, `getAllNRM(userId)`, `upsertNRM(userId, ...)`, `getAllPaceRecords(userId)`, `upsertPaceRecord(userId, ...)`
- `pr/page.tsx`에서 `getLoggedInUser()` 호출하여 userId 전달
- `Calculator.tsx`에서 userId prop으로 1RM 조회

### 버그 수정

- **날짜 간 상태 유지 버그**: resultOpen/memoOpen이 다른 날짜에서도 열려있던 문제 → useEffect에서 항상 초기화
- **줄 순서 보존**: description의 note가 분리되어 하단으로 밀리던 문제 → `orderedLines` 배열로 원래 위치 유지

## 2026-03-17~18 기능 추가 및 개선

### 오늘의 운동 요약 (TodaySummary)

- 홈 캘린더 하단에 오늘 완료한 운동 텍스트 요약 표시
- 완료 체크된 운동만 section + sort_order 순서로 정렬
- 같은 섹션 내 다른 템플릿 사이 빈 줄, Rest 행 아래 빈 줄 삽입
- 사용자 수정 가능한 textarea + 클립보드 복사 버튼
- 홈 page.tsx에서 templates+logs를 props로 전달 (자체 fetch 안함)

### 멀티세트 결과 입력

- ResultInput 전면 개편: 모든 결과 타입(Rounds/Reps/Time/Cal)에 `+ 세트` 지원
- `ResultEntry[]` 배열로 여러 세트 관리
- 하위 호환: `getSets()` → 레거시 단일값을 배열로 마이그레이션, `emitChange()` → 첫 세트값을 top-level 필드에도 유지
- Cal 결과 타입 추가 (WT/Rounds/Reps/Time/Cal 5종)

### 성능 최적화

- **React.memo**: WorkoutSection에 커스텀 비교 함수 적용 (불필요한 리렌더 방지)
- **useMemo/useCallback**: workout/page.tsx에서 sections, sectionLogs 메모이제이션
- **initializedRef 패턴**: 첫 로드 시 전체 설정, 이후 로드 시 merge만 (lb 입력 닫힘 방지)
- **pendingSavesRef**: 디바운스 저장 미완료 시 언마운트 때 flush
- **PR 로컬 상태 갱신**: nRM/페이스 저장/삭제 시 전체 loadData 대신 로컬 state 업데이트

### 성능 최적화 2차 (2026-03-19)

- **WorkoutSection memo 비교**: 참조 비교 → ID/content 기반 비교 (불필요한 리렌더 20~30% 감소)
- **parseDescription useMemo 캐싱**: templates 변경 시에만 재파싱 (렌더마다 → 1회)
- **computeGroups useMemo 캐싱**: 그룹 계산도 templates 변경 시에만
- **emptyLogs 상수**: `[]` 리터럴의 매 렌더 새 참조 생성 방지
- **클라이언트 dateCache**: 방문한 날짜 데이터를 세션 내 메모리 캐시, 즉시 표시 후 백그라운드 갱신
- **handleLogUpdate 캐시 연동**: 로그 업데이트 시 캐시도 동기화
- **로딩 중 opacity 처리**: 캐시 없는 날짜 로딩 시 운동 섹션 흐리게 표시

### 상태 관리 안정화 (2026-03-19)

- **localLogs merge + pendingSaves 보호**: 디바운스 저장 대기 중인 템플릿은 서버 데이터로 덮어쓰지 않음
- **localLogsRef**: saveLog에서 stale closure 방지 — 항상 최신 localLogs 참조
- **결과 모드 영속화**: result_type을 DB에 저장, 모드 전환 시 즉시 반영
- **패널 열림/닫힘 영속화**: _result_open, _memo_open 플래그를 sets_detail에 저장

### PWA + 배포

- `manifest.json` 생성 (standalone, DDODUN 아이콘 192/512)
- `favicon.ico`, `icon-192.png`, `icon-512.png` 생성 (ddodun_icon_v1.png 기반)
- layout.tsx에 favicon + apple-touch-icon 링크 추가
- GitHub 레포 생성 (fittcha/ddodun)
- Vercel 배포 (https://ddodun.vercel.app)
- Supabase RLS 정책 + `GRANT USAGE/SELECT/INSERT/UPDATE/DELETE ON SCHEMA ddodun TO anon` 설정

### UI/UX 스타일 조정

| 변경 사항 | 상세 |
|-----------|------|
| 대회 + 버튼 | w-6 h-6 rounded-full border-[1.5px] border-accent, Plus size={13} strokeWidth={2.5} |
| 헤더 배경 | bg-surface (BottomNav와 동일) |
| 운동 카드 그림자 | shadow-sm 제거 |
| 운동 카드 보더 | border-border (원복) |
| 메모 패널 배경 | 연한 초록 배경 제거, border-t border-border (원복) |
| 결과 패널 레이아웃 | 2단(w-1/2) → 전체 너비 오른정렬 |
| 결과 입력 폰트 | font-bold 제거 (ResultInput, WeightSetsInput, EmomBuilder) |
| 캘린더 운동 도트 | bg-accent (다크그린) |
| 토요일/일요일 텍스트 | text-success/60 (토), text-danger/60 (일) |
| 날짜 스트립 보더 | border-border (원복) |
| 계산기 배경 | bg-black/20 (블러 없음) |
| 로그아웃 버튼 | border border-border 추가 |
| 주간 네비 | 같은 요일 유지 이동 (수요일→다음주 수요일) |

## UX 리뷰 반영 사항

| 이슈 | 수정 |
|------|------|
| PIN 화면에 뒤로가기 없음 | ChevronLeft 뒤로가기 버튼 추가 |
| PIN 오류 시 텍스트 없음 | errorMessage prop 추가, 오류 메시지 표시 |
| 테마 새로고침 후 초기화 | ThemeInitializer 컴포넌트 추가 |
| SSR 하이드레이션 불일치 | page.tsx, settings: useEffect에서 user 로드 |
| 로그아웃 후 뒤로가기 | router.replace 사용 |
| 설정 버튼 aria-label 없음 | aria-label="설정" 추가 |
| 하단 네비 터치 타겟 작음 | py-2 → py-3 확대 |
| PIN 키패드 빈 셀 | disabled button → div로 변경 |
| PIN 삭제 버튼 aria-label 없음 | aria-label="삭제" 추가 |
| 유저명 입력 속성 부족 | autoComplete, autoCapitalize 추가 |

## 파일 구조

```
app/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # RootLayout (Pretendard, PWA)
│   │   ├── globals.css           # 테마 CSS 변수 (3테마)
│   │   ├── page.tsx              # 홈 (캘린더 뷰)
│   │   ├── login/page.tsx        # 로그인 (username + PIN)
│   │   ├── workout/page.tsx      # 운동 기록 + 플로팅 계산기
│   │   ├── pr/page.tsx           # PR 기록 (1RM/nRM/페이스)
│   │   └── settings/page.tsx     # 설정 (테마/단위/로그아웃)
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthGuard.tsx     # 라우트 보호
│   │   │   └── PinInput.tsx      # 4자리 PIN 키패드
│   │   ├── home/
│   │   │   └── TodaySummary.tsx  # 오늘의 운동 요약 (완료 운동 텍스트 + 복사)
│   │   ├── calendar/
│   │   │   └── Calendar.tsx      # 월간 캘린더 그리드
│   │   ├── workout/
│   │   │   ├── WorkoutSection.tsx # 섹션별 운동 렌더링 (그룹별 결과/메모)
│   │   │   ├── WeightSetsInput.tsx # 세트별 무게 입력
│   │   │   ├── ResultInput.tsx    # Rounds/Reps/Time/Cal 멀티세트 결과 입력
│   │   │   ├── EmomBuilder.tsx    # EMOM 분별 입력
│   │   │   ├── ExerciseSearchModal.tsx # 운동 검색 팝업 (롱프레스)
│   │   │   ├── Calculator.tsx     # 무게 계산기 (직접입력/1RM)
│   │   │   └── CustomWorkoutForm.tsx # 개인 운동 추가
│   │   ├── pr/
│   │   │   ├── ExerciseIcons.tsx  # 운동별 아이콘
│   │   │   ├── NrmAddModal.tsx    # nRM 추가 모달
│   │   │   └── PaceAddModal.tsx   # 페이스 추가 모달
│   │   ├── ClientLayout.tsx      # AuthGuard + Header + BottomNav
│   │   ├── Header.tsx
│   │   ├── BottomNav.tsx
│   │   └── ThemeInitializer.tsx
│   └── lib/
│       ├── auth.ts               # 인증 헬퍼
│       ├── date-utils.ts         # 날짜 유틸
│       ├── api/
│       │   ├── users.ts          # Supabase users API
│       │   ├── workout-templates.ts # 운동 템플릿 API
│       │   ├── workout-logs.ts   # 운동 로그 API
│       │   ├── competitions.ts   # 대회 API
│       │   └── pr.ts             # 1RM/nRM/페이스 API (user_id 기반)
│       └── supabase.ts           # Supabase 클라이언트 (ddodun 스키마)
├── public/
│   ├── manifest.json             # PWA 매니페스트
│   ├── favicon.ico               # 파비콘
│   ├── icon-192.png              # PWA 아이콘 192x192
│   └── icon-512.png              # PWA 아이콘 512x512
├── docs/
│   ├── prd.md                    # PRD (렌더링 규칙 포함)
│   ├── progress.md               # 이 파일
│   ├── ddodun_icon_v1.png        # 앱 아이콘 원본
│   └── ddodun_logo_v1.png        # 로고 원본
└── package.json
```

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-03-16 | 프로젝트 시작, Phase 1 기본 골격 구현 완료 |
| 2026-03-16 | PRD 업데이트 - 인증 시스템 (username + PIN) 추가 |
| 2026-03-16 | UX 리뷰 수행 및 10건 개선사항 반영 |
| 2026-03-16 | 운동 UI 리디자인 — 이미지 텍스트 렌더링 규칙 체계 구축 |
| 2026-03-16 | 그룹별 결과/메모 패널 (섹션 단위 → 그룹 단위) |
| 2026-03-16 | 결과 패널 오른정렬, WT 스피너 제거, note 패딩 조정 |
| 2026-03-16 | EMOM Builder UI 재배치 (숫자→reps/cal→동작→+wt→삭제) |
| 2026-03-16 | lb 버튼 스타일 변경 (배경 없이 작은 동그라미) |
| 2026-03-16 | 무게 계산기 (플로팅) 구현 — 직접입력/1RM 모드 |
| 2026-03-16 | PR API 전체 user_id 필터 적용 (멀티유저) |
| 2026-03-17 | 오늘의 운동 요약 (TodaySummary) 구현 |
| 2026-03-17 | 멀티세트 결과 입력 + Cal 타입 추가 |
| 2026-03-17 | 성능 최적화 (React.memo, useMemo, useCallback, 디바운스 flush) |
| 2026-03-17 | lb 입력 닫힘 버그 수정 (initializedRef + exercise_weights 복원) |
| 2026-03-17 | PWA manifest + 앱 아이콘 생성 |
| 2026-03-17 | GitHub 레포 생성 + Vercel 배포 (ddodun.vercel.app) |
| 2026-03-17 | Supabase RLS + GRANT 설정 (프로덕션 인증) |
| 2026-03-18 | UI/UX 스타일 다수 조정 (그림자/보더/배경/폰트 등) |
| 2026-03-18 | 주간 네비 같은 요일 유지 이동 |
| 2026-03-19 | 캘린더 일-토 변경, 완료 도트 필터 (completed=true만) |
| 2026-03-19 | EMOM 복사/요약 분별 포맷 (1MIN: 10 Bar muscleup @95lb) |
| 2026-03-19 | 결과 모드(Cal/Reps/Time 등) 복원 버그 수정 (result_type 우선) |
| 2026-03-19 | 결과/메모 패널 열림/닫힘 상태 DB 영속화 (_result_open, _memo_open) |
| 2026-03-19 | 운동 상태 관리 안정화 (localLogs merge + pendingSaves 보호 + localLogsRef) |
| 2026-03-19 | 렌더링 최적화 2차 — memo ID비교, parseDescription/computeGroups useMemo 캐싱 |
| 2026-03-19 | 클라이언트 캐시 (dateCache) — 방문한 날짜 즉시 표시 + 백그라운드 갱신 |
| 2026-03-19 | 로딩 중 opacity 처리, 복사 시 '복사됨' 토스트 1초 표시 |
| 2026-03-31 | 운동 검색 롱프레스 — ExerciseSearchModal (YouTube/Google) |
| 2026-03-31 | parseDescription: accumulate 패턴 setInfo 분류 추가 |
| 2026-04-19 | 4주차 운동 데이터 입력 (week8-templates.sql), for time setInfo 패턴 추가 |
| 2026-05-04 | N x / N-N-N 조건부 분류 (1개→setInfo, 여러개→note) |
| 2026-05-04 | — into — / * and then, 그룹 구분자 패턴 추가 |
| 2026-05-04 | 5~6주차 운동 데이터 입력 (week9, week10-templates.sql) |

## 2026-03-31 운동 검색 (롱프레스)

### ExerciseSearchModal

- 운동 이름 1초 롱프레스 → 중앙 팝업 (280px)
- YouTube / Google 검색 버튼 (아웃라인 스타일: 빨강/파랑 테두리+글자)
- 검색어 전처리 `stripReps()`:
  - 숫자/reps 제거: `30 Hollow Rock` → `Hollow Rock`
  - 복합 reps: `10/10 Side Plank Rotations` → `Side Plank Rotations`
  - 시간: `1:00 Plank Hold` → `Plank Hold`
  - 거리: `5m Bear Crawl` → `Bear Crawl`, `100ft Sled Push` → `Sled Push`
  - 접두사: `Max Reps Ring Dips` → `Ring Dips`, `Max Cal Row` → `Row`
- 검색어에 `exercise form` 키워드 자동 추가
- 3가지 렌더링 케이스 모두 적용 (섹션타이틀/운동타이틀/무타이틀)
- 스크롤 시 오작동 방지 (touchMove/touchEnd 취소, contextMenu 차단)

### parseDescription 개선

- `accumulate ...` 패턴을 setInfo로 분류 (기존에는 exercise로 잘못 분류)

## 2026-05-04 parseDescription 분류 규칙 개선 + 데이터 입력

### parseDescription 분류 규칙 변경
- `N x` 패턴 (예: `5 x 2`, `3 x (1+1)`): description 내 **1개면 setInfo**, 여러 개면 모두 note
- `N-N-N` 패턴 (예: `2-1-1-2-1-1`): description 내 **1개면 setInfo**, 여러 개면 모두 note
- `— into —` 패턴: 그룹 구분자(leadingRest)로 인식 — `Rest as needed`와 동일 역할
- `* and then,` 패턴: 그룹 구분자(leadingRest)로 인식

### 운동 데이터 입력
- 5주차 5/5 (04.27~05.01): week9-templates.sql — FET Classic 대회 시뮬레이션
- 1주차 1/4 (05.04~05.08): week10-templates.sql — 38 rows (MON 9, TUE 8, WED 8, THU 6, FRI 7)

## 다음 단계

- [ ] 플레이트 계산 표시 (바벨 무게 제외 후 한쪽 플레이트 목록)
- [ ] workout-logs API에 user_id 필터 추가
- [ ] 벤치마크 WOD 기록 기능
