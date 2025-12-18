-- Migration: Create Master Data Tables (Locations, Shifts)
-- Date: 2025-12-13
-- Purpose: Foundation for activity-based housekeeping system

-- =====================================================
-- LOCATION MASTER
-- =====================================================
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  location_type VARCHAR(50) NOT NULL, -- 'floor', 'wing', 'section', 'area'
  parent_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT locations_org_code_unique UNIQUE (org_id, code)
);

-- Index for hierarchical queries
CREATE INDEX IF NOT EXISTS idx_locations_parent ON locations(parent_location_id);
CREATE INDEX IF NOT EXISTS idx_locations_org_active ON locations(org_id, is_active);

-- =====================================================
-- SHIFT MASTER
-- =====================================================
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  color VARCHAR(20), -- For UI display
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT shifts_org_code_unique UNIQUE (org_id, code)
);

CREATE INDEX IF NOT EXISTS idx_shifts_org_active ON shifts(org_id, is_active);

-- =====================================================
-- UPDATE USERS TABLE - Add Location and Shift Mapping
-- =====================================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_location ON users(location_id);
CREATE INDEX IF NOT EXISTS idx_users_shift ON users(shift_id);

-- =====================================================
-- UPDATE ROOMS TABLE - Add Location Mapping
-- =====================================================
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_rooms_location ON rooms(location_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Locations
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view locations in their org" ON locations
  FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage locations" ON locations
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Shifts
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shifts in their org" ON shifts
  FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage shifts" ON shifts
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================
-- Uncomment to insert sample data for testing
/*
-- Sample Shifts
INSERT INTO shifts (org_id, name, code, start_time, end_time, color) VALUES
((SELECT id FROM organizations LIMIT 1), 'Morning Shift', 'MS', '07:00:00', '15:00:00', '#3b82f6'),
((SELECT id FROM organizations LIMIT 1), 'Evening Shift', 'ES', '15:00:00', '23:00:00', '#f59e0b'),
((SELECT id FROM organizations LIMIT 1), 'Night Shift', 'NS', '23:00:00', '07:00:00', '#8b5cf6');

-- Sample Locations
INSERT INTO locations (org_id, name, code, location_type, description) VALUES
((SELECT id FROM organizations LIMIT 1), 'Ground Floor', 'GF', 'floor', 'Ground floor rooms and facilities'),
((SELECT id FROM organizations LIMIT 1), 'First Floor', '1F', 'floor', 'First floor rooms and facilities'),
((SELECT id FROM organizations LIMIT 1), 'Second Floor', '2F', 'floor', 'Second floor rooms and facilities');
*/
