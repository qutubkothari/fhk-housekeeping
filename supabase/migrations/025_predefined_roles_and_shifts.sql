-- =====================================================
-- MIGRATION 025: PREDEFINED ROLES AND SHIFTS
-- Date: December 17, 2025
-- =====================================================

-- PREDEFINED EMPLOYEE ROLES (from client requirements)
-- =====================================================
-- The following roles should be used in the Staff Management UI:
--
-- 1. Passages East & West Cleaning
-- 2. Rooms Cleaning
-- 3. Washroom Cleaning
-- 4. Lobby Area Cleaning
-- 5. Supervisor
-- 6. MST
-- 7. Linen Attendant
-- 8. Front Desk
-- 9. Store
--
-- These roles are stored in the 'job_role' column of the 'users' table as strings.
-- IMPORTANT: 'users.role' is reserved for system permissions (admin/staff/maintenance/etc).

-- PREDEFINED SHIFT TIMINGS (from client requirements)
-- =====================================================
-- The following shifts should be created via the Shift Master UI or seeded:
--
-- Shift 1: 2 PM - 9 PM (7 hrs)
-- Shift 2: 3 PM - 11 PM (8 hrs)
-- Shift 3: 5 PM - 1 AM (8 hrs)
-- Shift 4: 7 AM - 12 PM / 2 PM - 5 PM (8 hrs split)
-- Shift 5: 7 AM - 12 PM / 3 PM - 6 PM (8 hrs split)
-- Shift 6: 7 AM - 12 PM / 3 PM - 6 PM (8 hrs split)
-- Shift 7: 7 AM - 2 PM (7 hrs)
-- Shift 8: 7 AM - 3 PM (8 hrs)
-- Shift 9: 8 AM - 8 PM / 3 PM - 7 PM (9 hrs split)
-- Shift 10: 8 AM - 12 PM / 3 PM - 8 PM (9 hrs)
-- Shift 11: 9 AM - 1 PM / 3 PM - 5 PM (6 hrs split)
--
-- These are stored in the 'shifts' table with:
-- - name: Display name (e.g., "2 PM - 9 PM")
-- - code: Unique code (e.g., "SHIFT-1")
-- - start_time: Start time in HH:MM format
-- - end_time: End time in HH:MM format
-- - color: UI display color
-- - is_active: Active status

-- ROOM ASSIGNMENT WORKFLOW
-- =====================================================
-- Room assignments are handled through the Bulk Assignment module:
--
-- 1. Select Rooms (by floor, status, etc.)
-- 2. Select Activities (cleaning tasks)
-- 3. Select Staff (based on role, location, shift)
-- 4. Configure assignment details
--
-- On selection of rooms, the following assignments will be created:
-- - Rooms Cleaning
-- - Washroom Cleaning
--
-- These are automatically linked to the room_assignments and activity_assignments tables.

-- Ensure users.job_role column exists for the client-required job roles
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS job_role VARCHAR(100);

COMMENT ON COLUMN users.job_role IS 'Job role (client): Passages East & West Cleaning, Rooms Cleaning, Washroom Cleaning, Lobby Area Cleaning, Supervisor, MST, Linen Attendant, Front Desk, Store';

-- Ensure shifts table exists (already created in previous migrations)
-- No additional schema changes needed - shifts table is already complete

-- Add index for faster job role filtering
CREATE INDEX IF NOT EXISTS idx_users_job_role ON users(job_role);

-- Done! Use the Shift Master UI "Seed Shifts" button to populate predefined shifts.
