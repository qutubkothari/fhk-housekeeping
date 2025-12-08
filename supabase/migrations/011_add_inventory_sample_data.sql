-- Add sample inventory items
INSERT INTO inventory_items (
  org_id, item_code, item_name_en, item_name_ar, category, unit, 
  current_stock, min_level, reorder_level, max_level, unit_cost, location, supplier
) VALUES
-- Consumables
('00000000-0000-0000-0000-000000000001', 'CONS-001', 'Paper Towels', 'مناديل ورقية', 'consumables', 'rolls', 45, 20, 30, 100, 2.50, 'Storage Room A', 'ABC Suppliers'),
('00000000-0000-0000-0000-000000000001', 'CONS-002', 'Toilet Paper', 'ورق تواليت', 'consumables', 'rolls', 85, 30, 50, 200, 1.20, 'Storage Room A', 'ABC Suppliers'),
('00000000-0000-0000-0000-000000000001', 'CONS-003', 'Trash Bags (Large)', 'أكياس قمامة كبيرة', 'consumables', 'boxes', 12, 5, 10, 30, 15.00, 'Storage Room A', 'CleanPro Ltd'),
('00000000-0000-0000-0000-000000000001', 'CONS-004', 'Trash Bags (Small)', 'أكياس قمامة صغيرة', 'consumables', 'boxes', 8, 5, 10, 30, 12.00, 'Storage Room A', 'CleanPro Ltd'),

-- Cleaning Supplies
('00000000-0000-0000-0000-000000000001', 'CLEAN-001', 'All-Purpose Cleaner', 'منظف متعدد الاستخدامات', 'cleaning_supplies', 'liters', 18, 10, 15, 50, 8.50, 'Storage Room B', 'CleanPro Ltd'),
('00000000-0000-0000-0000-000000000001', 'CLEAN-002', 'Glass Cleaner', 'منظف زجاج', 'cleaning_supplies', 'liters', 22, 10, 15, 40, 6.75, 'Storage Room B', 'CleanPro Ltd'),
('00000000-0000-0000-0000-000000000001', 'CLEAN-003', 'Bathroom Cleaner', 'منظف حمامات', 'cleaning_supplies', 'liters', 15, 8, 12, 40, 9.25, 'Storage Room B', 'CleanPro Ltd'),
('00000000-0000-0000-0000-000000000001', 'CLEAN-004', 'Floor Disinfectant', 'مطهر أرضيات', 'cleaning_supplies', 'liters', 5, 10, 15, 50, 12.00, 'Storage Room B', 'CleanPro Ltd'),
('00000000-0000-0000-0000-000000000001', 'CLEAN-005', 'Microfiber Cloths', 'قطع قماش من الألياف الدقيقة', 'cleaning_supplies', 'pcs', 35, 20, 30, 100, 3.50, 'Storage Room B', 'CleanPro Ltd'),
('00000000-0000-0000-0000-000000000001', 'CLEAN-006', 'Mop Heads', 'رؤوس ممسحة', 'cleaning_supplies', 'pcs', 8, 5, 10, 25, 12.50, 'Storage Room B', 'CleanPro Ltd'),

-- Amenities
('00000000-0000-0000-0000-000000000001', 'AMEN-001', 'Coffee Sachets', 'أكياس قهوة', 'amenities', 'boxes', 25, 10, 15, 50, 18.00, 'Storage Room C', 'Hospitality Plus'),
('00000000-0000-0000-0000-000000000001', 'AMEN-002', 'Tea Bags', 'أكياس شاي', 'amenities', 'boxes', 30, 10, 15, 50, 15.00, 'Storage Room C', 'Hospitality Plus'),
('00000000-0000-0000-0000-000000000001', 'AMEN-003', 'Sugar Sachets', 'أكياس سكر', 'amenities', 'boxes', 20, 8, 12, 40, 8.50, 'Storage Room C', 'Hospitality Plus'),
('00000000-0000-0000-0000-000000000001', 'AMEN-004', 'Water Bottles (500ml)', 'زجاجات ماء', 'amenities', 'boxes', 0, 20, 30, 100, 12.00, 'Storage Room C', 'Hospitality Plus'),
('00000000-0000-0000-0000-000000000001', 'AMEN-005', 'Slippers (Disposable)', 'نعال يمكن التخلص منها', 'amenities', 'pcs', 45, 30, 50, 150, 1.25, 'Storage Room C', 'Hospitality Plus'),

