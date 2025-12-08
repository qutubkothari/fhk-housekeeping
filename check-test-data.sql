-- Check if we have test data in all tables
SELECT 'rooms' as table_name, COUNT(*) as count FROM rooms WHERE org_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'housekeeping_tasks', COUNT(*) FROM housekeeping_tasks WHERE org_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'service_requests', COUNT(*) FROM service_requests WHERE org_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'inventory_items', COUNT(*) FROM inventory_items WHERE org_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'linen_items', COUNT(*) FROM linen_items WHERE org_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'users', COUNT(*) FROM users WHERE org_id = '00000000-0000-0000-0000-000000000001';
