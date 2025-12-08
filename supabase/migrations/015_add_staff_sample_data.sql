-- Add sample staff members (in addition to existing admin@demohotel.com and ahmed@demohotel.com)

-- Add more housekeeping staff
INSERT INTO users (org_id, email, password_hash, full_name, full_name_ar, role, phone, preferred_language, is_active) 
VALUES
-- Housekeeping Staff
(
  '00000000-0000-0000-0000-000000000001',
  'fatima@demohotel.com',
  crypt('staff123', gen_salt('bf')),
  'Fatima Ali',
  'فاطمة علي',
  'staff',
  '+966 50 234 5678',
  'ar',
  TRUE
),
(
  '00000000-0000-0000-0000-000000000001',
  'mohammed@demohotel.com',
  crypt('staff123', gen_salt('bf')),
  'Mohammed Ibrahim',
  'محمد إبراهيم',
  'staff',
  '+966 50 345 6789',
  'ar',
  TRUE
),
(
  '00000000-0000-0000-0000-000000000001',
  'sara@demohotel.com',
  crypt('staff123', gen_salt('bf')),
  'Sara Abdullah',
  'سارة عبدالله',
  'staff',
  '+966 50 456 7890',
  'ar',
  TRUE
),

-- Supervisor
(
  '00000000-0000-0000-0000-000000000001',
  'supervisor@demohotel.com',
  crypt('super123', gen_salt('bf')),
  'Khalid Al-Rashid',
  'خالد الراشد',
  'supervisor',
  '+966 50 567 8901',
  'ar',
  TRUE
),

-- Maintenance Staff
(
  '00000000-0000-0000-0000-000000000001',
  'maintenance@demohotel.com',
  crypt('maint123', gen_salt('bf')),
  'Ali Hassan',
  'علي حسن',
  'maintenance',
  '+966 50 678 9012',
  'ar',
  TRUE
),
(
  '00000000-0000-0000-0000-000000000001',
  'technician@demohotel.com',
  crypt('tech123', gen_salt('bf')),
  'Omar Khalil',
  'عمر خليل',
  'maintenance',
  '+966 50 789 0123',
  'ar',
  TRUE
),

-- Laundry Staff
(
  '00000000-0000-0000-0000-000000000001',
  'laundry@demohotel.com',
  crypt('laundry123', gen_salt('bf')),
  'Mariam Ahmed',
  'مريم أحمد',
  'laundry',
  '+966 50 890 1234',
  'ar',
  TRUE
),

-- Inactive Staff (for testing)
(
  '00000000-0000-0000-0000-000000000001',
  'inactive@demohotel.com',
  crypt('inactive123', gen_salt('bf')),
  'Noor Mansoor',
  'نور منصور',
  'staff',
  '+966 50 901 2345',
  'ar',
  FALSE
)
ON CONFLICT (email) DO NOTHING;

-- Update last_login for some staff to show activity
UPDATE users 
SET last_login = NOW() - INTERVAL '2 hours'
WHERE email IN ('ahmed@demohotel.com', 'fatima@demohotel.com', 'supervisor@demohotel.com');

UPDATE users 
SET last_login = NOW() - INTERVAL '1 day'
WHERE email IN ('mohammed@demohotel.com', 'maintenance@demohotel.com');

UPDATE users 
SET last_login = NOW() - INTERVAL '3 days'
WHERE email IN ('sara@demohotel.com', 'laundry@demohotel.com');

-- Note: Default password for all demo staff is 'staff123' (or as specified)
-- Users should change password on first login
