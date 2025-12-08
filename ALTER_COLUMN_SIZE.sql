-- Run this in Supabase SQL Editor
-- We are changing the column type to TEXT to allow storing multiple selected issues

ALTER TABLE service_requests 
ALTER COLUMN breakdown_category TYPE TEXT;

-- Success message (Colon removed to avoid parser errors)
SELECT 'Migration breakdown_category column changed to TEXT successfully' as result;
