# DDODUN - CrossFit Personal Workout Tracker PRD

## 1. 개요

### 1.1 프로젝트 목적
크로스핏 선수 개인의 일일 운동 기록, PR(개인 기록) 트래킹, 무게 계산기를 제공하는 웹앱.
매주 코치가 제공하는 운동 프로그램 이미지를 기반으로 운동 템플릿을 등록하고, 선수가 매일 운동 수행 결과를 기록한다.

### 1.2 앱 이름
**DDODUN** (또둔)

### 1.3 사용자
- 크로스핏 선수 (개인 트래커, 멀티유저 지원)
- 인증: username + 4자리 PIN (2026bp와 동일 방식)
- 자동 로그인 지원 (localStorage)
- 월~금 매일 운동, 연중 지속 사용

### 1.4 핵심 가치
- **운동 기록의 편의성**: 다양한 크로스핏 운동 유형에 맞는 기록 UI
- **PR 트래킹**: 1RM, nRM(2~10RM), 로잉/스키어그 페이스 기록을 한 곳에서 관리
- **무게 계산기**: 1RM 퍼센트 기반 무게 빠른 계산
- **심플하고 빠른 사용성**: 운동 중에도 빠르게 기록 가능

---

## 2. 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js (App Router) + TypeScript |
| 스타일링 | Tailwind CSS |
| DB | Supabase (PostgreSQL), 기존 BP Tracker와 동일 프로젝트, **별도 스키마(`ddodun`)로 분리** |
| 배포 | Vercel (GitHub 연동 자동 배포) |
| PWA | manifest.json + apple-web-app meta (홈화면 추가 지원) |
| 폰트 | Pretendard Variable (CDN) |
| 아이콘 | lucide-react + 커스텀 SVG |

### 2.1 Supabase 스키마 분리
- 기존 BP Tracker: `public` 스키마 사용
- DDODUN: `ddodun` 스키마 생성하여 사용
- 동일 Supabase 프로젝트(슬롯) 내에서 스키마로 완전 분리
- Supabase 클라이언트에서 `db.schema('ddodun')` 옵션으로 접근
- RLS 정책도 `ddodun` 스키마 내에서 별도 설정

---

## 3. 디자인 가이드

### 3.1 테마 시스템

3가지 테마를 제공하며, 설정에서 전환 가능. 테마 선택은 localStorage에 저장. 기본 테마: Classic.

모든 테마에서 공통으로 사용하는 색상:

| 변수 | 색상 | 용도 |
|------|------|------|
| `--background` | 테마별 | 배경 |
| `--foreground` | #1A1A1A | 기본 텍스트 |
| `--surface` | 테마별 | 카드/섹션 배경 |
| `--text-secondary` | #6B7280 | 보조 텍스트 |
| `--accent` | #2D5A3D | 다크그린 메인 (모든 테마 공통) |
| `--accent-light` | #E8F0EB | 다크그린 밝은 배경 (모든 테마 공통) |
| `--border` | 테마별 | 테두리 |
| `--danger` | #EF4444 | 빨간색 (미완료, 경고) |

#### 테마 A: Classic (기본)
다크그린 + 블루 완료. 깔끔하고 안정적인 기본 테마.

| 변수 | 색상 | 용도 |
|------|------|------|
| `--background` | #FAFAFA | 배경 |
| `--surface` | #FFFFFF | 카드 배경 |
| `--border` | #E5E7EB | 테두리 |
| `--success` | #3B82F6 | 파란색 (완료 상태) |
| `--highlight` | #EFF6FF | 결과값 배경 (파란 밝은) |
| `--highlight-text` | #1D4ED8 | 결과값 텍스트 |

#### 테마 B: Gold
다크그린 + 골드/앰버 포인트. 고급스럽고 대회/PR 달성 느낌.

| 변수 | 색상 | 용도 |
|------|------|------|
| `--background` | #FAFAFA | 배경 |
| `--surface` | #FFFFFF | 카드 배경 |
| `--border` | #E5E7EB | 테두리 |
| `--success` | #D4A017 | 골드 (완료 상태) |
| `--highlight` | #FEF3C7 | 결과값 배경 (골드 밝은) |
| `--highlight-text` | #92400E | 결과값 텍스트 |

#### 테마 C: Warm
다크그린 + 크림/웜그레이. 차분하고 프리미엄 느낌.

| 변수 | 색상 | 용도 |
|------|------|------|
| `--background` | #F5F3EE | 크림 배경 |
| `--surface` | #FFFEFA | 웜 화이트 카드 배경 |
| `--border` | #E8E4DC | 웜 테두리 |
| `--success` | #2D5A3D | 다크그린 (완료 = 메인과 동일) |
| `--highlight` | #E8F0EB | 결과값 배경 (그린 밝은) |
| `--highlight-text` | #2D5A3D | 결과값 텍스트 |

