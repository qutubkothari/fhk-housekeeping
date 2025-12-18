-- Check which org_id the activities are saved under and which org_id the user belongs to

-- 1. Find admin@demohotel.com user details
SELECT 
  'USER INFO' as section,
  id as user_id,
  email,
  full_name,
  role,
  org_id as user_org_id,
  is_active
FROM users
WHERE email = 'admin@demohotel.com';

-- 2. Check all activities in the database with their org_id
SELECT 
  'ALL ACTIVITIES' as section,
  ha.id,
  ha.name,
  ha.code,
  ha.org_id as activity_org_id,
  o.name as org_name,
  ha.is_active,
  ha.created_at
FROM housekeeping_activities ha
LEFT JOIN organizations o ON o.id = ha.org_id
ORDER BY ha.created_at DESC;

-- 3. Check if user's org_id matches activity org_id
SELECT 
  'ORG MATCH CHECK' as section,
  u.email,
  u.org_id as user_org_id,
  COUNT(ha.id) as activities_in_users_org,
  CASE 
    WHEN COUNT(ha.id) = 0 THEN '❌ NO ACTIVITIES IN USER ORG - THIS IS THE PROBLEM'
    ELSE '✅ Activities found in user org'
  END as status
FROM users u
LEFT JOIN housekeeping_activities ha ON ha.org_id = u.org_id AND ha.is_active = true
WHERE u.email = 'admin@demohotel.com'
GROUP BY u.email, u.org_id;

-- 4. Check all organizations
SELECT 
  'ALL ORGS' as section,
  id as org_id,
  name as org_name,
  created_at
FROM organizations
ORDER BY created_at;

-- 5. Count activities per org
SELECT 
  'ACTIVITIES PER ORG' as section,
  o.id as org_id,
  o.name as org_name,
  COUNT(ha.id) as activity_count
FROM organizations o
LEFT JOIN housekeeping_activities ha ON ha.org_id = o.id
GROUP BY o.id, o.name
ORDER BY activity_count DESC;

-- 6. If user is in wrong org, fix with this (uncomment and run):
-- First, find the org that has activities:
-- SELECT id FROM organizations WHERE id IN (SELECT DISTINCT org_id FROM housekeeping_activities) LIMIT 1;

-- Then update user to that org:
-- UPDATE users 
-- SET org_id = (SELECT id FROM organizations WHERE id IN (SELECT DISTINCT org_id FROM housekeeping_activities) LIMIT 1)
-- WHERE email = 'admin@demohotel.com';
