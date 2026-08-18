-- user_nrm UNIQUE 제약에서 user_id 누락 수정
-- Supabase SQL Editor에서 1회 실행. 여러 번 실행해도 안전하다.
--
-- 증상: 한 선수가 기록한 종목/RM 조합을 다른 선수가 저장하면 실패한다.
--       PR 화면에서 저장을 눌러도 반영되지 않고, 서버는 500 을 반환한다.
--
-- 원인: UNIQUE 제약이 (exercise_name, rep_max) 로 걸려 있어 user_id 가 빠져 있다.
--       선수가 1명일 때는 드러나지 않다가, 2명 이상이 되면서 충돌하기 시작했다.
--         duplicate key value violates unique constraint "user_nrm_exercise_name_rep_max_key"
--         Key (exercise_name, rep_max)=(Back Squat, 3) already exists.
--
-- 참고: user_1rm 과 user_pace_records 는 확인 결과 이 문제가 없다.

BEGIN;

-- 1. user_id 를 포함하지 않는 UNIQUE 제약을 모두 제거한다.
--    제약 이름을 가정하지 않고 정의 문자열로 판별하므로 이름이 달라도 동작한다.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname, pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'ddodun'
      AND t.relname = 'user_nrm'
      AND c.contype = 'u'
  LOOP
    IF position('user_id' in r.def) = 0 THEN
      EXECUTE format('ALTER TABLE ddodun.user_nrm DROP CONSTRAINT %I', r.conname);
      RAISE NOTICE '제거된 제약: % — %', r.conname, r.def;
    ELSE
      RAISE NOTICE '유지된 제약: % — %', r.conname, r.def;
    END IF;
  END LOOP;
END $$;

-- 2. 새 제약을 걸기 전에 중복이 없는지 확인한다.
DO $$
DECLARE dup int;
BEGIN
  SELECT count(*) INTO dup FROM (
    SELECT 1
    FROM ddodun.user_nrm
    GROUP BY user_id, exercise_name, rep_max
    HAVING count(*) > 1
  ) d;
  IF dup > 0 THEN
    RAISE EXCEPTION '(user_id, exercise_name, rep_max) 중복 % 건. 정리 후 다시 실행하세요.', dup;
  END IF;
END $$;

-- 3. user_id 를 포함한 올바른 제약을 추가한다. 이미 있으면 건너뛴다.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'ddodun'
      AND t.relname = 'user_nrm'
      AND c.contype = 'u'
      AND position('user_id' in pg_get_constraintdef(c.oid)) > 0
  ) THEN
    RAISE NOTICE 'user_id 를 포함한 UNIQUE 제약이 이미 존재합니다. 추가하지 않습니다.';
  ELSE
    ALTER TABLE ddodun.user_nrm
      ADD CONSTRAINT user_nrm_user_exercise_rep_key UNIQUE (user_id, exercise_name, rep_max);
    RAISE NOTICE '추가된 제약: user_nrm_user_exercise_rep_key (user_id, exercise_name, rep_max)';
  END IF;
END $$;

COMMIT;

-- 실행 후 확인 — (user_id, exercise_name, rep_max) 형태 하나만 남아야 한다:
--   SELECT conname, pg_get_constraintdef(c.oid)
--   FROM pg_constraint c
--   JOIN pg_class t ON t.oid = c.conrelid
--   JOIN pg_namespace n ON n.oid = t.relnamespace
--   WHERE n.nspname='ddodun' AND t.relname='user_nrm' AND c.contype='u';