### 3.2 스타일
- **테마:** 라이트 모드 only, 다크그린 포인트, 3가지 테마 전환 가능
- **폰트:** Pretendard Variable (CDN)
- **반응형:** 모바일 퍼스트 (max-w-lg 중앙 정렬)
- **아이콘:** lucide-react 기본, 필요시 커스텀 SVG

---

## 3.5 인증 시스템

2026bp(BP Tracker)와 동일한 username + 4자리 PIN 방식.

### 로그인 플로우
1. **유저명 입력** → `ddodun.users` 테이블에서 조회
2. **PIN 처리**:
   - `pin_hash`가 NULL (첫 로그인) → PIN 설정 (4자리 입력 × 2회 확인)
   - `pin_hash`가 있음 (재로그인) → PIN 입력 후 검증
3. **자동 로그인 옵션** → 체크 시 localStorage, 미체크 시 sessionStorage

### 인증 상태 저장
| 모드 | 스토리지 | 키 |
|------|----------|-----|
| 자동 로그인 ON | localStorage | `ddodun-user` (JSON), `ddodun-auto-login` ("true") |
| 자동 로그인 OFF | sessionStorage | `ddodun-session` (JSON) |
| 마지막 유저명 | localStorage | `ddodun-last-username` |

### 라우트 보호
- `AuthGuard` 컴포넌트로 전체 라우트 감싸기
- 미인증 시 `/login`으로 리다이렉트
- `/login` 페이지는 하단 네비게이션 숨김

### 로그아웃
- 설정(`/settings`) 페이지 하단에 로그아웃 버튼
- 모든 스토리지 키 클리어 후 `/login`으로 이동

---

## 4. 주요 화면 및 기능

### 4.0 로그인 `/login`

**유저명 입력 단계:**
- 유저명 텍스트 입력 필드
- "자동 로그인" 체크박스
- 마지막 로그인 유저명 자동 채움 (localStorage)

**PIN 설정 단계 (첫 로그인):**
- 4자리 숫자 키패드 UI
- 1차 입력 → 확인 입력 → 일치 시 DB 저장 후 로그인 완료
- 불일치 시 흔들림 애니메이션 + 재입력

**PIN 검증 단계 (재로그인):**
- 4자리 숫자 키패드 UI
- DB의 pin_hash와 비교 → 일치 시 로그인 완료
- 불일치 시 흔들림 애니메이션 + 재입력

**UI:**
- 하단 네비게이션 숨김
- 앱 로고/이름 표시
- 다크그린 테마 적용

### 4.1 홈 (캘린더 뷰) `/`

**핵심:** 월간 캘린더로 운동 기록 현황을 한눈에 확인하고, 날짜를 탭하면 바로 해당 날짜의 운동 기록으로 이동. 대회도 이 화면에서 등록/관리.

**헤더:**
- 좌측: 앱 로고 또는 "DDODUN" 텍스트
- 우측: 기어 아이콘 (lucide: Settings) → 설정 페이지(`/settings`)로 이동

**캘린더 레이아웃:**
- 월간 그리드 (월~일, 7열)
- 상단에 현재 월 표시 + < > 화살표로 월 이동
- 오늘 날짜: 다크그린(`--accent`) 원형 배경으로 강조

**날짜별 상태 표시:**
- 운동 기록이 있는 날: 날짜 아래 다크그린 도트 (●)
- 운동 템플릿만 등록되어 있고 기록 없는 날: 회색 도트 (예정된 운동이 있음을 표시)
- 대회가 등록된 날: 날짜 아래 별도 색상 도트 (예: 빨간 도트 또는 작은 깃발 아이콘)
- 운동 + 대회가 겹치는 날: 도트 2개 나란히

**날짜 인터랙션:**
- 날짜 탭 → `/workout?date=YYYY-MM-DD`로 이동 (해당 날짜의 운동 기록 페이지)
- 오늘 날짜로 빠르게 돌아오는 "오늘" 버튼

**대회 등록 및 관리:**
- 캘린더 상단 또는 우측에 + 버튼
- 탭하면 대회 등록 모달/시트 표시
- 입력 필드: 대회 날짜(date picker), 대회명, 팀명(optional), 팀원(optional), 메모(optional)
- 등록된 대회는 캘린더에 즉시 반영
- 대회가 있는 날짜를 탭하면 대회 정보 카드가 운동 기록 페이지 상단에 표시
- 대회 도트가 있는 날짜를 길게 누르면 대회 상세/수정/삭제 가능

**이번 달 요약 (캘린더 하단):**
- 이번 달 운동 일수 / 총 평일 수 (예: "12 / 22일")
- 다가오는 대회 (있을 경우, 대회명 + D-day 표시)

