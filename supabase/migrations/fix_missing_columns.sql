-- Fix Missing Columns Across All Tables
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ROOMS TABLE - Add missing columns
-- ============================================
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS bed_type VARCHAR(50) DEFAULT 'twin';

ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS max_occupancy INTEGER DEFAULT 2;

ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS rate_per_night DECIMAL(10,2) DEFAULT 0;

-- Update existing rooms with appropriate bed_type based on room_type
UPDATE rooms 
SET bed_type = CASE
  WHEN room_type = 'suite' OR room_type = 'executive' OR room_type = 'presidential' THEN 'king'
  WHEN room_type = 'deluxe' THEN 'queen'
  ELSE 'twin'
END
WHERE bed_type = 'twin';

-- Update max_occupancy based on bed_type
UPDATE rooms 
SET max_occupancy = CASE
  WHEN bed_type = 'king' THEN 3
  WHEN bed_type = 'queen' THEN 2
  WHEN bed_type IN ('double', 'twin') THEN 2
  WHEN bed_type = 'single' THEN 1
  ELSE 2
END
WHERE max_occupancy = 2;

-- ============================================
-- 2. USERS TABLE - Check role constraints
-- ============================================
-- Update role check constraint to include all roles used in the app
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('super_admin', 'admin', 'supervisor', 'staff', 'housekeeping', 'laundry', 'maintenance', 'inventory', 'front_desk'));

-- Add phone_number column if it doesn't exist (some forms use phone, some use phone_number)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Copy phone to phone_number if phone_number is null
UPDATE users 
SET phone_number = phone 
WHERE phone_number IS NULL AND phone IS NOT NULL;

-- ============================================
-- 3. HOUSEKEEPING_TASKS - Add missing task_type values
-- ============================================
ALTER TABLE housekeeping_tasks DROP CONSTRAINT IF EXISTS housekeeping_tasks_task_type_check;
ALTER TABLE housekeeping_tasks 
ADD CONSTRAINT housekeeping_tasks_task_type_check 
CHECK (task_type IN ('regular', 'checkout', 'deep_clean', 'deep_cleaning', 'inspection', 'turndown', 'cleaning'));

-- Add title column if missing
ALTER TABLE housekeeping_tasks 
ADD COLUMN IF NOT EXISTS title VARCHAR(200);

-- Update title for existing records
UPDATE housekeeping_tasks 
SET title = CONCAT('Room ', (SELECT room_number FROM rooms WHERE rooms.id = housekeeping_tasks.room_id), ' - ', task_type)
WHERE title IS NULL;

-- ============================================
-- 4. SERVICE_REQUESTS - Add missing columns
-- ============================================
ALTER TABLE service_requests 
ADD COLUMN IF NOT EXISTS breakdown_category VARCHAR(50);

ALTER TABLE service_requests 
ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'normal';

ALTER TABLE service_requests 
ADD COLUMN IF NOT EXISTS is_medical_emergency BOOLEAN DEFAULT FALSE;

-- ============================================
-- 5. INVENTORY_ITEMS - Ensure all fields exist
-- ============================================
-- Add notes field if missing
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- 6. LINEN_ITEMS - Add missing fields
-- ============================================
ALTER TABLE linen_items 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Drop the constraint that prevents simple updates
ALTER TABLE linen_items DROP CONSTRAINT IF EXISTS linen_stock_balance;

-- ============================================
-- 7. Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_rooms_bed_type ON rooms(bed_type);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(org_id, role);
CREATE INDEX IF NOT EXISTS idx_tasks_title ON housekeeping_tasks USING gin(to_tsvector('english', title));

-- ============================================
-- 8. Add updated_at trigger for all tables
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_housekeeping_tasks_updated_at ON housekeeping_tasks;
CREATE TRIGGER update_housekeeping_tasks_updated_at BEFORE UPDATE ON housekeeping_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_requests_updated_at ON service_requests;
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON service_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON inventory_items;
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_linen_items_updated_at ON linen_items;
CREATE TRIGGER update_linen_items_updated_at BEFORE UPDATE ON linen_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the migration worked:

-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'rooms' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'housekeeping_tasks' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'service_requests' ORDER BY ordinal_position;
