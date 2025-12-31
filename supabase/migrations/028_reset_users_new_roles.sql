-- Migration: Reset users and create new role-based users
-- Date: 2025-12-31
-- Description: Delete all existing users and create new users based on updated role requirements

-- Delete all existing users
DELETE FROM activity_assignments;
DELETE FROM room_assignments;
DELETE FROM service_requests;
DELETE FROM housekeeping_tasks;
DELETE FROM users;

-- Reset sequence if needed
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;

-- Create new users with proper roles and phone numbers
-- All passwords are hashed version of 'password123' for consistency
-- Password hash: $2a$10$rZ5LY0JxbLVjK6CqPvZ7Ye9YWJXvCW1u0bXPT5VZvGjR1ZQ8nJGFu

-- 1. Admin (Desktop)
INSERT INTO users (
  id, 
  name, 
  email, 
  phone, 
  phone_number,
  role, 
  password_hash,
  organization_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'Admin User',
  'admin@fhk.local',
  '966501234567',
  '966501234567',
  'admin',
  '$2a$10$rZ5LY0JxbLVjK6CqPvZ7Ye9YWJXvCW1u0bXPT5VZvGjR1ZQ8nJGFu',
  'fhk-hotel-001',
  NOW()
);

-- 2. Supervisor (Mobile) - Khalid Al-Rashid
INSERT INTO users (
  id, 
  name, 
  email, 
  phone, 
  phone_number,
  role, 
  password_hash,
  organization_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'Khalid Al-Rashid',
  'khalid@fhk.local',
  '966505678901',
  '966505678901',
  'supervisor',
  '$2a$10$rZ5LY0JxbLVjK6CqPvZ7Ye9YWJXvCW1u0bXPT5VZvGjR1ZQ8nJGFu',
  'fhk-hotel-001',
  NOW()
);

-- 3. Staff (Fatima)
INSERT INTO users (
  id, 
  name, 
  email, 
  phone, 
  phone_number,
  role, 
  password_hash,
  organization_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'Fatima Ali',
  'fatima@fhk.local',
  '966502345678',
  '966502345678',
  'staff',
  '$2a$10$rZ5LY0JxbLVjK6CqPvZ7Ye9YWJXvCW1u0bXPT5VZvGjR1ZQ8nJGFu',
  'fhk-hotel-001',
  NOW()
);

-- 4. Staff (Mohammed)
INSERT INTO users (
  id, 
  name, 
  email, 
  phone, 
  phone_number,
  role, 
  password_hash,
  organization_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'Mohammed Ibrahim',
  'mohammed@fhk.local',
  '966503456789',
  '966503456789',
  'staff',
  '$2a$10$rZ5LY0JxbLVjK6CqPvZ7Ye9YWJXvCW1u0bXPT5VZvGjR1ZQ8nJGFu',
  'fhk-hotel-001',
  NOW()
);

-- 5. Staff (Sara)
INSERT INTO users (
  id, 
  name, 
  email, 
  phone, 
  phone_number,
  role, 
  password_hash,
  organization_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'Sara Abdullah',
  'sara@fhk.local',
  '966504567890',
  '966504567890',
  'staff',
  '$2a$10$rZ5LY0JxbLVjK6CqPvZ7Ye9YWJXvCW1u0bXPT5VZvGjR1ZQ8nJGFu',
  'fhk-hotel-001',
  NOW()
);

-- 6. Laundry (Mariam)
INSERT INTO users (
  id, 
  name, 
  email, 
  phone, 
  phone_number,
  role, 
  password_hash,
  organization_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'Mariam Ahmed',
  'mariam@fhk.local',
  '966508901234',
  '966508901234',
  'laundry',
  '$2a$10$rZ5LY0JxbLVjK6CqPvZ7Ye9YWJXvCW1u0bXPT5VZvGjR1ZQ8nJGFu',
  'fhk-hotel-001',
  NOW()
);

-- 7. Inventory Manager
INSERT INTO users (
  id, 
  name, 
  email, 
  phone, 
  phone_number,
  role, 
  password_hash,
  organization_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'Inventory Manager',
  'inventory@fhk.local',
  '966501111111',
  '966501111111',
  'inventory',
  '$2a$10$rZ5LY0JxbLVjK6CqPvZ7Ye9YWJXvCW1u0bXPT5VZvGjR1ZQ8nJGFu',
  'fhk-hotel-001',
  NOW()
);

-- 8. Maintenance (Ali Hassan)
INSERT INTO users (
  id, 
  name, 
  email, 
  phone, 
  phone_number,
  role, 
  password_hash,
  organization_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'Ali Hassan',
  'ali@fhk.local',
  '966506789012',
  '966506789012',
  'maintenance',
  '$2a$10$rZ5LY0JxbLVjK6CqPvZ7Ye9YWJXvCW1u0bXPT5VZvGjR1ZQ8nJGFu',
  'fhk-hotel-001',
  NOW()
);

-- 9. Technician (Omar)
INSERT INTO users (
  id, 
  name, 
  email, 
  phone, 
  phone_number,
  role, 
  password_hash,
  organization_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'Omar Al-Sayed',
  'omar@fhk.local',
  '966507890123',
  '966507890123',
  'maintenance',
  '$2a$10$rZ5LY0JxbLVjK6CqPvZ7Ye9YWJXvCW1u0bXPT5VZvGjR1ZQ8nJGFu',
  'fhk-hotel-001',
  NOW()
);

-- Verify users created
SELECT 
  name,
  phone,
  role,
  email
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
  name;

-- Summary
SELECT 
  role,
  COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;