**오늘의 운동 요약 (캘린더 하단):**
- 오늘 완료 체크된 운동만 텍스트로 요약 표시
- section + sort_order 순서로 정렬
- 같은 섹션 내 다른 템플릿 사이 빈 줄, Rest 행 아래 빈 줄 삽입
- 사용자 수정 가능한 textarea + 클립보드 복사 버튼
- 코치에게 카톡 등으로 운동 결과 공유 용도

### 4.2 운동 기록 `/workout`

**날짜 네비게이션:**
- 날짜 < > 화살표 (1일 단위 이동)
- 요일 표시 (예: "3/16 (월)")
- 캘린더에서 날짜 선택하여 이동 가능

**대회 정보 (해당 날짜에 대회가 있을 경우):**
- 운동 섹션 상단에 대회 정보 카드 표시
- 대회명, 팀명, 팀원, 메모

**코치 제시 운동 (템플릿):**
- 해당 날짜에 등록된 운동 템플릿 자동 로드
- 섹션별 표시 (A, B, C, D, E, F, G)
- 각 섹션은 운동 유형(workout_type)에 따라 다른 UI 표시

**Phase 1 - 기록 방식 (MVP):**
각 섹션별로:
- 완료 체크박스
- 결과값 입력 필드 (섹션의 운동 유형에 따라 적절한 placeholder 표시)
  - 역도/근력 계열: 무게 입력 (lb/kg 토글), 세트별 무게/렙 기록
  - AMRAP: 라운드 + 추가 렙 입력 (예: "7+12")
  - For Time: 시간 입력 (mm:ss)
  - EMOM: 완료 체크 + 사용 무게 기록
  - 로잉/바이크/스키어그: 칼로리 또는 페이스 입력
  - Build to Heavy: 최고 무게 기록
  - Interval: 각 세트별 결과 기록
  - Skill Practice: 자유 메모
- 메모 필드 (각 섹션별)

**Phase 2 (향후) - 구조화된 기록:**
- 운동 타입별로 완전히 다른 입력 UI 제공
- 세트별 무게/렙 개별 입력 테이블
- 타임캡/목표 시간 대비 실제 시간 비교
- RPE 입력
- 운동 간 연결 (슈퍼세트 등)

**개인 추가 운동:**
- 하단 "운동 추가" 버튼
- 자유 형식 운동명 + 결과 기록

**무게 계산기 (플로팅):**
- 하단 플로팅 버튼
- 두 모드: 직접입력 (무게 타이핑) / 1RM (등록된 운동 선택)
- 퍼센트: ±5 버튼 + 직접 입력
- 결과: 강조 pill 스타일
- 플레이트 계산 표시 (바벨 무게 제외 후 한쪽에 꽂을 플레이트 목록)

**운동 기록 복사 (코치 공유용):**
- 날짜 헤더 영역에 복사 버튼 (lucide: Copy)
- 탭하면 해당 날짜의 전체 운동 기록을 지정된 텍스트 템플릿에 맞춰 클립보드에 복사
- 각 섹션별 수행 무게, 기록(시간/라운드+렙/칼로리 등), 메모를 포함
- 템플릿 형식은 추후 지정 (설정 또는 하드코딩)
- 복사 완료 시 토스트 메시지 표시 ("복사되었습니다")
- 용도: 코치에게 카톡/메시지로 당일 운동 결과 공유

**운동 검색 (롱프레스):**
- 운동 이름을 1초간 길게 누르면 검색 팝업 표시
- 팝업에 YouTube 검색 / Google 검색 버튼 2개
- 검색어에서 reps(`30`), 복합 reps(`10/10`), 시간(`1:00`), 거리(`5m`, `100ft`), 접두사(`Max Reps`, `Max Cal`) 자동 제거
- 검색어에 `exercise form` 키워드 자동 추가
- 버튼 탭 시 해당 검색 결과 페이지로 외부 링크 이동

**자동 저장:**
- 체크/값 변경 시 800ms 디바운스 저장
- 탭 이동/언마운트 시 미완료 저장 자동 flush (pendingSavesRef)
- initializedRef 패턴으로 첫 로드 vs 이후 업데이트 구분 (입력 상태 보존)
- 결과/메모 패널 열림/닫힘 상태 DB 영속화 (_result_open, _memo_open)
- 결과 모드(WT/Rounds/Reps/Cal/Time) DB 영속화 (result_type)

**성능 최적화:**
- React.memo + ID 기반 비교 (참조 비교 대신)
- parseDescription/computeGroups useMemo 캐싱
- 클라이언트 dateCache — 방문한 날짜 즉시 표시, 백그라운드 갱신
- 로딩 중 opacity 처리

### 4.3 나의 PR `/pr`

개인 최고 기록(Personal Records)을 한 페이지에서 관리. 1RM, nRM, 페이스 기록을 섹션 헤더로 구분하여 하나의 스크롤에 표시.

#### 4.3.1 나의 1RM

