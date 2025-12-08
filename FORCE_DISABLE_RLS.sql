-- FORCE disable RLS on specific tables causing issues
-- Run each command separately if needed

ALTER TABLE work_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE housekeeping_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE store_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE asset_maintenance DISABLE ROW LEVEL SECURITY;

-- Drop ALL RLS policies
DROP POLICY IF EXISTS "Allow public read" ON work_sessions;
DROP POLICY IF EXISTS "Allow authenticated users" ON work_sessions;
DROP POLICY IF EXISTS "Enable read access for all users" ON work_sessions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON work_sessions;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON work_sessions;

DROP POLICY IF EXISTS "Allow public read" ON housekeeping_tasks;
DROP POLICY IF EXISTS "Allow authenticated users" ON housekeeping_tasks;
DROP POLICY IF EXISTS "Enable read access for all users" ON housekeeping_tasks;

DROP POLICY IF EXISTS "Allow public read" ON rooms;
DROP POLICY IF EXISTS "Allow authenticated users" ON rooms;

DROP POLICY IF EXISTS "Allow public read" ON users;
DROP POLICY IF EXISTS "Allow authenticated users" ON users;

-- Verify (should show false for all)
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN ('work_sessions', 'housekeeping_tasks', 'rooms', 'users', 'inventory_items', 'store_transactions', 'assets', 'asset_maintenance')
ORDER BY tablename;
