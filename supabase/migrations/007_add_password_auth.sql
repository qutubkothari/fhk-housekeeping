-- Add password field to users table for direct authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create login function that returns user data if credentials are correct
CREATE OR REPLACE FUNCTION login(p_email TEXT, p_password TEXT)
RETURNS TABLE (
  id UUID,
  org_id UUID,
  email TEXT,
  full_name TEXT,
  full_name_ar TEXT,
  role TEXT,
  preferred_language TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.org_id,
    u.email,
    u.full_name,
    u.full_name_ar,
    u.role,
    u.preferred_language,
    u.avatar_url
  FROM users u
  WHERE u.email = p_email 
    AND u.password_hash = crypt(p_password, u.password_hash)
    AND u.is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert demo users with hashed passwords
UPDATE users 
SET password_hash = crypt('admin123', gen_salt('bf'))
WHERE email = 'admin@demohotel.com';

INSERT INTO users (org_id, email, password_hash, full_name, full_name_ar, role) 
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ahmed@demohotel.com',
  crypt('staff123', gen_salt('bf')),
  'Ahmed Hassan',
  'أحمد حسن',
  'staff'
) ON CONFLICT (email) DO UPDATE 
SET password_hash = crypt('staff123', gen_salt('bf'));
