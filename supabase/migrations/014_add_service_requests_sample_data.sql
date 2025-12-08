-- Add sample service requests
INSERT INTO service_requests (
  org_id, room_id, request_type, category, title, description, 
  reported_by, assigned_to, status, priority, estimated_time, created_at
) VALUES
-- Guest Requests
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE org_id = '00000000-0000-0000-0000-000000000001' AND room_number = '101'),
  'guest_request',
  'extra_towels',
  'Extra Towels Needed',
  'Guest requested 2 additional bath towels',
  (SELECT id FROM users WHERE email = 'admin@demohotel.com'),
  (SELECT id FROM users WHERE email = 'ahmed@demohotel.com'),
  'assigned',
  'normal',
  10,
  NOW() - INTERVAL '2 hours'
),
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE org_id = '00000000-0000-0000-0000-000000000001' AND room_number = '201'),
  'guest_request',
  'room_service',
  'Room Cleaning Request',
  'Guest requested immediate room cleaning',
  (SELECT id FROM users WHERE email = 'admin@demohotel.com'),
  (SELECT id FROM users WHERE email = 'ahmed@demohotel.com'),
  'in_progress',
  'high',
  30,
  NOW() - INTERVAL '1 hour'
),
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE org_id = '00000000-0000-0000-0000-000000000001' AND room_number = '105'),
  'guest_request',
  'amenities',
  'Extra Pillows',
  'Guest needs 2 extra pillows for children',
  (SELECT id FROM users WHERE email = 'admin@demohotel.com'),
  NULL,
  'open',
  'low',
  5,
  NOW() - INTERVAL '30 minutes'
),

-- Breakdowns
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE org_id = '00000000-0000-0000-0000-000000000001' AND room_number = '203'),
  'breakdown',
  'ac_issue',
  'AC Not Working',
  'Air conditioning unit not cooling. Room temperature is 28°C.',
  (SELECT id FROM users WHERE email = 'admin@demohotel.com'),
  (SELECT id FROM users WHERE email = 'ahmed@demohotel.com'),
  'in_progress',
  'urgent',
  60,
  NOW() - INTERVAL '3 hours'
),
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE org_id = '00000000-0000-0000-0000-000000000001' AND room_number = '102'),
  'breakdown',
  'plumbing',
  'Leaking Faucet',
  'Bathroom sink faucet is dripping continuously',
  (SELECT id FROM users WHERE email = 'admin@demohotel.com'),
  NULL,
  'assigned',
  'high',
  45,
  NOW() - INTERVAL '4 hours'
),

-- Maintenance
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE org_id = '00000000-0000-0000-0000-000000000001' AND room_number = '104'),
  'maintenance',
  'electrical',
  'Light Bulb Replacement',
  'Bedside lamp bulb needs replacement',
  (SELECT id FROM users WHERE email = 'admin@demohotel.com'),
  (SELECT id FROM users WHERE email = 'ahmed@demohotel.com'),
  'resolved',
  'low',
  10,
  NOW() - INTERVAL '1 day'
),
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE org_id = '00000000-0000-0000-0000-000000000001' AND room_number = '202'),
  'maintenance',
  'furniture',
  'Chair Repair Needed',
  'Office chair wobbles, needs tightening',
  (SELECT id FROM users WHERE email = 'admin@demohotel.com'),
  NULL,
  'open',
  'normal',
  20,
  NOW() - INTERVAL '5 hours'
),

-- Housekeeping
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE org_id = '00000000-0000-0000-0000-000000000001' AND room_number = '103'),
  'housekeeping',
  'deep_clean',
  'Deep Cleaning Required',
  'Room needs deep cleaning after long-stay guest checkout',
  (SELECT id FROM users WHERE email = 'admin@demohotel.com'),
  (SELECT id FROM users WHERE email = 'ahmed@demohotel.com'),
  'assigned',
  'high',
  90,
  NOW() - INTERVAL '2 hours'
),
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE org_id = '00000000-0000-0000-0000-000000000001' AND room_number = '204'),
  'housekeeping',
  'turndown_service',
  'Evening Turndown Service',
  'Guest requested turndown service for tonight',
  (SELECT id FROM users WHERE email = 'admin@demohotel.com'),
  (SELECT id FROM users WHERE email = 'ahmed@demohotel.com'),
  'resolved',
  'normal',
  15,
  NOW() - INTERVAL '12 hours'
),

-- Closed/Cancelled
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE org_id = '00000000-0000-0000-0000-000000000001' AND room_number = '101'),
  'guest_request',
  'wake_up_call',
  'Wake Up Call Request',
  'Guest requested wake up call at 7:00 AM',
  (SELECT id FROM users WHERE email = 'admin@demohotel.com'),
  (SELECT id FROM users WHERE email = 'ahmed@demohotel.com'),
  'closed',
  'normal',
  2,
  NOW() - INTERVAL '2 days'
),
(
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM rooms WHERE org_id = '00000000-0000-0000-0000-000000000001' AND room_number = '105'),
  'maintenance',
  'tv_issue',
  'TV Not Working',
  'Television screen is black. Later found guest had unplugged it.',
  (SELECT id FROM users WHERE email = 'admin@demohotel.com'),
  (SELECT id FROM users WHERE email = 'ahmed@demohotel.com'),
  'cancelled',
  'normal',
  NULL,
  NOW() - INTERVAL '1 day'
)
ON CONFLICT DO NOTHING;

-- Update resolved requests with resolution timestamps
UPDATE service_requests 
SET resolved_at = created_at + INTERVAL '2 hours'
WHERE status = 'resolved' AND org_id = '00000000-0000-0000-0000-000000000001';

-- Update closed requests with closed timestamps
UPDATE service_requests 
SET 
  resolved_at = created_at + INTERVAL '1 hour',
  closed_at = created_at + INTERVAL '2 hours'
WHERE status = 'closed' AND org_id = '00000000-0000-0000-0000-000000000001';