**1RM 관리:**
- 주요 리프트 목록 (4열 카드 그리드, 12종 = 3줄)
- 기본 운동 (12종, 아래 순서대로 고정 표시):
  1. Back Squat (백스쿼트)
  2. Front Squat (프론트스쿼트)
  3. Deadlift (데드리프트)
  4. Bench Press (벤치프레스)
  5. Shoulder Press (숄더프레스)
  6. Push Press (푸시프레스)
  7. Clean (클린)
  8. Power Clean (파워클린)
  9. Clean & Jerk (클린 앤 저크)
  10. Push Jerk (푸시저크)
  11. Snatch (스내치)
  12. Power Snatch (파워스내치)
- 커스텀 운동 추가/삭제 가능 (기본 운동 뒤에 추가)
- 각 운동별 현재 1RM 입력 (lb/kg 토글)
- 800ms 디바운스 자동 저장

#### 4.3.2 나의 nRM

**nRM 관리 (2~10RM):**

사용자가 등록한 기록만 표시. n값 기준으로 그룹핑.

**등록 흐름:**
1. "+ nRM 추가" 버튼 탭
2. 운동 선택 (기본 운동 목록 + 커스텀 운동 + 1RM에 등록된 운동 통합 목록)
3. n 값 선택 (2~10 숫자 선택)
4. 무게 입력 (lb/kg 토글)
5. 저장

**표시 방식:**
- n값 기준 오름차순으로 그룹핑
- 각 그룹 내에서 운동 카드 가로 나열
- 그룹 간 라인 구분
- 예시:
  ```
  2RM
  ─────────────────
  데드리프트  315lb

  3RM
  ─────────────────
  백스쿼트  275lb  |  벤치프레스  205lb

  5RM
  ─────────────────
  푸시프레스  155lb
  ```
- 등록된 nRM이 없으면 "아직 등록된 nRM이 없습니다" 안내 + 추가 버튼
- 각 카드 탭 → 수정/삭제 가능
- 무게 변경 시 800ms 디바운스 자동 저장

#### 4.3.3 나의 페이스 기록

**로잉/스키어그 등 페이스 관리:**

종목별 거리 기준 페이스를 기록.

**기본 종목 + 거리:**
- Rowing 2K, Rowing 5K
- Ski-erg 2K, Ski-erg 5K
- 커스텀 종목/거리 추가 가능

**등록 흐름:**
1. 종목 선택 (Rowing / Ski-erg / 커스텀)
2. 거리 선택 (2K / 5K / 커스텀)
3. 기록 시간 입력 (mm:ss 형식)
4. 저장

**표시 방식:**
- 종목별로 그룹핑
- 각 거리별 기록 카드
- 예시:
  ```
  Rowing
  ─────────────────
  2K  7:32  |  5K  19:45

  Ski-erg
  ─────────────────
  2K  8:10
  ```

**PR 히스토리 (Phase 2):**
- 1RM/nRM/페이스 기록 모두 변화 추이 차트
- 날짜별 기록
- 대회 전후 비교

### 4.4 설정 `/settings`

홈 캘린더 헤더 우측 기어 아이콘(lucide: Settings)을 탭하여 접근. 하단 탭에는 포함되지 않음.

**테마 선택:**
- Classic / Gold / Warm 3가지 테마 중 선택
- 각 테마 미리보기 (색상 스와치 또는 미니 프리뷰)
- 선택 즉시 적용 (localStorage에 저장)

**기본 무게 단위:**
- lb / kg 토글 (디폴트 lb)
- 운동 기록, 1RM, nRM, 계산기에서 기본값으로 사용

**로그아웃:**
- 하단에 로그아웃 버튼
- 탭 시 확인 후 모든 인증 스토리지 클리어 → `/login`으로 이동

**향후 추가 가능 설정:**
- 플레이트 세트 커스텀 (Phase 2)
- 바벨 무게 설정 (45lb / 20kg 등)
- 데이터 내보내기 (Phase 3)

---

## 5. 데이터 모델

> 모든 테이블은 `ddodun` 스키마에 생성

### 5.0 users
사용자 계정 정보.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| username | text | 유저명 (unique) |
| pin_hash | text | 4자리 PIN (nullable, 첫 로그인 전 null) |
| created_by | text | 생성자 (nullable) |
| created_at | timestamptz | 생성일시 |

> PIN은 평문 저장 (간이 인증, 2026bp와 동일 방식).

