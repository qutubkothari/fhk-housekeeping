-- Check if auth.users ID matches users table ID for admin@demohotel.com

-- 1. Get auth user ID
SELECT 
  'AUTH USER' as source,
  id as user_id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'admin@demohotel.com';

-- 2. Get users table ID
SELECT 
  'USERS TABLE' as source,
  id as user_id,
  email,
  org_id,
  role,
  is_active
FROM users
WHERE email = 'admin@demohotel.com';

-- 3. Check if IDs match (CRITICAL for RLS)
SELECT 
  au.id as auth_id,
  u.id as users_table_id,
  CASE 
    WHEN au.id = u.id THEN '✅ IDs MATCH - RLS will work'
    ELSE '❌ IDS DO NOT MATCH - RLS WILL BLOCK QUERIES'
  END as status,
  au.email
FROM auth.users au
FULL OUTER JOIN users u ON u.email = au.email
WHERE au.email = 'admin@demohotel.com' OR u.email = 'admin@demohotel.com';

-- 4. If IDs don't match, fix it:
-- CRITICAL FIX - This syncs the users.id with auth.users.id
-- UPDATE users 
-- SET id = (SELECT id FROM auth.users WHERE email = 'admin@demohotel.com')
-- WHERE email = 'admin@demohotel.com';

-- 5. Test the RLS policy manually
-- This simulates what happens when the user queries activities
SELECT 
  'RLS TEST' as test,
  ha.id,
  ha.name,
  ha.code,
  ha.org_id
FROM housekeeping_activities ha
WHERE ha.org_id IN (
  SELECT org_id FROM users WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@demohotel.com')
);
