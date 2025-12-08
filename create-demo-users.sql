-- Create demo users in Supabase Auth
-- Run this in Supabase SQL Editor AFTER running the migrations

-- Note: You need to create these users through Supabase Dashboard instead
-- Go to: Authentication > Users > Add User

-- User 1: Admin
-- Email: admin@demohotel.com
-- Password: admin123
-- Then update the user ID to match:
-- UPDATE auth.users SET id = '00000000-0000-0000-0000-000000000002' WHERE email = 'admin@demohotel.com';

-- User 2: Staff
-- Email: ahmed@demohotel.com  
-- Password: staff123
-- Then run:
-- INSERT INTO users (id, org_id, email, full_name, full_name_ar, role) 
-- VALUES (
--   (SELECT id FROM auth.users WHERE email = 'ahmed@demohotel.com'),
--   '00000000-0000-0000-0000-000000000001',
--   'ahmed@demohotel.com',
--   'Ahmed Hassan',
--   'أحمد حسن',
--   'staff'
-- );

-- ALTERNATIVE: Use Supabase Admin API or Dashboard to create users
-- This is the recommended approach for demo/test users
