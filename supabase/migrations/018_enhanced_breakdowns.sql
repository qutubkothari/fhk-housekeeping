-- Migration: Enhanced Service Request Breakdown Categories
-- Created: 2024-12-06
-- Description: Implements FR-HK-04 detailed breakdown reporting with categories

-- Add breakdown category columns to service_requests
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS breakdown_category VARCHAR(50) CHECK (breakdown_category IN ('ac', 'plumbing', 'electrical', 'furniture', 'appliance', 'structural', 'other')),
ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'normal' CHECK (severity IN ('low', 'normal', 'high', 'critical', 'emergency')),
ADD COLUMN IF NOT EXISTS is_medical_emergency BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS estimated_resolution_time INTEGER, -- in minutes
ADD COLUMN IF NOT EXISTS actual_resolution_time INTEGER; -- in minutes

COMMENT ON COLUMN service_requests.breakdown_category IS 'Specific breakdown category: ac, plumbing, electrical, furniture, appliance, structural, other';
COMMENT ON COLUMN service_requests.severity IS 'Severity level: low, normal, high, critical, emergency';
COMMENT ON COLUMN service_requests.is_medical_emergency IS 'Flag for medical or life-threatening emergencies';
COMMENT ON COLUMN service_requests.estimated_resolution_time IS 'Estimated time to resolve in minutes';
COMMENT ON COLUMN service_requests.actual_resolution_time IS 'Actual time taken to resolve in minutes';

-- Create breakdown category templates with SLA times
CREATE TABLE IF NOT EXISTS breakdown_category_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(100),
  name_en VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200),
  default_severity VARCHAR(20) DEFAULT 'normal',
  sla_minutes INTEGER, -- Service Level Agreement response time
  assigned_role VARCHAR(50), -- Which role should handle this
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE breakdown_category_templates IS 'Templates for common breakdown issues with SLA and routing';

-- Insert common breakdown templates
INSERT INTO breakdown_category_templates (org_id, category, subcategory, name_en, name_ar, default_severity, sla_minutes, assigned_role)
VALUES
-- AC Issues
('00000000-0000-0000-0000-000000000001', 'ac', 'not_cooling', 'AC not cooling properly', 'المكيف لا يبرد بشكل جيد', 'high', 60, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'ac', 'not_working', 'AC completely not working', 'المكيف لا يعمل نهائياً', 'critical', 30, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'ac', 'noisy', 'AC making loud noise', 'المكيف يصدر صوت عالي', 'normal', 120, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'ac', 'leaking', 'AC leaking water', 'المكيف يسرب ماء', 'high', 60, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'ac', 'remote_issue', 'AC remote not working', 'ريموت المكيف لا يعمل', 'low', 240, 'staff'),

-- Plumbing Issues
('00000000-0000-0000-0000-000000000001', 'plumbing', 'water_leak', 'Water leaking from pipes', 'تسريب ماء من الأنابيب', 'critical', 30, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'plumbing', 'toilet_clog', 'Toilet clogged', 'المرحاض مسدود', 'high', 45, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'plumbing', 'shower_issue', 'Shower not working properly', 'الدش لا يعمل بشكل جيد', 'high', 60, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'plumbing', 'sink_clog', 'Sink drainage clogged', 'حوض الغسيل مسدود', 'normal', 90, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'plumbing', 'no_hot_water', 'No hot water', 'لا يوجد ماء ساخن', 'high', 60, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'plumbing', 'low_pressure', 'Low water pressure', 'ضغط الماء ضعيف', 'normal', 120, 'maintenance'),

-- Electrical Issues
('00000000-0000-0000-0000-000000000001', 'electrical', 'no_power', 'No power in room', 'لا يوجد كهرباء في الغرفة', 'critical', 20, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'electrical', 'light_not_working', 'Light not working', 'الضوء لا يعمل', 'normal', 60, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'electrical', 'socket_issue', 'Power socket not working', 'المقبس لا يعمل', 'normal', 90, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'electrical', 'switch_broken', 'Light switch broken', 'مفتاح الإضاءة معطل', 'normal', 120, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'electrical', 'flickering', 'Lights flickering', 'الأضواء تومض', 'normal', 90, 'maintenance'),

