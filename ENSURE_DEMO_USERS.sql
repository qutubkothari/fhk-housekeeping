-- Ensure all demo users exist with correct roles and passwords
-- Run this in Supabase SQL Editor

-- Add password_hash column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- First, drop the old role constraint and add new one with 'inventory' role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'supervisor', 'staff', 'laundry', 'inventory', 'maintenance', 'front_desk'));

-- Delete any users with invalid IDs
DELETE FROM users WHERE id::text LIKE '%inv-user%' OR id::text LIKE '%laundry-user%';

-- Insert/Update admin user
INSERT INTO users (id, org_id, email, password_hash, full_name, full_name_ar, role, is_active) 
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'admin@demohotel.com',
  crypt('admin123', gen_salt('bf')),
  'Admin User',
  'مدير النظام',
  'admin',
  TRUE
) ON CONFLICT (id) DO UPDATE 
SET 
  password_hash = crypt('admin123', gen_salt('bf')),
  role = 'admin',
  is_active = TRUE;

-- Also ensure by email
INSERT INTO users (org_id, email, password_hash, full_name, full_name_ar, role, is_active) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@demohotel.com',
  crypt('admin123', gen_salt('bf')),
  'Admin User',
  'مدير النظام',
  'admin',
  TRUE
) ON CONFLICT (email) DO UPDATE 
SET 
  password_hash = crypt('admin123', gen_salt('bf')),
  role = 'admin',
  is_active = TRUE;

-- Inventory Manager
INSERT INTO users (org_id, email, password_hash, full_name, full_name_ar, role, is_active, phone, preferred_language) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'inventory@demohotel.com',
  crypt('inv123', gen_salt('bf')),
  'Inventory Manager',
  'مدير المخزون',
  'inventory',
  TRUE,
  '+966 50 111 1111',
  'en'
) ON CONFLICT (email) DO UPDATE 
SET 
  password_hash = crypt('inv123', gen_salt('bf')),
  role = 'inventory',
  is_active = TRUE;

-- Laundry Manager
INSERT INTO users (org_id, email, password_hash, full_name, full_name_ar, role, is_active, phone, preferred_language) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'laundry@demohotel.com',
  crypt('laundry123', gen_salt('bf')),
  'Mariam Ahmed',
  'مريم أحمد',
  'laundry',
  TRUE,
  '+966 50 890 1234',
  'ar'
) ON CONFLICT (email) DO UPDATE 
SET 
  password_hash = crypt('laundry123', gen_salt('bf')),
  role = 'laundry',
  is_active = TRUE;

-- Maintenance Manager
INSERT INTO users (org_id, email, password_hash, full_name, full_name_ar, role, is_active, phone, preferred_language) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'maintenance@demohotel.com',
  crypt('maint123', gen_salt('bf')),
  'Ali Hassan',
  'علي حسن',
  'maintenance',
  TRUE,
  '+966 50 678 9012',
  'ar'
) ON CONFLICT (email) DO UPDATE 
SET 
  password_hash = crypt('maint123', gen_salt('bf')),
  role = 'maintenance',
  is_active = TRUE;

-- Supervisor
INSERT INTO users (org_id, email, password_hash, full_name, full_name_ar, role, is_active, phone, preferred_language) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'supervisor@demohotel.com',
  crypt('super123', gen_salt('bf')),
  'Khalid Al-Rashid',
  'خالد الراشد',
  'supervisor',
  TRUE,
  '+966 50 567 8901',
  'ar'
) ON CONFLICT (email) DO UPDATE 
SET 
  password_hash = crypt('super123', gen_salt('bf')),
  role = 'supervisor',
  is_active = TRUE;

-- Housekeeping Staff - Fatima
INSERT INTO users (org_id, email, password_hash, full_name, full_name_ar, role, is_active, phone, preferred_language) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'fatima@demohotel.com',
  crypt('staff123', gen_salt('bf')),
  'Fatima Ali',
  'فاطمة علي',
  'staff',
  TRUE,
  '+966 50 234 5678',
  'ar'
) ON CONFLICT (email) DO UPDATE 
SET 
  password_hash = crypt('staff123', gen_salt('bf')),
  role = 'staff',
  is_active = TRUE;

-- Housekeeping Staff - Ahmed
INSERT INTO users (org_id, email, password_hash, full_name, full_name_ar, role, is_active, phone, preferred_language) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ahmed@demohotel.com',
  crypt('staff123', gen_salt('bf')),
  'Ahmed Hassan',
  'أحمد حسن',
  'staff',
  TRUE,
  '+966 50 345 6789',
  'ar'
) ON CONFLICT (email) DO UPDATE 
SET 
  password_hash = crypt('staff123', gen_salt('bf')),
  role = 'staff',
  is_active = TRUE;

-- Housekeeping Staff - Sara
INSERT INTO users (org_id, email, password_hash, full_name, full_name_ar, role, is_active, phone, preferred_language) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'sara@demohotel.com',
  crypt('staff123', gen_salt('bf')),
  'Sara Abdullah',
  'سارة عبدالله',
  'staff',
  TRUE,
  '+966 50 456 7890',
  'ar'
) ON CONFLICT (email) DO UPDATE 
SET 
  password_hash = crypt('staff123', gen_salt('bf')),
  role = 'staff',
  is_active = TRUE;

-- Housekeeping Staff - Mohammed
INSERT INTO users (org_id, email, password_hash, full_name, full_name_ar, role, is_active, phone, preferred_language) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'mohammed@demohotel.com',
  crypt('staff123', gen_salt('bf')),
  'Mohammed Ibrahim',
  'محمد إبراهيم',
  'staff',
  TRUE,
  '+966 50 345 6789',
  'ar'
) ON CONFLICT (email) DO UPDATE 
SET 
  password_hash = crypt('staff123', gen_salt('bf')),
  role = 'staff',
  is_active = TRUE;

-- Verify all users
SELECT 
  id,
  email,
  full_name,
  role,
  is_active,
  CASE WHEN password_hash IS NOT NULL THEN '✅ Has Password' ELSE '❌ No Password' END as password_status
FROM users
WHERE email LIKE '%@demohotel.com'
ORDER BY role, email;

-- Success message
SELECT '✅ All demo users created/updated successfully!' as status;
