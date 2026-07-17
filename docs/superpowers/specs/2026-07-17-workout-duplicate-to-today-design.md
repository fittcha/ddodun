# 운동 그룹 "오늘 운동에 복제" 기능 설계

- **날짜**: 2026-07-17
- **대상 앱**: DDODUN (`/Users/chacha/lab/ddodun/app`)
- **구조 전제**: 단일 사용자 앱 (관리자 / 실사용자 1명). 데이터가 모든 사용자에게 동일하게 보여도 무방 → `user_id` 스코핑 불필요.

## 1. 배경 / 현재 동작

운동 페이지(`src/app/workout/page.tsx`)는 날짜별로 `workout_templates`(코치가 올리는 공유 처방)를 섹션(A~F...)별로 묶어 각 섹션을 `WorkoutSection` 카드로 렌더한다. 각 섹션 카드 헤더에는 **복사 아이콘 버튼**(`WorkoutSection.tsx:615`)이 있어, 누르면 그 섹션의 처방 텍스트가 문자열로 클립보드에 복사된다.

## 2. 요구사항

1. 복사 아이콘을 누르면 **중앙 팝업**이 뜨고, 위아래로 두 버튼을 노출한다: **「내용 복사」**, **「오늘 운동에 복제」**.
2. **「내용 복사」**: 기존 문자열 복사 동작 그대로.
3. **「오늘 운동에 복제」**: 해당 운동 그룹을 **오늘 날짜**의 기존 운동(A~F...) 아래에 **"추가운동"**이라는 이름으로 **그대로 복제**해 추가한다.
4. 여러 운동 그룹을 오늘 날짜로 복제할 수 있고, **복제한 순서대로** 데일리 훈련 내용 아래에 누적된다.
5. 원본은 **기존 날짜에 그대로 유지**되고, 오늘 날짜에 "추가운동"으로 **추가로** 붙는다.

### 확정된 결정 (브레인스토밍)

- **레이아웃**: 각 복제 = **독립된 "추가운동" 카드**, 복제 순서대로 스택.
- **동작/저장**: 원본처럼 **완료 체크·무게/결과·메모 기록이 가능**하고 **영구 저장**(DB), 새로고침·다른 기기에서도 유지.
- **삭제**: 각 "추가운동" 카드에 **X 삭제 버튼**.
- **복제 범위**: 처방(템플릿)만 복사한다. 원본에 기록된 무게/완료 상태는 가져오지 않고 **빈 상태로 시작**.
- **복제본 `section` 값**: `"추가운동"` (표시 라벨과 일치, 로그도 이 값으로 저장).
- **크로스 날짜**: 다른 날짜를 보는 중 복제해도 대상은 항상 **오늘**. 토스트 "오늘 운동에 추가됨"만 표시, 자동 이동 없음, 오늘 캐시 무효화.

## 3. 저장 방식 — `workout_templates` 재사용

복제본을 `workout_templates`에 직접 저장하되, 코치 원본과 구분하기 위한 **마커 컬럼 2개**를 추가한다. 단일 사용자 구조라 `user_id`는 불필요하다.

### 3.1 스키마 마이그레이션 (Supabase에서 직접 실행 필요)

```sql
-- docs/sql/migration-extra-workout.sql
ALTER TABLE ddodun.workout_templates
  ADD COLUMN IF NOT EXISTS extra_group_id uuid,
  ADD COLUMN IF NOT EXISTS extra_order    int;

-- 조회 성능용 (선택)
CREATE INDEX IF NOT EXISTS idx_workout_templates_extra
  ON ddodun.workout_templates (date, extra_order)
  WHERE extra_group_id IS NOT NULL;
```

- `extra_group_id uuid` — 한 번의 복제 단위(= "추가운동" 카드 하나). 함께 복제된 행들이 공유. `NULL` = 코치 원본, 값 있음 = 복제본.
- `extra_order int` — 그 날짜 안에서 추가운동 카드들의 순서(복제 순서). 오늘 기준 `max + 1`.
- 기존 코치 행은 마이그레이션 후 두 컬럼이 `NULL`이라 **기존 동작 완전 유지**.
- **RLS 확인**: `schema.sql`상 RLS는 `users` 테이블에만 명시. `workout_templates`에 RLS가 없으면 anon insert/delete 가능(현행 트러스트 모델). 만약 켜져 있다면 anon insert/delete 정책을 추가해야 함 — 구현 착수 전 확인.

### 3.2 왜 이 방식인가 (대안 비교)

| 방안 | 결정 |
|---|---|
| **A. `workout_templates` 컬럼 2개 추가** ✅ | 렌더링/기록 저장/`template_id` 연결/문자열 복사 로직을 그대로 재사용. 신규 코드 최소. `workout_logs.template_id`에 FK가 있어도 복제본이 같은 테이블 행이라 안전. |
| B. 신규 `workout_extra_templates` 테이블 | `workout_logs.template_id` FK가 있으면 기록 저장이 깨질 위험 + 로딩 로직 중복 → 탈락. |
| C. `workout_logs`(is_custom)로 저장 | 구조·렌더링 소실로 "그대로 복제" 불가 → 탈락. |

