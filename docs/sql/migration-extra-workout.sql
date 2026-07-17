-- "오늘 운동에 복제" 기능용 마커 컬럼 추가
-- Supabase SQL Editor에서 1회 실행 필요
ALTER TABLE ddodun.workout_templates
  ADD COLUMN IF NOT EXISTS extra_group_id uuid,
  ADD COLUMN IF NOT EXISTS extra_order    int;

-- 복제본 조회 성능용 부분 인덱스
CREATE INDEX IF NOT EXISTS idx_workout_templates_extra
  ON ddodun.workout_templates (date, extra_order)
  WHERE extra_group_id IS NOT NULL;
