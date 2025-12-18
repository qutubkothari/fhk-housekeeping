-- Check if admin@demohotel.com exists in auth.users and users table
-- Run this in Supabase SQL Editor

-- 1. Check auth.users table
SELECT 
  id as auth_user_id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'admin@demohotel.com';

-- 2. Check users table
SELECT 
  id as user_id,
  email,
  full_name,
  role,
  org_id,
  is_active
FROM users
WHERE email = 'admin@demohotel.com';

-- 3. Check if IDs match
SELECT 
  au.id as auth_id,
  u.id as users_id,
  CASE 
    WHEN au.id = u.id THEN '✅ IDs MATCH'
    ELSE '❌ IDs DO NOT MATCH - THIS IS THE PROBLEM'
  END as status,
  u.email,
  u.org_id,
  u.role
FROM auth.users au
LEFT JOIN users u ON u.email = au.email
WHERE au.email = 'admin@demohotel.com';

-- 4. Check activities in the user's org
SELECT 
  ha.id,
  ha.name,
  ha.code,
  ha.org_id,
  o.name as org_name
FROM housekeeping_activities ha
JOIN organizations o ON o.id = ha.org_id
WHERE ha.org_id = (
  SELECT org_id FROM users WHERE email = 'admin@demohotel.com' LIMIT 1
);

-- 5. If IDs don't match, here's the fix:
-- UPDATE users 
-- SET id = (SELECT id FROM auth.users WHERE email = 'admin@demohotel.com')
-- WHERE email = 'admin@demohotel.com';
