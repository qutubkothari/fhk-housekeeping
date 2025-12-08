-- Assign rooms to Fatima (staff user)
-- First, get Fatima's user ID
-- User ID: 30cefa4c-00c5-4305-9ffc-5442ad0b0a3a (from earlier logs)

-- Delete any old tasks for testing
DELETE FROM housekeeping_tasks WHERE assigned_to = '30cefa4c-00c5-4305-9ffc-5442ad0b0a3a';

-- Assign 3 rooms to Fatima for today (get org_id from user record)
INSERT INTO housekeeping_tasks (org_id, room_id, assigned_to, task_type, status, scheduled_date, notes)
SELECT 
    u.org_id,
    r.id as room_id,
    '30cefa4c-00c5-4305-9ffc-5442ad0b0a3a' as assigned_to,
    'regular' as task_type,
    'pending' as status,
    CURRENT_DATE as scheduled_date,
    'Daily cleaning task' as notes
FROM rooms r
CROSS JOIN users u
WHERE u.id = '30cefa4c-00c5-4305-9ffc-5442ad0b0a3a'
    AND r.room_number IN ('101', '102', '103')
LIMIT 3;

-- Verify
SELECT 
    t.id,
    t.status,
    t.priority,
    r.room_number,
    r.floor,
    u.full_name as assigned_to_name
FROM housekeeping_tasks t
JOIN rooms r ON t.room_id = r.id
JOIN users u ON t.assigned_to = u.id
WHERE t.assigned_to = '30cefa4c-00c5-4305-9ffc-5442ad0b0a3a';