**검증됨**: `WorkoutSection.saveLog`(`WorkoutSection.tsx:337`)는 로그를 `template_id`와 `template.section`(행의 실제 값)으로 저장하고 로그 키는 `template_id`다. 복제본에 **새 id**를 부여하면 헤더 표시 라벨과 무관하게 기록이 원본과 충돌 없이 독립 저장된다.

## 4. 데이터 레이어 (API)

`src/lib/api/workout-templates.ts`:

```ts
// 기존 수정: 코치 원본만 반환 (복제본 제외)
export async function getTemplatesByDate(date: string): Promise<WorkoutTemplate[]> {
  // ... .eq('date', date).is('extra_group_id', null).order('section').order('sort_order')
}

// 신규: 그 날짜의 복제본(추가운동)만
export async function getExtraTemplatesByDate(date: string): Promise<WorkoutTemplate[]> {
  // ... .eq('date', date).not('extra_group_id', 'is', null)
  //     .order('extra_order').order('sort_order')
}

// 신규: 섹션 그대로 오늘로 복제
export async function duplicateSectionToToday(
  templates: WorkoutTemplate[]
): Promise<{ extraGroupId: string; templates: WorkoutTemplate[] }> {
  // 1) today = getToday()
  // 2) 오늘의 기존 extra 중 max(extra_order) 조회 → nextOrder
  // 3) extraGroupId = crypto.randomUUID()
  // 4) templates를 새 행으로 insert:
  //    - id: 새 uuid (DB default 또는 클라 생성)
  //    - date: today, day_of_week: today 요일
  //    - section: "추가운동"
  //    - extra_group_id: extraGroupId, extra_order: nextOrder
  //    - workout_type/title/description/prescribed_*/rest_seconds/notes/sort_order: 원본 그대로
  //    - (id/created_at 등 서버 관리 필드 제외)
  // 5) insert된 행들 반환
}

// 신규: 추가운동 카드 삭제 (로그 → 템플릿 순)
export async function deleteExtraGroup(extraGroupId: string): Promise<void> {
  // 1) 그룹의 template id들 조회
  // 2) workout_logs 에서 template_id IN (ids) 삭제
  // 3) workout_templates 에서 extra_group_id = extraGroupId 삭제
}
```

`WorkoutTemplate` 인터페이스에 `extra_group_id: string | null`, `extra_order: number | null` 추가.

## 5. 페이지 통합 (`src/app/workout/page.tsx`)

- `loadData`의 `Promise.all`에 `getExtraTemplatesByDate(date)` 추가. `dateCache`에 `extras` 필드 추가.
- **그룹화**: extras를 `extra_group_id`로 묶고 `extra_order`로 정렬 → `{ extraGroupId, templates[] }[]`.
- **로그 라우팅**: `logs`(template 로그)에서 각 extra 그룹의 `template_id`에 해당하는 로그를 골라 그 그룹 `WorkoutSection`에 전달 (기존 `sectionLogs` 방식과 동일하게 extra 그룹용으로 확장).
- **렌더 위치**: 코치 섹션(A~F) 아래, "개인 추가 운동"(기존 `customLogs`) 카드 **위**에 extra 그룹들을 순서대로 렌더:

```tsx
{extraGroups.map(g => (
  <WorkoutSection
    key={g.extraGroupId}
    userId={userId}
    section="추가운동"
    displayName="추가운동"
    templates={g.templates}
    logs={extraLogs.get(g.extraGroupId) ?? emptyLogs}
    date={date}
    onLogUpdate={handleLogUpdate}
    onDelete={() => handleExtraDelete(g.extraGroupId)}
  />
))}
```

- **복제 핸들러**(`onDuplicateToToday`): 페이지가 소유. `duplicateSectionToToday` 호출 → 성공 시:
  - 보고 있는 날짜 == 오늘이면 `extras` 상태에 새 그룹 append + 캐시 갱신.
  - 아니면 토스트만 + `dateCache.delete(today)`로 오늘 캐시 무효화(다음 방문 시 로드).
- **삭제 핸들러**(`handleExtraDelete`): `deleteExtraGroup` 호출 → `extras`에서 제거 + 캐시 갱신. 실패 시 상태 복구.

## 6. UI — `WorkoutSection` 변경

### 6.1 신규 props (선택적, 후방호환)

```ts
interface WorkoutSectionProps {
  // ...기존...
  displayName?: string                          // 헤더 라벨 override ("추가운동")
  onDelete?: () => void                          // 있으면 X 삭제 버튼 표시
  onDuplicateToToday?: (templates: WorkoutTemplate[]) => Promise<void>
}
```

