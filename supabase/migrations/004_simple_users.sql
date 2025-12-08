-- Simple user creation that works with Supabase Auth
-- This uses the proper Supabase user creation approach

-- First, ensure the organization exists
INSERT INTO organizations (id, name, email) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Hotel', 'admin@demohotel.com')
ON CONFLICT (id) DO NOTHING;

-- Create users in the public.users table with proper structure
-- The auth users will be created via the Supabase Dashboard or API

-- Admin user placeholder (will be linked after auth user is created)
INSERT INTO users (org_id, email, full_name, full_name_ar, role) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@demohotel.com',
  'Admin User',
  'مستخدم المسؤول',
  'admin'
)
ON CONFLICT (email) DO NOTHING;

-- Staff user placeholder
INSERT INTO users (org_id, email, full_name, full_name_ar, role) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ahmed@demohotel.com',
  'Ahmed Hassan',
  'أحمد حسن',
  'staff'
)
ON CONFLICT (email) DO NOTHING;

-- After running this, use the Supabase Dashboard to:
-- 1. Go to Authentication > Users
-- 2. Add user: admin@demohotel.com with password: admin123 (Auto confirm: YES)
-- 3. Add user: ahmed@demohotel.com with password: staff123 (Auto confirm: YES)
-- 4. Then run the update below to link the IDs

-- Update the user IDs after creating in Supabase Dashboard:
-- UPDATE users SET id = (SELECT id FROM auth.users WHERE email = 'admin@demohotel.com') WHERE email = 'admin@demohotel.com';
-- UPDATE users SET id = (SELECT id FROM auth.users WHERE email = 'ahmed@demohotel.com') WHERE email = 'ahmed@demohotel.com';
