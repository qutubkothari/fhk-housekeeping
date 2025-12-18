-- Simple auth setup: plain text password + disable RLS

-- 1. Set simple password for admin user
UPDATE users 
SET password_hash = 'admin123'
WHERE email = 'admin@demohotel.com';

-- 2. Disable RLS on activity tables (for simple testing)
ALTER TABLE housekeeping_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE room_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT email, password_hash, org_id, role FROM users WHERE email = 'admin@demohotel.com';
