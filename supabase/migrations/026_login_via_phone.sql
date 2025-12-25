-- Migration: 026_login_via_phone.sql
-- Purpose: Allow phone-based login by making email optional and normalizing phone formats.

-- 1) Email should not be required (phone is the primary login identifier)
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- 2) Ensure phone_number exists (some parts of the app use phone, others phone_number)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- 3) Normalize phone values to digits-only to make lookups reliable
UPDATE users
SET phone = regexp_replace(phone, '[^0-9]', '', 'g')
WHERE phone IS NOT NULL;

UPDATE users
SET phone_number = regexp_replace(COALESCE(phone_number, phone), '[^0-9]', '', 'g')
WHERE COALESCE(phone_number, phone) IS NOT NULL;

-- 4) Optional: set admin demo phone if missing (so admin can also login by phone)
-- Pick any number you want; update it later in Staff > Edit User.
UPDATE users
SET phone = COALESCE(NULLIF(phone, ''), '966501234567'),
    phone_number = COALESCE(NULLIF(phone_number, ''), regexp_replace(COALESCE(NULLIF(phone, ''), '966501234567'), '[^0-9]', '', 'g'))
WHERE email = 'admin@demohotel.com';
