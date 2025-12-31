-- ============================================
-- RESET USERS - RUN THIS IN SUPABASE SQL EDITOR
-- ============================================
-- Instructions:
-- 1. Go to: https://supabase.com/dashboard/project/oglmyyyhfwuhyghcbnmi/sql/new
-- 2. Copy and paste this entire file
-- 3. Click "Run" button
-- ============================================

-- ============================================
-- STEP 1: Delete all dependent data
-- ============================================
-- This must be done in order to respect foreign key constraints

-- 1. Delete GRN items (depends on GRN and purchase invoices)
DELETE FROM grn_items;

-- 2. Delete Goods Received Notes (depends on purchase invoices and users)
DELETE FROM goods_received_notes;

-- 3. Delete Purchase Invoice Items
DELETE FROM purchase_invoice_items;

-- 4. Delete Purchase Invoices (has created_by FK to users)
DELETE FROM purchase_invoices;

-- 5. Delete Substore Transfers (has transferred_by FK to users)
DELETE FROM substore_transfers;

-- 6. Delete Substores (has manager_id FK to users)
DELETE FROM substores;

-- 7. Delete Work Sessions (has staff_id FK to users)
DELETE FROM work_sessions;

-- 8. Delete Store Transactions (if exists, references users)
DELETE FROM store_transactions WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_transactions');

-- 9. Delete Asset Maintenance (if exists, references users)
DELETE FROM asset_maintenance WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asset_maintenance');

-- 10. Delete Activity Assignments (part of activity system)
DELETE FROM activity_assignments;

-- 11. Delete Room Assignments (has assigned_by FK to users)
DELETE FROM room_assignments;

-- 12. Delete Inventory Transactions (has created_by FK RESTRICT to users)
DELETE FROM inventory_transactions;

-- 13. Delete Linen Transactions (has created_by FK RESTRICT to users)
DELETE FROM linen_transactions;

-- 14. Delete Service Requests (has reported_by FK RESTRICT to users)
DELETE FROM service_requests;

-- 15. Delete Housekeeping Tasks
DELETE FROM housekeeping_tasks;

-- 16. Delete Audit Logs (references users)
DELETE FROM audit_logs;