-- Toiletries
('00000000-0000-0000-0000-000000000001', 'TOIL-001', 'Shampoo Bottles (50ml)', 'زجاجات شامبو', 'toiletries', 'bottles', 65, 40, 60, 200, 1.80, 'Storage Room D', 'Guest Care Co'),
('00000000-0000-0000-0000-000000000001', 'TOIL-002', 'Conditioner Bottles (50ml)', 'زجاجات بلسم', 'toiletries', 'bottles', 60, 40, 60, 200, 1.90, 'Storage Room D', 'Guest Care Co'),
('00000000-0000-0000-0000-000000000001', 'TOIL-003', 'Body Wash Bottles (50ml)', 'زجاجات غسول الجسم', 'toiletries', 'bottles', 58, 40, 60, 200, 2.10, 'Storage Room D', 'Guest Care Co'),
('00000000-0000-0000-0000-000000000001', 'TOIL-004', 'Hand Soap Bars', 'قطع صابون لليدين', 'toiletries', 'pcs', 72, 50, 75, 250, 0.85, 'Storage Room D', 'Guest Care Co'),
('00000000-0000-0000-0000-000000000001', 'TOIL-005', 'Dental Kits', 'أطقم عناية بالأسنان', 'toiletries', 'sets', 48, 30, 50, 150, 1.50, 'Storage Room D', 'Guest Care Co'),
('00000000-0000-0000-0000-000000000001', 'TOIL-006', 'Shower Caps', 'قبعات استحمام', 'toiletries', 'pcs', 95, 50, 75, 250, 0.35, 'Storage Room D', 'Guest Care Co'),

-- Equipment
('00000000-0000-0000-0000-000000000001', 'EQUIP-001', 'Vacuum Cleaner Bags', 'أكياس مكنسة كهربائية', 'equipment', 'pcs', 15, 10, 15, 40, 4.50, 'Equipment Room', 'TechClean'),
('00000000-0000-0000-0000-000000000001', 'EQUIP-002', 'Spray Bottles (500ml)', 'زجاجات رش', 'equipment', 'pcs', 12, 8, 12, 30, 2.25, 'Equipment Room', 'TechClean'),
('00000000-0000-0000-0000-000000000001', 'EQUIP-003', 'Cleaning Gloves (Pairs)', 'قفازات تنظيف', 'equipment', 'pcs', 25, 15, 20, 60, 1.75, 'Equipment Room', 'TechClean')
ON CONFLICT DO NOTHING;

-- Add some sample transactions
INSERT INTO inventory_transactions (
  org_id, item_id, transaction_type, quantity, balance_after, notes, created_by, created_at
)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  i.id,
  'receipt',
  100,
  i.current_stock,
  'Initial stock receipt',
  (SELECT id FROM users WHERE email = 'admin@demohotel.com'),
  NOW() - INTERVAL '30 days'
FROM inventory_items i
WHERE i.org_id = '00000000-0000-0000-0000-000000000001' 
  AND i.item_code IN ('CONS-001', 'CLEAN-001', 'AMEN-001')
ON CONFLICT DO NOTHING;

INSERT INTO inventory_transactions (
  org_id, item_id, transaction_type, quantity, balance_after, notes, created_by, created_at
)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  i.id,
  'issue',
  25,
  i.current_stock,
  'Issued to housekeeping',
  (SELECT id FROM users WHERE email = 'admin@demohotel.com'),
  NOW() - INTERVAL '7 days'
FROM inventory_items i
WHERE i.org_id = '00000000-0000-0000-0000-000000000001' 
  AND i.item_code IN ('TOIL-001', 'TOIL-002')
ON CONFLICT DO NOTHING;
