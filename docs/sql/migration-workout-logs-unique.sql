-- workout_logs 중복 방지: (user_id, date, template_id) 유니크
-- Supabase SQL Editor에서 1회 실행. 여러 번 실행해도 안전하다.
--
-- 증상: 오늘 운동 요약에 같은 섹션이 두 번 출력됐다.
--
-- 원인: 한 운동(template_id)에 로그 행이 둘 이상 존재했다. 저장 요청이 동시에 두 번
--       나가면 양쪽 다 '기존 행 없음'으로 판단해 각각 INSERT 했다. 2026-03-27 부터
--       14일치가 누적돼 있었고, 2026-08-18 에 19행을 정리했다.
--       (지운 행 내용은 docs/sql/deleted-duplicate-logs-backup.json 에 보관)
--
-- 애플리케이션 쪽은 이미 고쳤다 — /api/logs POST 가 id 없이 들어와도 같은
-- (user_id, date, template_id) 행이 있으면 UPDATE 한다. 다만 그것도 read-then-write 라
-- 동시 요청에서는 여전히 좁은 경쟁 구간이 남는다. 이 제약이 최종 방어선이다.
--
-- template_id 가 NULL 인 커스텀 로그는 대상에서 제외한다. 한 날짜에 여러 개를
-- 자유롭게 추가할 수 있어야 하므로 부분 인덱스를 쓴다.

BEGIN;

-- 1. 남아 있는 중복이 없는지 먼저 확인한다. 있으면 인덱스 생성이 실패하므로 미리 멈춘다.
DO $$
DECLARE dup int;
BEGIN
  SELECT count(*) INTO dup FROM (
    SELECT 1
    FROM ddodun.workout_logs
    WHERE template_id IS NOT NULL
    GROUP BY user_id, date, template_id
    HAVING count(*) > 1
  ) d;
  IF dup > 0 THEN
    RAISE EXCEPTION '(user_id, date, template_id) 중복 % 건이 남아 있습니다. 정리 후 다시 실행하세요.', dup;
  END IF;
END $$;

-- 2. 부분 유니크 인덱스 생성
CREATE UNIQUE INDEX IF NOT EXISTS workout_logs_user_date_template_key
  ON ddodun.workout_logs (user_id, date, template_id)
  WHERE template_id IS NOT NULL;

COMMIT;

-- 실행 후 확인:
--   SELECT indexname FROM pg_indexes
--   WHERE schemaname='ddodun' AND tablename='workout_logs';