### 5.1 workout_templates
매주 코치 이미지를 기반으로 등록하는 운동 프로그램.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| date | date | 해당 날짜 |
| day_of_week | text | 요일 (MON, TUE, WED, THU, FRI) |
| section | text | 섹션 라벨 (A, B, C, D, E, F, G) |
| workout_type | text | 운동 유형 (아래 enum 참조) |
| title | text | 섹션 제목 (예: "AMRAP 9", "For time of:", "Back Squat") |
| description | text | 운동 상세 설명 (이미지에 적힌 내용 그대로) |
| prescribed_sets | int | 처방 세트 수 (nullable) |
| prescribed_reps | text | 처방 렙 수 (nullable, 범위 가능: "10~15") |
| prescribed_weight | text | 처방 무게/강도 (nullable, 예: "@ 80%", "@ RPE 7", "35lb") |
| prescribed_time | text | 처방 시간 (nullable, 예: "2:00", "AMRAP 10") |
| rest_seconds | int | 휴식시간(초) (nullable) |
| notes | text | 코치 메모 (nullable) |
| sort_order | int | 섹션 내 정렬 순서 |

**workout_type enum:**
- `strength` — 세트 x 렙 근력 운동 (예: Back Squat 5x3 @ 80%)
- `emom` — Every X:XX for Y Sets (예: Every 2:00 for 6 Sets)
- `amrap` — AMRAP (예: AMRAP 9)
- `for_time` — For Time (예: 21-15-9, For time of:)
- `build` — Build to Heavy (예: Build to Heavy 2 for the day)
- `interval` — 인터벌 (예: Assault Bike @ RPE 3/5/7/9)
- `cardio` — 로잉/바이크/스키어그 (예: Row Interval, Cal Assault Bike)
- `skill` — Skill Practice
- `accessory` — 악세서리/보조 운동 (예: Banded Strict Chest to bar)
- `custom` — 기타/분류 불가

### 5.2 workout_logs
유저의 운동 수행 기록.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| date | date | 기록 날짜 |
| template_id | uuid | FK → workout_templates (nullable, 커스텀 운동은 null) |
| section | text | 섹션 라벨 (A, B, C...) |
| is_custom | boolean | 개인 추가 운동 여부 |
| exercise_name | text | 운동명 (커스텀 운동용, nullable) |
| completed | boolean | 완료 여부 |
| result_value | text | 결과값 (유형에 따라: 무게, 시간, 라운드+렙 등) |
| result_unit | text | 결과 단위 ('lb', 'kg', 'min:sec', 'rounds+reps', 'cal', 'pace' 등) |
| sets_detail | jsonb | 세트별 상세 기록 (Phase 2 대비), 예: [{"set":1,"weight":135,"reps":5},{"set":2,"weight":145,"reps":3}] |
| memo | text | 메모 |
| created_at | timestamptz | 생성일시 |

### 5.3 user_1rm
1RM 기록.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| exercise_name | text | 운동명 (unique) |
| weight | decimal | 1RM 무게 |
| weight_unit | text | 단위 ('lb' 또는 'kg', 디폴트 'lb') |
| updated_at | timestamptz | 수정일시 |

### 5.4 user_nrm
nRM 기록 (2~10RM).

| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| exercise_name | text | 운동명 |
| rep_max | int | n값 (2~10) |
| weight | decimal | nRM 무게 |
| weight_unit | text | 단위 ('lb' 또는 'kg', 디폴트 'lb') |
| updated_at | timestamptz | 수정일시 |
| | | unique(exercise_name, rep_max) |

### 5.5 user_pace_records
로잉/스키어그 등 페이스 기록.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| equipment | text | 종목 ('rowing', 'ski_erg', 커스텀) |
| distance | text | 거리 ('2K', '5K', 커스텀) |
| time_seconds | int | 기록 시간 (초 단위 저장, UI에서 mm:ss 변환) |
| updated_at | timestamptz | 수정일시 |
| | | unique(equipment, distance) |

### 5.6 competitions
대회 기록.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| date | date | 대회 날짜 |
| name | text | 대회명 |
| team_name | text | 팀명 (nullable) |
| team_members | text | 팀원 (nullable) |
| notes | text | 메모 (nullable) |
| created_at | timestamptz | 생성일시 |

### 5.7 user_settings
사용자 설정 (단일 유저이므로 1행).

| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| theme | text | 테마 ('classic', 'gold', 'warm', 디폴트 'classic') |
| default_weight_unit | text | 기본 무게 단위 ('lb' 또는 'kg', 디폴트 'lb') |
| updated_at | timestamptz | 수정일시 |

> 테마 선택은 즉시 반응을 위해 localStorage에도 캐시하되, DB에도 저장하여 다른 기기에서 동기화 가능.

### 5.8 pr_history (Phase 2)
1RM/nRM/페이스 기록 변화 히스토리.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| record_type | text | 기록 유형 ('1rm', 'nrm', 'pace') |
| exercise_name | text | 운동명 또는 종목명 |
| rep_max | int | n값 (1rm은 1, pace는 null) |
| value | decimal | 기록값 (무게 또는 시간(초)) |
| value_unit | text | 단위 ('lb', 'kg', 'seconds') |
| recorded_at | date | 기록 날짜 |
| source | text | 출처 ('manual', 'competition', 'workout') |

