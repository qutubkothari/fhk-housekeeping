-- Add sample rooms data for demo
INSERT INTO rooms (org_id, room_number, floor, room_type, status, occupancy_status) VALUES
('00000000-0000-0000-0000-000000000001', '101', 1, 'standard', 'vacant', 'vacant'),
('00000000-0000-0000-0000-000000000001', '102', 1, 'standard', 'vacant', 'vacant'),
('00000000-0000-0000-0000-000000000001', '103', 1, 'deluxe', 'vacant', 'vacant'),
('00000000-0000-0000-0000-000000000001', '104', 1, 'deluxe', 'occupied', 'occupied'),
('00000000-0000-0000-0000-000000000001', '105', 1, 'suite', 'cleaning', 'vacant'),
('00000000-0000-0000-0000-000000000001', '201', 2, 'standard', 'occupied', 'occupied'),
('00000000-0000-0000-0000-000000000001', '202', 2, 'standard', 'vacant', 'vacant'),
('00000000-0000-0000-0000-000000000001', '203', 2, 'deluxe', 'maintenance', 'vacant'),
('00000000-0000-0000-0000-000000000001', '204', 2, 'deluxe', 'occupied', 'occupied'),
('00000000-0000-0000-0000-000000000001', '205', 2, 'suite', 'vacant', 'reserved'),
('00000000-0000-0000-0000-000000000001', '301', 3, 'standard', 'vacant', 'vacant'),
('00000000-0000-0000-0000-000000000001', '302', 3, 'standard', 'occupied', 'occupied'),
('00000000-0000-0000-0000-000000000001', '303', 3, 'deluxe', 'vacant', 'vacant'),
('00000000-0000-0000-0000-000000000001', '304', 3, 'deluxe', 'cleaning', 'vacant'),
('00000000-0000-0000-0000-000000000001', '305', 3, 'suite', 'occupied', 'occupied')
ON CONFLICT DO NOTHING;
