-- ============================================================================
-- 경고: 지금 이 SQL을 실행하지 마세요.
-- ============================================================================
--
-- 이 리포는 Vercel에 GitHub 연동으로 자동 배포된다. 이 SQL을 작성한 시점 기준,
-- feat/coach-athlete-foundation 브랜치는 master보다 19개 커밋 앞서 있고 아직
-- push되지 않았다. 즉 지금 배포되어 있는 앱(사용자가 방금 전까지 운동 기록을
-- 입력하던 그 앱)은 여전히 구버전 코드이며, 브라우저에서 Supabase anon 키로
-- 직접 DB에 접근한다. 이 상태에서 anon 권한을 회수하면 그 순간 배포된 앱이
-- 즉시 망가진다.
--
-- 아래 SQL은 다음 순서가 전부 끝난 뒤에만 실행한다:
--   1. feat/coach-athlete-foundation 브랜치를 master에 merge
--   2. Vercel 프로젝트 환경변수에 SESSION_SECRET 등록
--   3. merge된 코드가 Vercel에 배포됨
--   4. 배포된 앱에서 로그인이 정상 동작하는 것을 확인
--   5. (그 다음에야) 이 파일을 Supabase SQL Editor에서 실행
--   6. 실행 후 anon 키로 DB 접근 시 401/403이 오는지 확인
--   7. 주차 삽입 스크립트(node .claude/skills/ddodun-weekly-workout/scripts/validate.mjs)가
--      여전히 동작하는지 확인 — service role 키를 쓰므로 회수의 영향을 받지 않아야 정상
--
-- 실행 전 추가 확인: 클라이언트 코드에 Supabase 직접 접근이 남아있지 않아야 한다.
--   grep -rn "from '@/lib/supabase'" src   → 출력이 없어야 함
--   (2026-08-10 기준 확인 완료. src/lib/supabase.ts는 이미 삭제됨.)
--
-- 실행 후 앱의 모든 DB 접근은 서버의 service role 을 통해서만 이루어진다.
-- ============================================================================

REVOKE ALL ON ALL TABLES IN SCHEMA ddodun FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA ddodun FROM anon;
REVOKE ALL ON SCHEMA ddodun FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA ddodun REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA ddodun REVOKE ALL ON SEQUENCES FROM anon;
