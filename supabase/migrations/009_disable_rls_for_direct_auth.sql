-- Disable RLS on tables since we're using direct database authentication instead of Supabase Auth
-- The org_id filtering is handled at the application level with the stored orgId

ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE housekeeping_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE linen_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE linen_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Note: Security is now handled by:
-- 1. Application-level filtering using orgId from login response
-- 2. API key protection (only apps with anon key can access)
-- 3. Network security (EC2 security groups, etc.)
