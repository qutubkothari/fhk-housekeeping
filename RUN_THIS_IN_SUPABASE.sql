-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/oglmyyyhfwuhyghcbnmi/sql/new

-- Step 1: Add columns to service_requests
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS breakdown_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS is_medical_emergency BOOLEAN DEFAULT FALSE;

-- Step 2: Create breakdown_category_templates table
CREATE TABLE IF NOT EXISTS breakdown_category_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  name_en VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200),
  default_severity VARCHAR(20) DEFAULT 'normal',
  sla_minutes INTEGER,
  assigned_role VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 3: Insert sample breakdown categories
INSERT INTO breakdown_category_templates (org_id, category, name_en, name_ar, default_severity, sla_minutes, assigned_role)
VALUES
-- AC Issues
('00000000-0000-0000-0000-000000000001', 'AC', 'AC not cooling properly', 'المكيف لا يبرد بشكل جيد', 'high', 60, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'AC', 'AC completely not working', 'المكيف لا يعمل نهائياً', 'critical', 30, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'AC', 'AC making loud noise', 'المكيف يصدر صوت عالي', 'normal', 120, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'AC', 'AC leaking water', 'المكيف يسرب ماء', 'high', 60, 'maintenance'),
-- Plumbing Issues
('00000000-0000-0000-0000-000000000001', 'Plumbing', 'Water leaking from pipes', 'تسريب ماء من الأنابيب', 'critical', 30, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'Plumbing', 'Toilet clogged', 'المرحاض مسدود', 'high', 45, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'Plumbing', 'Shower not working', 'الدش لا يعمل بشكل جيد', 'high', 60, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'Plumbing', 'No hot water', 'لا يوجد ماء ساخن', 'high', 60, 'maintenance'),
-- Electrical Issues
('00000000-0000-0000-0000-000000000001', 'Electrical', 'No power in room', 'لا يوجد كهرباء في الغرفة', 'critical', 20, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'Electrical', 'Light not working', 'الضوء لا يعمل', 'normal', 60, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'Electrical', 'Power socket not working', 'المقبس لا يعمل', 'normal', 90, 'maintenance'),
-- Furniture Issues
('00000000-0000-0000-0000-000000000001', 'Furniture', 'Bed frame broken', 'إطار السرير مكسور', 'high', 120, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'Furniture', 'Chair broken', 'الكرسي مكسور', 'normal', 180, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'Furniture', 'Door not closing', 'الباب لا يغلق بشكل صحيح', 'high', 90, 'maintenance'),
-- Appliance Issues
('00000000-0000-0000-0000-000000000001', 'Appliance', 'TV not working', 'التلفاز لا يعمل', 'normal', 120, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'Appliance', 'Mini fridge not cooling', 'الثلاجة الصغيرة لا تبرد', 'high', 90, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'Appliance', 'Safe not working', 'الخزنة لا تعمل', 'high', 60, 'maintenance'),
-- Structural Issues
('00000000-0000-0000-0000-000000000001', 'Structural', 'Ceiling leaking', 'تسريب من السقف', 'critical', 30, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'Structural', 'Wall damaged', 'الجدار تالف', 'normal', 240, 'maintenance');

-- Success message
SELECT 'Migration 018 completed successfully! breakdown_category_templates table created with ' || COUNT(*) || ' entries.' as result
FROM breakdown_category_templates;


-- =====================================================
-- MASTER DATA COMPLETION (Locations, Shifts, Employee Mapping)
-- Covers:
-- 1.1 Location Master (table may already exist)
-- 1.2 Employee Master linked to Location + Operational Area (Activity)
-- 1.3 Shift Master (unified)
-- =====================================================

-- Location Master (create if not already created)
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

-- If locations table existed from older schema, ensure required columns exist
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS location_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS parent_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_locations_parent ON locations(parent_location_id);
CREATE INDEX IF NOT EXISTS idx_locations_org_active ON locations(org_id, is_active);

-- Locations RLS (safe for existing disabled-RLS environments)
DO $$
BEGIN
  BEGIN
    ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN others THEN
    -- ignore
  END;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'locations' AND policyname = 'Users can view locations in their org') THEN
    CREATE POLICY "Users can view locations in their org" ON locations
      FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'locations' AND policyname = 'Admins can manage locations') THEN
    CREATE POLICY "Admins can manage locations" ON locations
      FOR ALL USING (
        org_id IN (
          SELECT org_id FROM users
          WHERE id = auth.uid()
          AND role IN ('admin', 'super_admin')
        )
      );
  END IF;
END $$;

-- Shifts table (if not already created)
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT shifts_org_code_unique UNIQUE (org_id, code)
);

CREATE INDEX IF NOT EXISTS idx_shifts_org_active ON shifts(org_id, is_active);

-- Ensure users table has master-data mapping columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_location ON users(location_id);
CREATE INDEX IF NOT EXISTS idx_users_shift ON users(shift_id);

-- Operational Area = Activity (mapping table)
CREATE TABLE IF NOT EXISTS user_operational_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES housekeeping_activities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT user_operational_activities_unique UNIQUE (user_id, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_user_operational_activities_org ON user_operational_activities(org_id);
CREATE INDEX IF NOT EXISTS idx_user_operational_activities_user ON user_operational_activities(user_id);

-- RLS (safe for existing disabled-RLS environments)
DO $$
BEGIN
  BEGIN
    ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN others THEN
    -- ignore
  END;
  BEGIN
    ALTER TABLE user_operational_activities ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN others THEN
    -- ignore
  END;
END $$;

-- Policies (create only if not already present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shifts' AND policyname = 'Users can view shifts in their org') THEN
    CREATE POLICY "Users can view shifts in their org" ON shifts
      FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shifts' AND policyname = 'Admins can manage shifts') THEN
    CREATE POLICY "Admins can manage shifts" ON shifts
      FOR ALL USING (
        org_id IN (
          SELECT org_id FROM users
          WHERE id = auth.uid()
          AND role IN ('admin', 'super_admin')
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_operational_activities' AND policyname = 'Users can view operational activities in their org') THEN
    CREATE POLICY "Users can view operational activities in their org" ON user_operational_activities
      FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_operational_activities' AND policyname = 'Admins can manage operational activities') THEN
    CREATE POLICY "Admins can manage operational activities" ON user_operational_activities
      FOR ALL USING (
        org_id IN (
          SELECT org_id FROM users
          WHERE id = auth.uid()
          AND role IN ('admin', 'super_admin')
        )
      );
  END IF;
END $$;

SELECT 'Master data completion applied (Shifts + Employee mapping + Operational Activities mapping).' as result;
