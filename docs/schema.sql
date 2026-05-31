-- DDODUN Schema Setup
-- Supabase Project: qaiammqgkrrgfstqadef (shared with BP Tracker)

-- 1. Create schema
CREATE SCHEMA IF NOT EXISTS ddodun;

-- 2. Users table
CREATE TABLE ddodun.users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username text UNIQUE NOT NULL,
  pin_hash text,
  created_by text,
  created_at timestamptz DEFAULT now()
);

-- 3. RLS
ALTER TABLE ddodun.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read" ON ddodun.users
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous update" ON ddodun.users
  FOR UPDATE USING (true);

-- 4. Grant access to anon role
GRANT USAGE ON SCHEMA ddodun TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA ddodun TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ddodun TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA ddodun GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA ddodun GRANT ALL ON SEQUENCES TO anon, authenticated;

-- 5. Initial user
INSERT INTO ddodun.users (username) VALUES ('chacha');
