-- Migration: 027_fix_phone_login_empty_strings.sql
-- Purpose: Fix phone-based login when phone fields are stored as empty strings.

-- 1) Convert empty strings to NULL so COALESCE/NULL checks behave correctly
UPDATE users SET phone = NULL WHERE phone = '';
UPDATE users SET phone_number = NULL WHERE phone_number = '';

-- 2) Normalize to digits-only
UPDATE users
SET phone = regexp_replace(phone, '[^0-9]', '', 'g')
WHERE phone IS NOT NULL;

UPDATE users
SET phone_number = regexp_replace(COALESCE(phone_number, phone), '[^0-9]', '', 'g')
WHERE COALESCE(phone_number, phone) IS NOT NULL;

-- 3) Ensure admin has a usable phone for demo login
UPDATE users
SET phone = COALESCE(phone, '966501234567'),
    phone_number = COALESCE(phone_number, COALESCE(phone, '966501234567'))
WHERE email = 'admin@demohotel.com';