-- Furniture Issues
('00000000-0000-0000-0000-000000000001', 'furniture', 'bed_broken', 'Bed frame broken', 'إطار السرير مكسور', 'high', 120, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'furniture', 'chair_broken', 'Chair broken', 'الكرسي مكسور', 'normal', 180, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'furniture', 'desk_damaged', 'Desk damaged', 'المكتب تالف', 'normal', 240, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'furniture', 'door_issue', 'Door not closing properly', 'الباب لا يغلق بشكل صحيح', 'high', 90, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'furniture', 'window_issue', 'Window not opening/closing', 'النافذة لا تفتح/تغلق', 'normal', 120, 'maintenance'),

-- Appliance Issues
('00000000-0000-0000-0000-000000000001', 'appliance', 'tv_not_working', 'TV not working', 'التلفاز لا يعمل', 'normal', 120, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'appliance', 'fridge_issue', 'Mini fridge not cooling', 'الثلاجة الصغيرة لا تبرد', 'high', 90, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'appliance', 'safe_issue', 'Safe not working', 'الخزنة لا تعمل', 'high', 60, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'appliance', 'phone_issue', 'Room phone not working', 'هاتف الغرفة لا يعمل', 'normal', 180, 'maintenance'),

-- Structural Issues
('00000000-0000-0000-0000-000000000001', 'structural', 'ceiling_leak', 'Ceiling leaking', 'تسريب من السقف', 'critical', 30, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'structural', 'wall_damage', 'Wall damaged', 'الجدار تالف', 'normal', 240, 'maintenance'),
('00000000-0000-0000-0000-000000000001', 'structural', 'floor_issue', 'Floor tile loose/broken', 'بلاط الأرضية مفكك/مكسور', 'normal', 180, 'maintenance');

-- Function to auto-route service requests based on category
CREATE OR REPLACE FUNCTION auto_route_service_request()
RETURNS TRIGGER AS $$
DECLARE
  v_assigned_role VARCHAR(50);
  v_user_id UUID;
BEGIN
  -- If breakdown category is set, get the appropriate role
  IF NEW.breakdown_category IS NOT NULL AND NEW.assigned_to IS NULL THEN
    -- Get the assigned role for this category
    SELECT assigned_role INTO v_assigned_role
    FROM breakdown_category_templates
    WHERE category = NEW.breakdown_category
    AND org_id = NEW.org_id
    AND is_active = TRUE
    LIMIT 1;
    
    -- Find an active user with that role
    IF v_assigned_role IS NOT NULL THEN
      SELECT id INTO v_user_id
      FROM users
      WHERE role = v_assigned_role
      AND org_id = NEW.org_id
      AND is_active = TRUE
      ORDER BY RANDOM()
      LIMIT 1;
      
      NEW.assigned_to = v_user_id;
    END IF;
  END IF;
  
  -- Set priority based on severity
  IF NEW.severity IN ('critical', 'emergency') THEN
    NEW.priority = 'urgent';
  ELSIF NEW.severity = 'high' THEN
    NEW.priority = 'high';
  ELSIF NEW.severity = 'low' THEN
    NEW.priority = 'low';
  ELSE
    NEW.priority = 'normal';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_route_request ON service_requests;
CREATE TRIGGER trigger_auto_route_request
  BEFORE INSERT ON service_requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_route_service_request();

-- Update existing service requests to categorize them
UPDATE service_requests
SET breakdown_category = CASE
  WHEN description ILIKE '%ac%' OR description ILIKE '%air%' OR description ILIKE '%cooling%' OR description ILIKE '%مكيف%' THEN 'ac'
  WHEN description ILIKE '%water%' OR description ILIKE '%leak%' OR description ILIKE '%toilet%' OR description ILIKE '%ماء%' OR description ILIKE '%تسريب%' THEN 'plumbing'
  WHEN description ILIKE '%electric%' OR description ILIKE '%light%' OR description ILIKE '%power%' OR description ILIKE '%كهرباء%' OR description ILIKE '%إضاءة%' THEN 'electrical'
  WHEN description ILIKE '%furniture%' OR description ILIKE '%bed%' OR description ILIKE '%chair%' OR description ILIKE '%أثاث%' OR description ILIKE '%سرير%' THEN 'furniture'
  ELSE 'other'
END
WHERE request_type = 'maintenance' AND breakdown_category IS NULL;
