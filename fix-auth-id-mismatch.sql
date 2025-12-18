-- Final diagnostic: Check exact ID mismatch

SELECT 
  'AUTH USER ID' as check_type,
  id,
  email
FROM auth.users
WHERE email = 'admin@demohotel.com'

UNION ALL

SELECT 
  'USERS TABLE ID' as check_type,
  id,
  email
FROM users
WHERE email = 'admin@demohotel.com';

-- If the two IDs above are DIFFERENT, run this fix:
UPDATE users 
SET id = (SELECT id FROM auth.users WHERE email = 'admin@demohotel.com')
WHERE email = 'admin@demohotel.com';

-- Then verify:
SELECT 
  au.id as auth_id,
  u.id as users_id,
  CASE WHEN au.id = u.id THEN '✅ FIXED' ELSE '❌ STILL BROKEN' END as status
FROM auth.users au
JOIN users u ON u.email = au.email
WHERE au.email = 'admin@demohotel.com';
