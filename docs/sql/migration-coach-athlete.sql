-- 코치/선수 분리 마이그레이션 (A. 기반 공사)
-- Supabase SQL Editor에서 1회 실행.
--
-- 실행 전 조건 1: scripts/snapshot-invariants.mjs 가 종료코드 0으로 통과해야 한다.
-- 실행 전 조건 2: 아래 2번 블록의 VALUES ('admin', 'coach') 에서 **첫 번째** 'admin'
--                (username) 이 코치 계정명이다. 바꾸려면 이 문자열을 직접 편집할 것.
--                두 번째 'coach' 는 role 값이므로 반드시 그대로 둔다.
--                Supabase SQL Editor 는 psql 의 :변수 치환을 지원하지 않으므로
--                반드시 문자열을 직접 편집해야 한다.

BEGIN;

-- 1. 역할 컬럼
ALTER TABLE ddodun.users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'athlete';
ALTER TABLE ddodun.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE ddodun.users ADD CONSTRAINT users_role_check CHECK (role IN ('athlete', 'coach'));

-- 2. 코치 계정 신규 생성 (pin_hash NULL → 첫 로그인 시 설정됨)
INSERT INTO ddodun.users (username, role) VALUES ('admin', 'coach');

-- 3. 프로그램 테이블
CREATE TABLE ddodun.programs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id        uuid NOT NULL REFERENCES ddodun.users(id),
  title           text NOT NULL,
  week_start_date date NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_programs_week ON ddodun.programs (week_start_date);

CREATE TABLE ddodun.program_versions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id   uuid NOT NULL REFERENCES ddodun.programs(id) ON DELETE CASCADE,
  version_no   int  NOT NULL,
  status       text NOT NULL CHECK (status IN ('draft', 'published')),
  source_text  text,
  note         text,
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, version_no)
);

CREATE TABLE ddodun.program_version_templates (
  version_id  uuid NOT NULL REFERENCES ddodun.program_versions(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES ddodun.workout_templates(id) ON DELETE CASCADE,
  PRIMARY KEY (version_id, template_id)
);
CREATE INDEX idx_pvt_template ON ddodun.program_version_templates (template_id);

CREATE TABLE ddodun.program_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  uuid NOT NULL REFERENCES ddodun.programs(id) ON DELETE CASCADE,
  athlete_id  uuid NOT NULL REFERENCES ddodun.users(id) ON DELETE CASCADE,
  version_id  uuid NOT NULL REFERENCES ddodun.program_versions(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, athlete_id)
);
CREATE INDEX idx_assignments_athlete ON ddodun.program_assignments (athlete_id);

-- 4. 개인 추가운동 소유자 컬럼
ALTER TABLE ddodun.workout_templates
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES ddodun.users(id);
CREATE INDEX idx_templates_owner ON ddodun.workout_templates (owner_user_id, date)
  WHERE owner_user_id IS NOT NULL;

-- 5. 추가운동 6행의 소유자를 연결된 로그의 user_id로 채운다
UPDATE ddodun.workout_templates t
SET owner_user_id = sub.user_id
FROM (
  SELECT template_id, MIN(user_id::text)::uuid AS user_id
  FROM ddodun.workout_logs
  WHERE template_id IS NOT NULL
  GROUP BY template_id
) sub
WHERE t.id = sub.template_id
  AND t.extra_group_id IS NOT NULL;

DO $$
DECLARE orphan int;
BEGIN
  SELECT count(*) INTO orphan
  FROM ddodun.workout_templates
  WHERE extra_group_id IS NOT NULL AND owner_user_id IS NULL;
  IF orphan > 0 THEN
    RAISE EXCEPTION '소유자를 판별할 수 없는 추가운동 행 % 건. 중단합니다.', orphan;
  END IF;
END $$;

-- 6. 기존 735행을 주(월요일) 단위 레거시 프로그램 v1으로 묶는다
WITH coach AS (
  SELECT id FROM ddodun.users WHERE role = 'coach' ORDER BY created_at LIMIT 1
),
weeks AS (
  SELECT DISTINCT date_trunc('week', date)::date AS ws
  FROM ddodun.workout_templates
  WHERE extra_group_id IS NULL
),
ins_p AS (
  INSERT INTO ddodun.programs (coach_id, title, week_start_date)
  SELECT coach.id, to_char(weeks.ws, 'YYYY-MM-DD') || ' 주간 (레거시)', weeks.ws
  FROM weeks CROSS JOIN coach
  RETURNING id, week_start_date
),
ins_v AS (
  INSERT INTO ddodun.program_versions (program_id, version_no, status, published_at, note)
  SELECT id, 1, 'published', now(), '마이그레이션으로 생성된 레거시 버전'
  FROM ins_p
  RETURNING id, program_id
)
INSERT INTO ddodun.program_version_templates (version_id, template_id)
SELECT v.id, t.id
FROM ins_v v
JOIN ins_p p ON p.id = v.program_id
JOIN ddodun.workout_templates t
  ON t.extra_group_id IS NULL
 AND t.date BETWEEN p.week_start_date AND p.week_start_date + 6;

-- 7. 기존 선수 전원에게 모든 레거시 프로그램의 v1을 배정
INSERT INTO ddodun.program_assignments (program_id, athlete_id, version_id)
SELECT v.program_id, u.id, v.id
FROM ddodun.program_versions v
CROSS JOIN ddodun.users u
WHERE u.role = 'athlete';

-- 8. 사후 점검 (실패하면 트랜잭션 전체 롤백)
DO $$
DECLARE unlinked int;
BEGIN
  SELECT count(*) INTO unlinked
  FROM ddodun.workout_templates t
  WHERE t.extra_group_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM ddodun.program_version_templates pvt WHERE pvt.template_id = t.id
    );
  IF unlinked > 0 THEN
    RAISE EXCEPTION '어떤 버전에도 연결되지 않은 프로그램 템플릿 % 건. 롤백합니다.', unlinked;
  END IF;
END $$;

COMMIT;
