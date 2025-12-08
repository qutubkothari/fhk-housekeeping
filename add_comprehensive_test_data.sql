-- =====================================================
-- COMPREHENSIVE TEST DATA FOR ALL USERS
-- Run this in Supabase SQL Editor
-- =====================================================

-- Get user IDs for assignments
DO $$ 
DECLARE
  v_admin_id UUID := (SELECT id FROM users WHERE email = 'admin@demohotel.com');
  v_inventory_id UUID := (SELECT id FROM users WHERE email = 'inventory@demohotel.com');
  v_laundry_id UUID := (SELECT id FROM users WHERE email = 'laundry@demohotel.com');
  v_supervisor_id UUID := (SELECT id FROM users WHERE email = 'supervisor@demohotel.com');
  v_fatima_id UUID := (SELECT id FROM users WHERE email = 'fatima@demohotel.com');
  v_ahmed_id UUID := (SELECT id FROM users WHERE email = 'ahmed@demohotel.com');
  v_sara_id UUID := (SELECT id FROM users WHERE email = 'sara@demohotel.com');
  v_ali_id UUID := (SELECT id FROM users WHERE email = 'ali@demohotel.com');
  v_omar_id UUID := (SELECT id FROM users WHERE email = 'omar@demohotel.com');
  v_layla_id UUID := (SELECT id FROM users WHERE email = 'layla@demohotel.com');
  v_org_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN

-- =====================================================
-- HOUSEKEEPING TASKS FOR STAFF (fatima, ahmed, sara)
-- =====================================================

-- Fatima's Tasks
INSERT INTO housekeeping_tasks (org_id, room_id, assigned_to, assigned_by, task_type, priority, status, scheduled_date, notes)
SELECT v_org_id, r.id, v_fatima_id, v_supervisor_id, 'regular', 'normal', 'pending', CURRENT_DATE, 'Morning cleaning schedule'
FROM rooms r WHERE r.org_id = v_org_id AND r.room_number IN ('101', '102', '103', '104')
ON CONFLICT DO NOTHING;

INSERT INTO housekeeping_tasks (org_id, room_id, assigned_to, assigned_by, task_type, priority, status, scheduled_date, notes)
SELECT v_org_id, r.id, v_fatima_id, v_supervisor_id, 'checkout', 'high', 'in_progress', CURRENT_DATE, 'Guest checkout at 11 AM - prepare for new guest'
FROM rooms r WHERE r.org_id = v_org_id AND r.room_number = '105'
ON CONFLICT DO NOTHING;

-- Ahmed's Tasks
INSERT INTO housekeeping_tasks (org_id, room_id, assigned_to, assigned_by, task_type, priority, status, scheduled_date, notes)
SELECT v_org_id, r.id, v_ahmed_id, v_supervisor_id, 'regular', 'normal', 'pending', CURRENT_DATE, 'Standard cleaning'
FROM rooms r WHERE r.org_id = v_org_id AND r.room_number IN ('201', '202', '203')
ON CONFLICT DO NOTHING;

INSERT INTO housekeeping_tasks (org_id, room_id, assigned_to, assigned_by, task_type, priority, status, scheduled_date, notes)
SELECT v_org_id, r.id, v_ahmed_id, v_supervisor_id, 'deep_clean', 'urgent', 'pending', CURRENT_DATE, 'Deep clean required - VIP guest arriving'
FROM rooms r WHERE r.org_id = v_org_id AND r.room_number = '205'
ON CONFLICT DO NOTHING;

INSERT INTO housekeeping_tasks (org_id, room_id, assigned_to, assigned_by, task_type, priority, status, scheduled_date, notes)
SELECT v_org_id, r.id, v_ahmed_id, v_supervisor_id, 'regular', 'normal', 'completed', CURRENT_DATE - INTERVAL '1 day', 'Completed yesterday'
FROM rooms r WHERE r.org_id = v_org_id AND r.room_number IN ('301', '302')
ON CONFLICT DO NOTHING;

-- Sara's Tasks
INSERT INTO housekeeping_tasks (org_id, room_id, assigned_to, assigned_by, task_type, priority, status, scheduled_date, notes)
SELECT v_org_id, r.id, v_sara_id, v_supervisor_id, 'regular', 'normal', 'pending', CURRENT_DATE, 'Third floor assignment'
FROM rooms r WHERE r.org_id = v_org_id AND r.room_number IN ('303', '304', '305')
ON CONFLICT DO NOTHING;

