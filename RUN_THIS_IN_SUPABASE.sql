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
