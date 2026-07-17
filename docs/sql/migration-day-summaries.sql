-- 편집 가능·증분 누적 오늘 운동 요약 저장 테이블
-- Supabase SQL Editor에서 1회 실행 필요
CREATE TABLE IF NOT EXISTS ddodun.workout_day_summaries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  date date NOT NULL,
  text text NOT NULL DEFAULT '',
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
