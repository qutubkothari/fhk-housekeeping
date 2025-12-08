-- Add sample housekeeping tasks
INSERT INTO housekeeping_tasks (
  org_id, room_id, assigned_to, assigned_by, task_type, priority, status, scheduled_date, notes
)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  r.id,
  (SELECT id FROM users WHERE email = 'ahmed@demohotel.com'),
  (SELECT id FROM users WHERE email = 'admin@demohotel.com'),
  'regular',
  'normal',
  'pending',
  CURRENT_DATE,
  'Daily cleaning task'
FROM rooms r
WHERE r.org_id = '00000000-0000-0000-0000-000000000001' 
  AND r.room_number IN ('101', '102', '103')
ON CONFLICT DO NOTHING;

INSERT INTO housekeeping_tasks (
  org_id, room_id, assigned_to, assigned_by, task_type, priority, status, scheduled_date, notes
)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  r.id,
  (SELECT id FROM users WHERE email = 'ahmed@demohotel.com'),
  (SELECT id FROM users WHERE email = 'admin@demohotel.com'),
  'checkout',
  'high',
  'in_progress',
  CURRENT_DATE,
  'Guest checkout - deep clean required'
FROM rooms r
WHERE r.org_id = '00000000-0000-0000-0000-000000000001' 
  AND r.room_number = '105'
ON CONFLICT DO NOTHING;

INSERT INTO housekeeping_tasks (
  org_id, room_id, assigned_to, assigned_by, task_type, priority, status, scheduled_date, notes
)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  r.id,
  (SELECT id FROM users WHERE email = 'ahmed@demohotel.com'),
  (SELECT id FROM users WHERE email = 'admin@demohotel.com'),
  'deep_clean',
  'urgent',
  'pending',
  CURRENT_DATE,
  'Deep cleaning required'
FROM rooms r
WHERE r.org_id = '00000000-0000-0000-0000-000000000001' 
  AND r.room_number = '203'
ON CONFLICT DO NOTHING;

INSERT INTO housekeeping_tasks (
  org_id, room_id, assigned_to, assigned_by, task_type, priority, status, scheduled_date, notes
)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  r.id,
  (SELECT id FROM users WHERE email = 'ahmed@demohotel.com'),
  (SELECT id FROM users WHERE email = 'admin@demohotel.com'),
  'regular',
  'normal',
  'completed',
  CURRENT_DATE,
  'Completed successfully'
FROM rooms r
WHERE r.org_id = '00000000-0000-0000-0000-000000000001' 
  AND r.room_number IN ('201', '202')
ON CONFLICT DO NOTHING;
