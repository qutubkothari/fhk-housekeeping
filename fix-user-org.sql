-- Fix: Update admin@demohotel.com to be in the correct org with activities

UPDATE users 
SET org_id = '00000000-0000-0000-0000-000000000001'
WHERE email = 'admin@demohotel.com';

-- Verify the fix
SELECT 
  u.email,
  u.org_id as user_org_id,
  o.name as org_name,
  COUNT(ha.id) as activities_available,
  CASE 
    WHEN COUNT(ha.id) > 0 THEN '✅ User can now see activities'
    ELSE '❌ Still no activities'
  END as status
FROM users u
LEFT JOIN organizations o ON o.id = u.org_id
LEFT JOIN housekeeping_activities ha ON ha.org_id = u.org_id AND ha.is_active = true
WHERE u.email = 'admin@demohotel.com'
GROUP BY u.email, u.org_id, o.name;