---

## 6. 하단 네비게이션 (3탭)

| 탭 | 라벨 | 경로 | 아이콘 |
|-----|------|------|--------|
| 홈 | 홈 | `/` | 캘린더 (lucide: Calendar) |
| 운동 | 운동 | `/workout` | 바벨 (커스텀 SVG 또는 lucide: Dumbbell) |
| PR | PR | `/pr` | 트로피 (lucide: Trophy) |

- 활성 탭: 다크그린 (`--accent`)
- 비활성 탭: 회색 (`--text-secondary`)
- 설정(`/settings`)은 하단 탭에 포함하지 않음. 홈 헤더의 기어 아이콘으로 접근.

---

## 7. 운동 템플릿 등록 워크플로우

### 매주 일요일 프로세스:
1. 코치가 다음 주 운동 이미지를 제공 (월~금, 5일)
2. Claude Code에 이미지를 전달하여 SQL INSERT 문 생성
3. 생성된 SQL을 Supabase에서 실행
4. 앱에서 해당 주차 운동 자동 로드

### SQL 생성 규칙:
- `ddodun.workout_templates` 테이블에 INSERT
- 날짜(date), 요일(day_of_week), 섹션(section) 기준으로 정렬
- workout_type은 운동 내용을 파악하여 자동 분류
- description에는 이미지 텍스트를 최대한 그대로 보존
- prescribed_* 필드에 구조화된 정보 추출

### 운동 이미지 → UI 렌더링 규칙

코치 이미지의 텍스트를 `title`과 `description`에 넣을 때, 아래 규칙에 따라 UI가 자동 렌더링된다.

#### title 규칙
| 패턴 | 처리 | 예시 |
|------|------|------|
| `AMRAP N`, `EMOM N`, `E4MOM x N`, `For time of :` | **섹션 타이틀** — 섹션 헤더 라벨로 표시, description의 각 줄이 개별 운동 행 | `AMRAP 9` → 헤더에 표시 |
| 일반 운동명 (`Back Squat`, `Skill Practice` 등) | **운동 행** — 해당 운동 1행 + lb 버튼, description은 아래 설명 텍스트 | `3 Front Squat` |
| NULL | description에서 운동 행 추출 | — |

#### description 줄(line) 분류 규칙

description은 `\n`으로 줄을 구분하며, 각 줄은 아래 우선순위로 분류된다:

| 순서 | 패턴 | 분류 | UI 표시 |
|------|------|------|---------|
| 1 | `N Sets`, `N x M`, `Every ...` (첫 번째 매치만) | **setInfo** | 섹션 헤더 라벨 또는 구분 영역 서브헤더 (회색, `text-xs font-medium`) |
| 2 | setInfo 바로 다음 줄이 `(`로 시작 | **setInfo 보충** | setInfo에 `·`로 이어붙임 (예: `3 Sets · (0:40 On / 0:20 Off)`) |
| 3 | `21-15-9` 같은 렙스킴 (`N-N-N`) | **subheader** | 회색 서브헤더 행 (운동 그룹 구분) |
| 4 | `N rounds for time of :` | **subheader** | 회색 서브헤더 행 |
| 5 | `* ...`, `@ ...`, `- Rest ...`, `Rest N:NN` | **note** | 이전 운동 행에 붙어서 표시 (회색 이탤릭, border 없음) |
| 6 | `* Rest as needed` | **separator 감지용** | note에서 제외, 템플릿 간 구분 행 텍스트로 사용 |
| 7 | 나머지 | **exercise** | 운동 행 + lb 버튼 |

#### 같은 섹션 내 여러 템플릿 — 그룹과 구분 행

같은 섹션(예: F)에 `sort_order`가 다른 템플릿이 여러 개일 때, setInfo 기준으로 **그룹**이 나뉜다:

- **그룹 기준**: 다음 템플릿에 setInfo가 있으면 새 그룹 시작
- 각 그룹은 독립적인 **결과 패널** (WT/Rounds/Reps/Time/Cal)과 **메모 패널**을 가짐
- 첫 그룹의 결과/메모 버튼은 **섹션 헤더** 오른편에 배치
- 이후 그룹의 결과/메모 버튼은 **setInfo 행** 오른편에 배치
- 결과 패널은 전체 너비, 오른정렬로 표시
- 모든 결과 모드에서 `+ 세트` 버튼으로 멀티세트 입력 가능

**구분 행 표시:**
- 다음 템플릿에 setInfo가 있으면 **구분 영역** 표시:
  1. 이전 템플릿 notes에 `Rest as needed`가 있으면 → 회색 구분 행에 텍스트 표시
  2. 다음 템플릿 첫 줄이 `Rest N:NN`이면 → 회색 구분 행에 텍스트 표시 (인라인에서 제거)
  3. 위 둘 다 없으면 → 빈 회색 구분 행
  4. 다음 템플릿의 setInfo → 회색 서브헤더 행으로 표시
