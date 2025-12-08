-- FHK Housekeeping - Create Demo Users
-- Run this in Supabase SQL Editor after migrations

-- First, create the auth users using Supabase's auth.users table
-- Note: Passwords are hashed with bcrypt

-- Create admin user in auth
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'admin@demohotel.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Admin User"}'::jsonb
);

-- Create admin identity
INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000000002', 'email', 'admin@demohotel.com'),
  'email',
  NOW(),
  NOW(),
  NOW()
);

-- Create staff user in auth
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000003',
  'authenticated',
  'authenticated',
  'ahmed@demohotel.com',
  crypt('staff123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Ahmed Hassan"}'::jsonb
);

-- Create staff identity
INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000003',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000000003', 'email', 'ahmed@demohotel.com'),
  'email',
  NOW(),
  NOW(),
  NOW()
);

-- Now update/insert the app users table
-- Update existing admin user
UPDATE users 
SET id = '00000000-0000-0000-0000-000000000002'
WHERE email = 'admin@demohotel.com';

-- Insert staff user
INSERT INTO users (id, org_id, email, full_name, full_name_ar, role) 
VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'ahmed@demohotel.com',
  'Ahmed Hassan',
  'أحمد حسن',
  'staff'
) ON CONFLICT (email) DO NOTHING;

-- Verify users were created
SELECT email, role, full_name FROM users;
SELECT email, email_confirmed_at FROM auth.users WHERE email IN ('admin@demohotel.com', 'ahmed@demohotel.com');
