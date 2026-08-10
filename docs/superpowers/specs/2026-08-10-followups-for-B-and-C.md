# A 완료 후 남은 항목 (B·C 입력용)

작성일: 2026-08-10
관련 스펙: `2026-08-10-coach-athlete-platform-design.md`
관련 계획: `../plans/2026-08-10-coach-athlete-foundation.md`

A(기반 공사) 구현 중 리뷰에서 발견되었으나 의도적으로 미룬 항목들이다. 각 항목은 리뷰에서 검증된 사실이며 추측이 아니다.

## 반드시 B에서 먼저 처리할 것

**1. 세션의 `role`이 DB를 다시 읽지 않는다.**
`/api/auth/session`은 쿠키에 담긴 `role`을 그대로 반환한다. 자동로그인 쿠키가 30일이므로 역할 변경이나 계정 비활성화가 최대 30일 지연된다. 지금은 무해하다 — **`requireCoach`의 호출부가 0개라 `role`이 아무것도 게이트하지 않기 때문이다.** B에서 코치 라우트를 만드는 순간 실효성이 생기므로, **B의 첫 번째 작업으로 처리한다.** 선택지는 session 라우트에서 DB 재조회, 또는 쿠키 수명 단축.

**2. 발행 규칙(스펙 A.2)이 아직 구현되지 않았다.**
과거 날짜 잠금 / 오늘은 기록자 있으면 확인 후 덮어쓰기 / 미래는 자유, 그리고 과거의 인플레이스 수정. A에는 발행 UI도 코치 라우트도 없어 적용 지점이 없었다. 스키마(`program_versions.status`, `note`)와 `requireCoach`는 준비되어 있다.

**3. 주차 임포트의 버전 재지정 공백.**
`insert.mjs --force`는 새 템플릿을 최신 버전에 연결하지만, 배정 upsert의 conflict 대상이 `(program_id, athlete_id)`라 **기존 배정 행의 `version_id`를 새 버전으로 옮기지 않는다.** 지금은 버전을 올리는 흐름 자체가 없어 이론적이지만, B가 버전 편집을 도입하면 즉시 실재하는 버그가 된다.

## 안전 관련, B/C 진행 중 처리 가능

- **`anon` 권한 회수가 아직 적용되지 않았다.** `docs/sql/revoke-anon.sql`에 실행 순서 경고가 있다. 머지 → Vercel에 `SESSION_SECRET` 등록 → 배포 → 로그인 확인 → 그 다음에 실행.
- **`failed_attempts` 증가가 원자적이지 않다.** read-then-write라 동시 요청 시 잠금 임계값 계수가 어긋날 수 있다. 사용자 수가 적어 실질 위험은 낮다.
- **평문 PIN 비교가 타이밍 안전하지 않다.** 레거시 호환 경로 한정. `chacha` 계정이 아직 평문이며 첫 로그인 시 해시로 승격된다.
- **PIN이 4자리(1만 가지)다.** scrypt와 5회/15분 잠금으로 완화되어 있으나 근본적으로 약하다. 두 계정 모두 현재 `1234`.
- **`workouts/extra/[groupId]`의 `workout_logs` 삭제가 user-scoped가 아니다.** 현재 데이터에 교차 소유 로그가 0건이라 실피해는 없다. 방어적으로 좁힐 것.

## 사용성·일관성

- `logs/dates`와 `competitions`가 `year`를 무제한으로 받는다(`calendar/[year]/[month]`는 범위 검사함). 500 대 400 불일치.
- `workouts/extra/[groupId]`가 `groupId` UUID 형식을 검사하지 않아 500이 난다.
- `resolveTemplateDates`가 `resolveTemplates`의 주 범위 포함 규칙을 적용하지 않는다. 현재 데이터로는 도달 불가.
- `programs.ts`가 `week_start_date`를 정확히 일치로 찾는다. 스펙은 `BETWEEN ws..ws+6`이다. 22개 프로그램 전부 월요일이라 현재는 동등. CHECK 제약을 걸거나 B에서 정리.
- 홈 화면이 한 날짜에 템플릿 게터를 두 번 호출해 HTTP 2회·쿼리 4회가 발생한다. 2회면 충분하다.
- `Calculator.tsx`가 아직 `userId`를 받는다. 로드 게이트로만 쓰이는 구모델 잔재.
- **로그인 UX 변경이 공지되지 않았다.** 기존 PIN 설정 2회 확인 단계(`pin-setup`/`pin-setup-confirm`)가 사라져 최초 로그인 시 한 번 입력으로 PIN이 확정된다. 또 "등록되지 않은 사용자"가 PIN을 입력한 뒤에야 표시된다.
- `competitions` POST/PATCH 본문의 `date`는 검증되지만, 그 외 본문 필드 전반에 대한 형식 검증은 없다.

## 수동 확인이 남아 있는 항목

PIN 입력 UI가 헤드리스 브라우저를 막아 자동 검증이 불가능하다. 실제 브라우저에서 확인 필요:

1. `jindun`으로 로그인 → 홈·운동·PR·캘린더가 이전과 동일하게 보이는지
2. DevTools → Application → Cookies에 `ddodun_session`이 HttpOnly로 존재
3. Local Storage에 `ddodun-user`가 **없고** `ddodun-last-username`만 있는지
4. 운동 결과 입력 → 새로고침 → 값 유지
5. 홈의 오늘 요약 생성, 카톡 복사 포맷
6. 설정에서 로그아웃 → `/login` 이동, 쿠키 제거
7. `chacha`로 로그인 시 평문 PIN이 `scrypt$`로 승격되는지