- setInfo가 없으면 → 단순 border 구분선

#### 줄 순서 보존

description의 줄 순서는 그대로 유지하여 렌더링한다. note 줄(Rest, @ 등)은 분리하지 않고 원래 위치에서 이전 운동 행에 붙어 표시된다.

#### title이 있는 템플릿 vs 없는 템플릿

| 경우 | 렌더링 |
|------|--------|
| **title 있음** (섹션 타이틀 아님) | title = 운동 행 + lb 버튼, description = 아래 설명 텍스트 (exercise는 `text-xs`, note는 이탤릭) |
| **title 있음** (섹션 타이틀) | title = 섹션 헤더 라벨, description 각 줄 = 개별 운동 행 + lb 버튼 |
| **title 없음** | description 각 줄 = 개별 운동 행 + lb 버튼 (note/subheader는 해당 스타일로) |

#### 운동 행 UI 스타일링

| 요소 | 스타일 |
|------|--------|
| 운동 행 | `pl-6 pr-4 py-2`, 운동명 왼쪽 + lb 버튼 오른쪽 |
| note 행 | `pl-6 pr-4 pb-1.5`, `text-[10px] text-text-secondary/50 italic`, border 없음, 이전 운동에 붙음 |
| subheader 행 | `pl-6 pr-4 py-2 bg-background border-t`, `text-xs font-medium text-text-secondary` |
| lb 버튼 (닫힘) | `w-5 h-5 rounded-full border border-text-secondary/30`, 배경 없음 |
| lb 버튼 (열림) | −5 / 입력칸 / +5 / 단위토글 / ✕ 인라인 |
| 결과 패널 | 전체 너비, 오른정렬 (`justify-end`), 모든 모드 멀티세트 지원 |
| WT 입력 | `+ 세트` 버튼만 왼정렬 (`mr-auto`), 나머지 오른정렬 |
| EMOM 분별 입력 | 숫자 → reps/cal → 동작명 → +wt → 쓰레기통 순서 |

#### SQL 작성 예시

```sql
-- 운동명이 있고, 세트/무게 지침이 있는 경우: title에 렙 포함
('2026-03-20', 'FRI', 'A', 'strength', '3 Front Squat', E'5 Sets\n@ 80%\n* Rest 2:00 b/w sets', 1)

-- 섹션 타이틀 + 여러 운동: title에 섹션 타이틀, description에 운동 나열
('2026-03-16', 'MON', 'E', 'metcon', 'AMRAP 9', E'3 Wall Walks\n3 Bar Muscle ups\n30 Double Unders', 5)

-- 복합 For Time: subheader로 구분되는 여러 운동 블록
('2026-03-20', 'FRI', 'B', 'metcon', 'For time of :', E'21-15-9\nToes to bar\nBox Jump Overs 20 inch\n- Rest 2:00\n3 rounds for time of :\n14 Cal Ski-erg\n...', 2)

-- 같은 섹션에 운동 그룹 2개: Rest as needed로 구분
('2026-03-16', 'MON', 'F', 'accessory', NULL, E'3 Sets\n10 Banded Strict Chest to bar\n* Rest 2:00 b/w sets\n* Rest as needed', 6),
('2026-03-16', 'MON', 'F', 'accessory', NULL, E'3 Sets\n12 KB Seal Row\n15 Rear Delt Fly\n* Rest 2:00 b/w sets', 7)

-- EMOM: title에 EMOM, + 버튼으로 분별 입력 UI
('2026-03-19', 'THU', 'A', 'metcon', 'EMOM 40', NULL, 1)

-- 타이밍 보충 정보: setInfo 다음 줄이 (로 시작
-- "3 Sets · (0:40 On / 0:20 Off)" 로 합쳐짐
('2026-03-18', 'WED', 'E', 'accessory', NULL, E'3 Sets\n(0:40 On / 0:20 Off)\n- Pallof Press (Left)\n...', 6)
```

---

## 8. 비기능 요구사항

| 항목 | 요구사항 |
|------|----------|
| 반응형 | 모바일 퍼스트 (max-w-lg), 태블릿/PC 대응 |
| PWA | 홈화면 추가 지원 (manifest.json + apple-web-app) |
| 성능 | 에러 발생 시 빈 데이터로 폴백 (무한 로딩 방지) |
| 데이터 보존 | Supabase DB 저장 |
| 배포 | Vercel (GitHub push 시 자동 배포) |
| 자동 저장 | 모든 입력 필드 변경 시 즉시 또는 디바운스 저장 |
| 인증 | username + 4자리 PIN, 자동 로그인 지원, AuthGuard 라우트 보호 |
| 테마 | 3가지 테마 전환 (localStorage 캐시 + DB 동기화) |

---

## 9. 화면 흐름

