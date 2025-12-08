-- Update user roles to new structure
-- Desktop Dashboard Users: super_admin, inventory, laundry
-- Mobile Users: supervisor, staff, maintenance

-- Update admin user to super_admin
UPDATE users 
SET role = 'super_admin' 
WHERE email = 'admin@demohotel.com';

-- Laundry user stays the same (already exists)
-- UPDATE users SET role = 'laundry' WHERE email = 'laundry@demohotel.com';

-- Add new inventory user (if doesn't exist)
INSERT INTO users (id, email, full_name, role, org_id, phone, created_at)
VALUES (
  'inv-user-001',
  'inventory@demohotel.com',
  'Hassan Inventory',
  'inventory',
  '00000000-0000-0000-0000-000000000001',
  '+971-50-123-4567',
  NOW()
)
ON CONFLICT (email) DO UPDATE 
SET role = 'inventory', full_name = 'Hassan Inventory';

-- Staff users remain unchanged (ahmed, fatima, sara, mohammed)
-- Supervisor remains unchanged
-- Maintenance users remain unchanged (maintenance@demohotel.com, technician@demohotel.com)

-- Verify the updates
SELECT email, full_name, role, org_id 
FROM users 
ORDER BY 
  CASE role 
    WHEN 'super_admin' THEN 1
    WHEN 'inventory' THEN 2
    WHEN 'laundry' THEN 3
    WHEN 'supervisor' THEN 4
    WHEN 'staff' THEN 5
    WHEN 'maintenance' THEN 6
    ELSE 7
  END, email;