-- 17. Delete Notifications (CASCADE delete, but let's be explicit)
DELETE FROM notifications;

-- 18. Finally, delete all users
DELETE FROM users;

-- Reset sequence if needed
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;

-- ============================================
-- CREATE NEW USERS
-- Password for all users: password123
-- ============================================

-- 1. Admin (Desktop) - 966501234567
INSERT INTO users (
  id, 
  full_name,
  full_name_ar, 
  email, 
  phone, 
  phone_number,
  role, 
  password_hash,
  org_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'Admin User',
  'مستخدم الإدارة',
  'admin@fhk.local',
  '966501234567',
  '966501234567',
  'admin',
  '$2a$10$rZ5LY0JxbLVjK6CqPvZ7Ye9YWJXvCW1u0bXPT5VZvGjR1ZQ8nJGFu',
  '00000000-0000-0000-0000-000000000001',
  NOW()
);

-- 2. Supervisor (Mobile) - 966505678901
-- Functions: Monitor Assignments, Perform Bulk Assignments, Rooms Management
INSERT INTO users (
  id, 
  full_name,
  full_name_ar, 
  email, 
  phone, 
  phone_number,
  role, 
  password_hash,
  org_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'Khalid Al-Rashid',
  'خالد الراشد',
  'khalid@fhk.local',
  '966505678901',
  '966505678901',
  'supervisor',
  '$2a$10$rZ5LY0JxbLVjK6CqPvZ7Ye9YWJXvCW1u0bXPT5VZvGjR1ZQ8nJGFu',
  '00000000-0000-0000-0000-000000000001',
  NOW()
);

-- 3. Staff (Fatima) - 966502345678
-- Functions: Housekeeping Activities (Start, Complete, Return Soiled)
INSERT INTO users (
  id, 
  full_name,
  full_name_ar, 
  email, 
  phone, 
  phone_number,
  role, 
  password_hash,
  org_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'Fatima Ali',
  'فاطمة علي',
  'fatima@fhk.local',
  '966502345678',
  '966502345678',
  'staff',
  '$2a$10$rZ5LY0JxbLVjK6CqPvZ7Ye9YWJXvCW1u0bXPT5VZvGjR1ZQ8nJGFu',
  '00000000-0000-0000-0000-000000000001',
  NOW()
);

-- 4. Staff (Mohammed) - 966503456789
INSERT INTO users (
  id, 
  full_name,
  full_name_ar, 
  email, 
  phone, 
  phone_number,
  role, 
  password_hash,
  org_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'Mohammed Ibrahim',
  'محمد إبراهيم',
  'mohammed@fhk.local',
  '966503456789',
  '966503456789',
  'staff',
  '$2a$10$rZ5LY0JxbLVjK6CqPvZ7Ye9YWJXvCW1u0bXPT5VZvGjR1ZQ8nJGFu',
  '00000000-0000-0000-0000-000000000001',
  NOW()
);

-- 5. Staff (Sara) - 966504567890
INSERT INTO users (
  id, 
  full_name,
  full_name_ar, 
  email, 
  phone, 
  phone_number,
  role, 
  password_hash,
  org_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'Sara Abdullah',
  'سارة عبدالله',
  'sara@fhk.local',
  '966504567890',
  '966504567890',
  'staff',
  '$2a$10$rZ5LY0JxbLVjK6CqPvZ7Ye9YWJXvCW1u0bXPT5VZvGjR1ZQ8nJGFu',
  '00000000-0000-0000-0000-000000000001',
  NOW()
);

-- 6. Laundry (Mariam) - 966508901234
-- Functions: Linen Management, Issue Clean, Return Soiled, Send to Laundry, 
--            Return from Laundry, Mark Damaged, Purchase
INSERT INTO users (
  id, 
  full_name,
  full_name_ar, 
  email, 
  phone, 
  phone_number,
  role, 
  password_hash,
  org_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'Mariam Ahmed',
  'مريم أحمد',
  'mariam@fhk.local',
  '966508901234',
  '966508901234',
  'laundry',
  '$2a$10$rZ5LY0JxbLVjK6CqPvZ7Ye9YWJXvCW1u0bXPT5VZvGjR1ZQ8nJGFu',
  '00000000-0000-0000-0000-000000000001',
  NOW()
);

-- 7. Inventory Manager - 966501111111
-- Functions: Items Management, Issues to Staff
INSERT INTO users (
  id, 
  full_name,
  full_name_ar, 
  email, 
  phone, 
  phone_number,
  role, 
  password_hash,
  org_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'Inventory Manager',
  'مدير المخزون',
  'inventory@fhk.local',
  '966501111111',
  '966501111111',
  'inventory',
  '$2a$10$rZ5LY0JxbLVjK6CqPvZ7Ye9YWJXvCW1u0bXPT5VZvGjR1ZQ8nJGFu',
  '00000000-0000-0000-0000-000000000001',
  NOW()
);

-- 8. Maintenance (Ali Hassan) - 966506789012
-- Functions: Service Request Management
INSERT INTO users (
  id, 
  full_name,
  full_name_ar, 
  email, 
  phone, 
  phone_number,
  role, 
  password_hash,
  org_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'Ali Hassan',
  'علي حسن',
  'ali@fhk.local',
  '966506789012',
  '966506789012',
  'maintenance',
  '$2a$10$rZ5LY0JxbLVjK6CqPvZ7Ye9YWJXvCW1u0bXPT5VZvGjR1ZQ8nJGFu',
  '00000000-0000-0000-0000-000000000001',
  NOW()
);

-- 9. Technician (Omar) - 966507890123
-- Functions: Service Request Management
INSERT INTO users (
  id, 
  full_name,
  full_name_ar, 
  email, 
  phone, 
  phone_number,
  role, 
  password_hash,
  org_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'Omar Al-Sayed',
  'عمر السيد',
  'omar@fhk.local',
  '966507890123',
  '966507890123',
  'maintenance',
  '$2a$10$rZ5LY0JxbLVjK6CqPvZ7Ye9YWJXvCW1u0bXPT5VZvGjR1ZQ8nJGFu',
  '00000000-0000-0000-0000-000000000001',
  NOW()
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Show all created users
SELECT 
  full_name,
  full_name_ar,
  phone,
  role,
  email,
  created_at
FROM users
ORDER BY 
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'supervisor' THEN 2
    WHEN 'staff' THEN 3
    WHEN 'laundry' THEN 4
    WHEN 'inventory' THEN 5
    WHEN 'maintenance' THEN 6
    ELSE 7
  END,
  full_name;

-- Count by role
SELECT 
  role,
  COUNT(*) as user_count
FROM users
GROUP BY role
ORDER BY role;

-- ============================================
-- LOGIN CREDENTIALS
-- ============================================
-- All users can login with:
-- Phone: (their phone number - digits only, no spaces)
-- Password: password123
-- ============================================