```
[로그인] → 유저명 입력 → PIN 설정/검증 → 자동 로그인 옵션
    ↓ (인증 완료)
[홈 - 캘린더]
    ├── 날짜 탭 → [운동 기록] (해당 날짜) → 섹션별 결과 입력 → 자동 저장
    │                                    → 개인 운동 추가
    │                                    → 무게 계산기 (플로팅)
    ├── + 버튼 → 대회 등록 모달 → 대회명/팀명/팀원/메모
    ├── 대회 날짜 길게 누르기 → 대회 상세/수정/삭제
    ├── ⚙ 기어 아이콘 → [설정] → 테마 선택 / 기본 무게 단위 / 로그아웃
    └── [PR] → 나의 1RM (4열 카드 그리드, 기본 12종 = 3줄)
            → 나의 nRM (n값별 그룹핑)
            → 나의 페이스 기록 (종목별 그룹핑)
```

---

## 10. 개발 로드맵

### Phase 1 (MVP)
- [x] Supabase `ddodun` 스키마 생성 및 테이블 셋업 (users 포함)
- [x] 프로젝트 초기 설정 (Next.js + Tailwind + Supabase)
- [x] 로그인 페이지 (username + 4자리 PIN, 자동 로그인)
- [x] AuthGuard 라우트 보호 + ClientLayout 연동
- [x] 설정 페이지 로그아웃 기능
- [x] 테마 시스템 (CSS 변수 기반 3가지 테마: Classic/Gold/Warm)
- [x] 하단 네비게이션 (3탭: 홈/운동/PR)
- [x] 홈 - 헤더 (로고 + 기어 아이콘)
- [x] 홈 - 캘린더 뷰 (월간 그리드, 운동 완료 도트, 대회 도트, 오늘 강조)
- [x] 홈 - 날짜 탭 → 운동 기록 페이지 이동
- [x] 홈 - 대회 등록/수정/삭제 (+ 버튼 → 모달)
- [x] 홈 - 이번 달 운동 일수 요약 + 다가오는 대회
- [x] 설정 - 테마 선택 (Classic/Gold/Warm)
- [x] 설정 - 기본 무게 단위 (lb/kg)
- [x] 운동 기록 - 템플릿 로드 + 섹션별 완료/결과 기록
- [x] 운동 기록 - 날짜 네비게이션 (< > 화살표, 요일 표시)
- [x] 운동 기록 - 대회 날짜일 경우 상단 대회 정보 카드
- [x] 운동 기록 - 개인 운동 추가
- [x] 무게 계산기 (직접입력 / 1RM 모드, 플로팅 버튼)
- [x] PR - 나의 1RM (4열 카드 그리드, lb/kg 토글, 기본 12종)
- [x] PR - 나의 nRM (운동 선택 → n값 선택 → 무게 입력, n값별 그룹 표시)
- [x] PR - 나의 페이스 기록 (Rowing/Ski-erg 2K/5K, mm:ss 입력)
- [x] PWA 설정 (manifest.json + 앱 아이콘 192/512 + favicon)
- [x] Vercel 배포 (https://ddodun.vercel.app)
- [x] 첫 주 운동 템플릿 등록 (3월 3주차 이미지 기반)
- [x] 오늘의 운동 요약 (TodaySummary - 완료 운동 텍스트 + 복사)
- [x] 멀티세트 결과 입력 (Rounds/Reps/Time/Cal 모두 + 세트 지원)
- [x] Cal 결과 타입 추가
- [x] 성능 최적화 (React.memo, useMemo, useCallback, 디바운스 flush)
- [x] Supabase RLS + GRANT 프로덕션 설정

### Phase 2 (고도화)
- [ ] 운동 타입별 구조화된 기록 UI
  - 세트별 무게/렙 개별 입력 테이블
  - AMRAP 전용 라운드/렙 입력
  - For Time 전용 시간 입력 (타이머 연동)
  - EMOM 전용 라운드별 기록
  - Interval 세트별 기록
- [ ] PR 히스토리 차트 (1RM/nRM/페이스 변화 추이)
- [ ] 운동별 무게 히스토리 조회
- [ ] 플레이트 계산기 고도화 (커스텀 플레이트 세트)
- [ ] 운동 검색/필터

### Phase 3 (확장)
- [ ] 오프라인 지원 (Service Worker)
- [ ] 운동 프로그램 이미지 업로드 → 자동 파싱 (OCR/AI)
- [ ] 운동 데이터 내보내기 (CSV)
- [ ] 멀티유저 지원 (필요시)

---

## 11. 배포 정보

| 항목 | 값 |
|------|-----|
| GitHub | https://github.com/fittcha/ddodun |
| Vercel URL | https://ddodun.vercel.app |
| Supabase Project | qaiammqgkrrgfstqadef (기존 BP Tracker와 공유) |
| Supabase Schema | `ddodun` |