INSERT INTO housekeeping_tasks (org_id, room_id, assigned_to, assigned_by, task_type, priority, status, scheduled_date, notes)
SELECT v_org_id, r.id, v_sara_id, v_supervisor_id, 'inspection', 'normal', 'in_progress', CURRENT_DATE, 'Quality inspection after cleaning'
FROM rooms r WHERE r.org_id = v_org_id AND r.room_number = '301'
ON CONFLICT DO NOTHING;

-- =====================================================
-- SERVICE REQUESTS FOR MAINTENANCE STAFF (ali, omar)
-- =====================================================

-- Ali's Maintenance Requests
INSERT INTO service_requests (org_id, room_id, request_type, category, title, description, reported_by, assigned_to, status, priority, estimated_time, created_at)
VALUES
(v_org_id, (SELECT id FROM rooms WHERE org_id = v_org_id AND room_number = '101'), 'breakdown', 'ac', 'AC Not Cooling', 'Air conditioning not working properly. Temperature not dropping below 25°C', v_admin_id, v_ali_id, 'assigned', 'urgent', 90, NOW() - INTERVAL '2 hours'),
(v_org_id, (SELECT id FROM rooms WHERE org_id = v_org_id AND room_number = '203'), 'breakdown', 'plumbing', 'Shower Drain Clogged', 'Shower water draining very slowly', v_admin_id, v_ali_id, 'in_progress', 'high', 60, NOW() - INTERVAL '4 hours'),
(v_org_id, (SELECT id FROM rooms WHERE org_id = v_org_id AND room_number = '105'), 'breakdown', 'electrical', 'Lights Flickering', 'Bathroom lights flickering intermittently', v_admin_id, v_ali_id, 'assigned', 'normal', 30, NOW() - INTERVAL '1 hour'),
(v_org_id, (SELECT id FROM rooms WHERE org_id = v_org_id AND room_number = '202'), 'maintenance', 'furniture', 'Chair Wobbling', 'Desk chair needs tightening', v_admin_id, v_ali_id, 'closed', 'low', 15, NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Omar's Maintenance Requests
INSERT INTO service_requests (org_id, room_id, request_type, category, title, description, reported_by, assigned_to, status, priority, estimated_time, created_at)
VALUES
(v_org_id, (SELECT id FROM rooms WHERE org_id = v_org_id AND room_number = '204'), 'breakdown', 'ac', 'AC Making Noise', 'AC unit making loud buzzing sound', v_admin_id, v_omar_id, 'assigned', 'high', 75, NOW() - INTERVAL '3 hours'),
(v_org_id, (SELECT id FROM rooms WHERE org_id = v_org_id AND room_number = '301'), 'breakdown', 'electrical', 'Power Outlet Not Working', 'Wall outlet near bed not providing power', v_admin_id, v_omar_id, 'assigned', 'normal', 45, NOW() - INTERVAL '30 minutes'),
(v_org_id, (SELECT id FROM rooms WHERE org_id = v_org_id AND room_number = '303'), 'maintenance', 'plumbing', 'Faucet Dripping', 'Bathroom sink faucet dripping continuously', v_admin_id, v_omar_id, 'in_progress', 'normal', 30, NOW() - INTERVAL '5 hours'),
(v_org_id, (SELECT id FROM rooms WHERE org_id = v_org_id AND room_number = '102'), 'breakdown', 'appliance', 'TV Not Working', 'TV screen black, no signal', v_admin_id, v_omar_id, 'closed', 'normal', 20, NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- Unassigned Issues for Supervisor
INSERT INTO service_requests (org_id, room_id, request_type, category, title, description, reported_by, status, priority, estimated_time, created_at)
VALUES
(v_org_id, (SELECT id FROM rooms WHERE org_id = v_org_id AND room_number = '205'), 'breakdown', 'electrical', 'Light Bulb Replacement', 'Multiple light bulbs need replacement', v_admin_id, 'open', 'low', 10, NOW() - INTERVAL '1 hour'),
(v_org_id, (SELECT id FROM rooms WHERE org_id = v_org_id AND room_number = '304'), 'breakdown', 'plumbing', 'Toilet Running', 'Toilet continuously running water', v_admin_id, 'open', 'normal', 30, NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- =====================================================
-- INVENTORY DATA FOR INVENTORY MANAGER
-- =====================================================

-- Cleaning Supplies
INSERT INTO inventory_items (org_id, item_code, item_name_en, item_name_ar, category, current_stock, min_level, unit, unit_cost, location)
VALUES
(v_org_id, 'CLN-001', 'All-Purpose Cleaner', 'منظف متعدد الاستخدامات', 'cleaning_supplies', 45, 20, 'bottles', 15.50, 'Storage Room A'),
(v_org_id, 'CLN-002', 'Glass Cleaner', 'منظف زجاج', 'cleaning_supplies', 30, 15, 'bottles', 12.00, 'Storage Room A'),
(v_org_id, 'CLN-003', 'Bathroom Cleaner', 'منظف حمامات', 'cleaning_supplies', 55, 25, 'bottles', 18.00, 'Storage Room A'),
(v_org_id, 'CLN-004', 'Floor Cleaner', 'منظف أرضيات', 'cleaning_supplies', 8, 15, 'bottles', 22.00, 'Storage Room A'),
(v_org_id, 'CLN-005', 'Disinfectant Spray', 'رذاذ معقم', 'cleaning_supplies', 70, 30, 'bottles', 25.00, 'Storage Room A')
ON CONFLICT DO NOTHING;

-- Toiletries
INSERT INTO inventory_items (org_id, item_code, item_name_en, item_name_ar, category, current_stock, min_level, unit, unit_cost, location)
VALUES
(v_org_id, 'TOI-001', 'Shampoo Bottles (50ml)', 'زجاجات شامبو', 'toiletries', 250, 100, 'pieces', 2.50, 'Storage Room B'),
(v_org_id, 'TOI-002', 'Conditioner Bottles (50ml)', 'زجاجات بلسم', 'toiletries', 230, 100, 'pieces', 2.50, 'Storage Room B'),
(v_org_id, 'TOI-003', 'Body Soap (50g)', 'صابون', 'toiletries', 180, 100, 'pieces', 1.50, 'Storage Room B'),
(v_org_id, 'TOI-004', 'Toilet Paper Rolls', 'لفائف مناديل حمام', 'toiletries', 450, 200, 'rolls', 0.75, 'Storage Room B'),
(v_org_id, 'TOI-005', 'Tissue Boxes', 'علب مناديل', 'toiletries', 120, 80, 'boxes', 1.25, 'Storage Room B')
ON CONFLICT DO NOTHING;

-- Room Amenities
INSERT INTO inventory_items (org_id, item_code, item_name_en, item_name_ar, category, current_stock, min_level, unit, unit_cost, location)
VALUES
(v_org_id, 'AMN-001', 'Slippers (Pairs)', 'نعال', 'amenities', 85, 50, 'pairs', 3.00, 'Storage Room C'),
(v_org_id, 'AMN-002', 'Toothbrush Kit', 'طقم فرشاة أسنان', 'amenities', 95, 60, 'pieces', 2.00, 'Storage Room C'),
(v_org_id, 'AMN-003', 'Dental Kit', 'طقم أسنان', 'amenities', 110, 70, 'pieces', 2.50, 'Storage Room C'),
(v_org_id, 'AMN-004', 'Sewing Kit', 'طقم خياطة', 'amenities', 200, 100, 'pieces', 1.00, 'Storage Room C'),
(v_org_id, 'AMN-005', 'Coffee Capsules', 'كبسولات قهوة', 'amenities', 850, 400, 'pieces', 0.50, 'Storage Room C')
ON CONFLICT DO NOTHING;

-- =====================================================
-- LINEN INVENTORY FOR LAUNDRY MANAGER
-- =====================================================

INSERT INTO linen_items (org_id, linen_type, size, color, item_name_en, item_name_ar, total_stock, clean_stock, soiled_stock, in_laundry, damaged_stock, par_level, unit_cost, is_active)
VALUES
-- Bed Linens
(v_org_id, 'bedding', 'king', 'white', 'King Fitted Sheet', 'ملاءة سرير كينج', 80, 45, 18, 12, 5, 60, 25.00, true),
(v_org_id, 'bedding', 'king', 'white', 'King Flat Sheet', 'ملاءة مسطحة كينج', 80, 42, 20, 15, 3, 60, 22.00, true),
(v_org_id, 'bedding', 'queen', 'white', 'Queen Fitted Sheet', 'ملاءة سرير كوين', 120, 65, 30, 20, 5, 90, 22.00, true),
(v_org_id, 'bedding', 'queen', 'white', 'Queen Flat Sheet', 'ملاءة مسطحة كوين', 120, 62, 32, 22, 4, 90, 20.00, true),
(v_org_id, 'bedding', 'standard', 'white', 'Pillow Case', 'غطاء وسادة', 300, 180, 65, 45, 10, 250, 5.00, true),
(v_org_id, 'bedding', 'standard', 'white', 'Duvet Cover King', 'غطاء لحاف كينج', 70, 40, 15, 10, 5, 55, 45.00, true),
(v_org_id, 'bedding', 'standard', 'white', 'Duvet Cover Queen', 'غطاء لحاف كوين', 100, 55, 25, 15, 5, 80, 40.00, true),

-- Towels
(v_org_id, 'towel', 'large', 'white', 'Bath Towel', 'منشفة استحمام', 250, 140, 60, 40, 10, 200, 12.00, true),
(v_org_id, 'towel', 'medium', 'white', 'Hand Towel', 'منشفة يد', 200, 100, 50, 45, 5, 160, 8.00, true),
(v_org_id, 'towel', 'small', 'white', 'Face Towel', 'منشفة وجه', 180, 95, 45, 35, 5, 150, 6.00, true),
(v_org_id, 'towel', 'large', 'white', 'Bath Sheet', 'ملاءة استحمام كبيرة', 100, 55, 25, 15, 5, 80, 18.00, true),

-- Bath Mats
(v_org_id, 'bathmat', 'standard', 'white', 'Bath Mat', 'سجادة حمام', 90, 50, 20, 15, 5, 70, 15.00, true),

-- Special Items
(v_org_id, 'blanket', 'standard', 'beige', 'Extra Blanket', 'بطانية إضافية', 60, 35, 12, 10, 3, 50, 35.00, true),
(v_org_id, 'robe', 'standard', 'white', 'Bath Robe', 'روب استحمام', 80, 45, 18, 14, 3, 65, 45.00, true)
ON CONFLICT DO NOTHING;

-- Linen Transactions
INSERT INTO linen_transactions (org_id, linen_id, transaction_type, quantity, created_by, notes)
SELECT v_org_id, id, 'purchase', 50, v_laundry_id, 'Weekly restock delivery'
FROM linen_items WHERE org_id = v_org_id AND item_name_en = 'Bath Towel'
ON CONFLICT DO NOTHING;

INSERT INTO linen_transactions (org_id, linen_id, transaction_type, quantity, created_by, notes)
SELECT v_org_id, id, 'receive_laundry', 40, v_laundry_id, 'Morning batch cleaned'
FROM linen_items WHERE org_id = v_org_id AND item_name_en = 'Hand Towel'
ON CONFLICT DO NOTHING;

-- =====================================================
-- STAFF PERFORMANCE DATA (for Supervisor)
-- =====================================================

-- Recent task completions
INSERT INTO housekeeping_tasks (org_id, room_id, assigned_to, assigned_by, task_type, priority, status, scheduled_date, completed_at, notes)
SELECT v_org_id, r.id, v_fatima_id, v_supervisor_id, 'regular', 'normal', 'completed', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '25 minutes', 'Excellent work'
FROM rooms r WHERE r.org_id = v_org_id AND r.room_number IN ('106', '107', '108')
ON CONFLICT DO NOTHING;

INSERT INTO housekeeping_tasks (org_id, room_id, assigned_to, assigned_by, task_type, priority, status, scheduled_date, completed_at, notes)
SELECT v_org_id, r.id, v_ahmed_id, v_supervisor_id, 'regular', 'normal', 'completed', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '30 minutes', 'Good quality'
FROM rooms r WHERE r.org_id = v_org_id AND r.room_number IN ('206', '207')
ON CONFLICT DO NOTHING;

INSERT INTO housekeeping_tasks (org_id, room_id, assigned_to, assigned_by, task_type, priority, status, scheduled_date, completed_at, notes)
SELECT v_org_id, r.id, v_sara_id, v_supervisor_id, 'checkout', 'high', 'completed', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '1 day' + INTERVAL '45 minutes', 'Thorough cleaning'
FROM rooms r WHERE r.org_id = v_org_id AND r.room_number = '306'
ON CONFLICT DO NOTHING;

-- =====================================================
-- NOTIFICATIONS FOR ALL USERS
-- =====================================================

-- For Admin
IF v_admin_id IS NOT NULL THEN
  INSERT INTO notifications (org_id, user_id, title, message, type, category, is_read)
  VALUES
  (v_org_id, v_admin_id, 'Low Stock Alert', 'Floor Cleaner is below minimum stock level', 'warning', 'low_stock', false),
  (v_org_id, v_admin_id, 'Maintenance Request', 'Urgent AC repair needed in Room 101', 'info', 'service_request', false),
  (v_org_id, v_admin_id, 'Daily Report Ready', 'Yesterday performance report is available', 'info', 'report', true);
END IF;

-- For Supervisor
IF v_supervisor_id IS NOT NULL THEN
  INSERT INTO notifications (org_id, user_id, title, message, type, category, is_read)
  VALUES
  (v_org_id, v_supervisor_id, 'Task Assignment', '3 new tasks need assignment', 'info', 'task_assigned', false),
  (v_org_id, v_supervisor_id, 'Staff Performance', 'Fatima completed 8 tasks today - excellent performance', 'success', 'performance', true);
END IF;

-- For Inventory Manager
IF v_inventory_id IS NOT NULL THEN
  INSERT INTO notifications (org_id, user_id, title, message, type, category, is_read)
  VALUES
  (v_org_id, v_inventory_id, 'Reorder Alert', 'Floor Cleaner stock is critically low', 'warning', 'low_stock', false),
  (v_org_id, v_inventory_id, 'Stock Update', 'New shipment of toiletries arrived', 'info', 'inventory', true);
END IF;

-- For Laundry Manager
IF v_laundry_id IS NOT NULL THEN
  INSERT INTO notifications (org_id, user_id, title, message, type, category, is_read)
  VALUES
  (v_org_id, v_laundry_id, 'Low Par Level', 'Bath Towels approaching minimum par level', 'warning', 'par_level', false),
  (v_org_id, v_laundry_id, 'Batch Complete', '40 items finished in industrial washer', 'success', 'laundry', true);
END IF;

-- For Staff
IF v_fatima_id IS NOT NULL THEN
  INSERT INTO notifications (org_id, user_id, title, message, type, category, is_read)
  VALUES
  (v_org_id, v_fatima_id, 'New Task Assigned', 'Checkout cleaning for Room 105 - Due: 2 hours', 'info', 'task', false);
END IF;

IF v_ahmed_id IS NOT NULL THEN
  INSERT INTO notifications (org_id, user_id, title, message, type, category, is_read)
  VALUES
  (v_org_id, v_ahmed_id, 'VIP Guest', 'Room 205 is for VIP guest - deep clean required', 'info', 'vip_guest', false);
END IF;

IF v_sara_id IS NOT NULL THEN
  INSERT INTO notifications (org_id, user_id, title, message, type, category, is_read)
  VALUES
  (v_org_id, v_sara_id, 'Task Complete', 'Great job on Room 301 inspection!', 'success', 'kudos', true);
END IF;

-- For Maintenance
IF v_ali_id IS NOT NULL THEN
  INSERT INTO notifications (org_id, user_id, title, message, type, category, is_read)
  VALUES
  (v_org_id, v_ali_id, 'Urgent Request', 'AC breakdown in Room 101 - Guest complaining', 'warning', 'service_request', false);
END IF;

IF v_omar_id IS NOT NULL THEN
  INSERT INTO notifications (org_id, user_id, title, message, type, category, is_read)
  VALUES
  (v_org_id, v_omar_id, 'Parts Arrived', 'Replacement parts for Room 204 AC available', 'info', 'parts', true);
END IF;

END $$;

-- =====================================================
-- SUMMARY REPORT
-- =====================================================

SELECT 'TEST DATA SUMMARY' as report;

SELECT 'Housekeeping Tasks by Staff:' as category;
SELECT 
  u.full_name,
  u.role,
  COUNT(CASE WHEN ht.status = 'pending' THEN 1 END) as pending_tasks,
  COUNT(CASE WHEN ht.status = 'in_progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN ht.status = 'completed' THEN 1 END) as completed
FROM users u
LEFT JOIN housekeeping_tasks ht ON u.id = ht.assigned_to
WHERE u.role = 'staff'
GROUP BY u.full_name, u.role;

SELECT 'Service Requests by Maintenance Staff:' as category;
SELECT 
  u.full_name,
  u.role,
  COUNT(CASE WHEN sr.status IN ('assigned', 'open') THEN 1 END) as open_requests,
  COUNT(CASE WHEN sr.status = 'in_progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN sr.status IN ('resolved', 'closed') THEN 1 END) as resolved
FROM users u
LEFT JOIN service_requests sr ON u.id = sr.assigned_to
WHERE u.role = 'maintenance'
GROUP BY u.full_name, u.role;

SELECT 'Inventory Items by Category:' as category;
SELECT 
  category,
  COUNT(*) as total_items,
  SUM(current_stock) as total_stock,
  COUNT(CASE WHEN current_stock < min_level THEN 1 END) as low_stock_items
FROM inventory_items
GROUP BY category;

SELECT 'Linen Items Summary:' as category;
SELECT 
  linen_type,
  COUNT(*) as item_count,
  SUM(total_stock) as total_pieces,
  SUM(clean_stock) as clean,
  SUM(soiled_stock) as soiled,
  SUM(in_laundry) as in_laundry,
  SUM(damaged_stock) as damaged
FROM linen_items
GROUP BY linen_type;

SELECT '✅ Test data added successfully for all users!' as status;
