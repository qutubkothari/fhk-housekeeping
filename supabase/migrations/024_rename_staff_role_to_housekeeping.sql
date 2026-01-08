-- Rename system role value from 'staff' to 'housekeeping'
-- This keeps semantics but updates stored value in users table.

UPDATE public.users
SET role = 'housekeeping'
WHERE role = 'staff';