- 헤더 섹션 라벨(`:607`)은 `displayName ?? section` 표시.
- `React.memo` 비교 함수(`:1109`)에 `displayName`, `onDelete`, `onDuplicateToToday` 반영.

### 6.2 복사 버튼 → 팝오버

- 클립보드 아이콘(`:615`) `onClick`을 **직접 복사 → 팝오버 오픈**으로 변경. `const [copyMenuOpen, setCopyMenuOpen] = useState(false)`.
- 팝오버: 중앙(`fixed inset-0 z-50 flex items-center justify-center`) + `bg-black/40` 배경(클릭 시 닫힘) + `w-[280px] bg-surface rounded-2xl p-5 shadow-lg` 박스 (`ExerciseSearchModal` 패턴). 제목 "운동 복사" + 위아래 버튼 2개:
  - **「내용 복사」**: 기존 문자열 빌드 로직(`:616-641`)을 함수로 추출해 호출 → `navigator.clipboard.writeText` → "복사됨" 토스트 → 팝오버 닫기.
  - **「오늘 운동에 복제」**: `onDuplicateToToday(templates)` 호출 → "오늘 운동에 추가됨" 토스트 → 팝오버 닫기. (`onDuplicateToToday` 미제공 시 버튼 숨김/비활성.)
- 토스트는 기존 `copyToast` 재사용하되 문구를 상황별로(복사됨 / 오늘 운동에 추가됨) 전환.

### 6.3 삭제 버튼

- `onDelete`가 있으면 헤더 우측 버튼 클러스터에 작은 X 버튼 추가. 클릭 시 **즉시 삭제**(별도 확인 없음 — 재복제가 쉽고 앱 전반이 저마찰 낙관적 패턴). `onDelete()` 호출.

## 7. 데이터 흐름 요약

```
[다른/오늘 날짜 보기]
  복사 아이콘 클릭 → 팝오버
    ├ 「내용 복사」 → clipboard.writeText(문자열) → 토스트
    └ 「오늘 운동에 복제」 → duplicateSectionToToday(templates)
          → workout_templates에 새 행 insert (date=오늘, section="추가운동",
             extra_group_id=새 uuid, extra_order=오늘 max+1)
          → 오늘 보기면 즉시 카드 append / 아니면 토스트 + 오늘 캐시 무효화

[오늘 날짜 보기]
  A~F (코치, extra_group_id IS NULL)
  추가운동 카드 1 (extra_group_id=g1, extra_order=1)  ← 복제 순서
  추가운동 카드 2 (extra_group_id=g2, extra_order=2)
  개인 추가 운동 (기존 customLogs)
    각 추가운동 카드: 완료체크/무게/결과/메모 기록 → workout_logs (template_id=복제본 id)
    X 삭제 → deleteExtraGroup → 로그+행 삭제
```

## 8. 에러 처리

- 복제 insert 실패: 토스트로 실패 알림, 낙관적 append 롤백(또는 append 안 함).
- 삭제 실패: `extras` 상태 복구, 실패 토스트.
- 마이그레이션 미실행 상태: insert/select가 컬럼 없음 에러 → 콘솔 로깅 + 기능 무동작(기존 화면은 정상). 구현 완료 후 사용자에게 SQL 실행 안내.

## 9. 테스트 계획

1. 오늘 보기에서 섹션 A 복제 → A~F 아래 "추가운동" 카드 즉시 표시.
2. 여러 섹션 복제 → 복제 순서대로 카드 누적.
3. 추가운동에서 완료 체크/무게/결과/메모 입력 → 새로고침 후에도 유지.
4. 추가운동 X 삭제 → 카드 및 로그 제거, 새로고침 후에도 제거 유지.
5. 원본 날짜 재확인 → 원본 그대로, 추가운동은 오늘에만.
6. 과거 날짜 보기에서 복제 → 토스트만, 오늘로 이동 시 카드 표시.
7. 「내용 복사」 → 기존과 동일 문자열 복사 확인.
8. 코치 A~F는 여전히 정상 렌더(복제본 필터링 정상).

## 10. 변경 파일 요약

- `docs/sql/migration-extra-workout.sql` (신규, 사용자가 Supabase에서 실행)
- `src/lib/api/workout-templates.ts` (인터페이스 필드 2개, `getTemplatesByDate` 필터, `getExtraTemplatesByDate`/`duplicateSectionToToday`/`deleteExtraGroup` 신규)
- `src/lib/api/workout-logs.ts` (선택: 삭제용 헬퍼가 필요하면 추가, 아니면 templates API에서 직접 처리)
- `src/app/workout/page.tsx` (extras 로드/그룹화/렌더/복제·삭제 핸들러, 캐시 확장)
- `src/components/workout/WorkoutSection.tsx` (props 3개, 팝오버, displayName, X 버튼, 문자열 빌드 함수 추출, memo 비교)
