-- Migration: Add Supervisor Inspection Workflow
-- Created: 2024-12-06
-- Description: Implements FR-HK-03 supervisor inspection checklist and approval workflow

-- Add inspection-related columns to housekeeping_tasks
ALTER TABLE housekeeping_tasks 
ADD COLUMN IF NOT EXISTS requires_inspection BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS inspection_status VARCHAR(20) DEFAULT 'not_required' CHECK (inspection_status IN ('not_required', 'pending', 'passed', 'failed')),
ADD COLUMN IF NOT EXISTS inspected_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS inspected_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS inspection_notes TEXT,
ADD COLUMN IF NOT EXISTS inspection_checklist JSONB;

-- Add timer tracking columns
ALTER TABLE housekeeping_tasks
ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS pause_time INTEGER DEFAULT 0; -- Total pause time in seconds

COMMENT ON COLUMN housekeeping_tasks.requires_inspection IS 'Whether this task requires supervisor inspection after completion';
COMMENT ON COLUMN housekeeping_tasks.inspection_status IS 'Status of inspection: not_required, pending, passed, failed';
COMMENT ON COLUMN housekeeping_tasks.inspected_by IS 'Supervisor who performed the inspection';
COMMENT ON COLUMN housekeeping_tasks.inspected_at IS 'When the inspection was completed';
COMMENT ON COLUMN housekeeping_tasks.inspection_checklist IS 'JSON object with checklist items and their pass/fail status';
COMMENT ON COLUMN housekeeping_tasks.actual_start_time IS 'When staff actually started cleaning (with timer)';
COMMENT ON COLUMN housekeeping_tasks.actual_end_time IS 'When staff actually finished cleaning (with timer)';
COMMENT ON COLUMN housekeeping_tasks.pause_time IS 'Total pause/break time in seconds';

-- Update existing task statuses to include inspection workflow
-- When task is completed and requires inspection, status becomes 'pending_inspection'
-- After supervisor approval, status becomes 'completed'

-- Create default inspection checklist template
CREATE TABLE IF NOT EXISTS inspection_checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100),
  task_type VARCHAR(50),
  checklist_items JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE inspection_checklist_templates IS 'Reusable inspection checklist templates for different task types';

-- Insert default inspection checklist for regular cleaning
INSERT INTO inspection_checklist_templates (org_id, name, name_ar, task_type, checklist_items, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Standard Room Inspection',
  'فحص الغرفة القياسي',
  'regular',
  '{
    "items": [
      {"id": "bed", "label_en": "Bed properly made", "label_ar": "السرير مرتب بشكل صحيح", "required": true},
      {"id": "bathroom", "label_en": "Bathroom cleaned and sanitized", "label_ar": "الحمام نظيف ومعقم", "required": true},
      {"id": "floor", "label_en": "Floor vacuumed/mopped", "label_ar": "الأرضية نظيفة", "required": true},
      {"id": "dust", "label_en": "Surfaces dusted", "label_ar": "الأسطح منظفة من الغبار", "required": true},
      {"id": "trash", "label_en": "Trash removed", "label_ar": "القمامة مزالة", "required": true},
      {"id": "amenities", "label_en": "Amenities restocked", "label_ar": "المستلزمات متوفرة", "required": true},
      {"id": "towels", "label_en": "Fresh towels provided", "label_ar": "المناشف النظيفة متوفرة", "required": true},
      {"id": "odor", "label_en": "No unpleasant odor", "label_ar": "لا توجد روائح كريهة", "required": true}
    ]
  }'::jsonb,
  TRUE
),
(
  '00000000-0000-0000-0000-000000000001',
  'Checkout Room Inspection',
  'فحص غرفة المغادرة',
  'checkout',
  '{
    "items": [
      {"id": "bed", "label_en": "Bed properly made with fresh linens", "label_ar": "السرير بأغطية نظيفة جديدة", "required": true},
      {"id": "bathroom", "label_en": "Bathroom deep cleaned", "label_ar": "الحمام نظيف تماماً", "required": true},
      {"id": "floor", "label_en": "Floor thoroughly cleaned", "label_ar": "الأرضية نظيفة تماماً", "required": true},
      {"id": "furniture", "label_en": "All furniture cleaned", "label_ar": "جميع الأثاث نظيف", "required": true},
      {"id": "amenities", "label_en": "All amenities fully stocked", "label_ar": "جميع المستلزمات متوفرة", "required": true},
      {"id": "ac", "label_en": "AC working properly", "label_ar": "المكيف يعمل بشكل صحيح", "required": true},
      {"id": "lights", "label_en": "All lights working", "label_ar": "جميع الأضواء تعمل", "required": true},
      {"id": "damage", "label_en": "No damage or items missing", "label_ar": "لا يوجد تلف أو أشياء مفقودة", "required": true},
      {"id": "windows", "label_en": "Windows and curtains clean", "label_ar": "النوافذ والستائر نظيفة", "required": true},
      {"id": "mini_bar", "label_en": "Mini bar restocked (if applicable)", "label_ar": "ميني بار معبأ (إن وجد)", "required": false}
    ]
  }'::jsonb,
  TRUE
),
(
  '00000000-0000-0000-0000-000000000001',
  'Deep Clean Inspection',
  'فحص التنظيف العميق',
  'deep_clean',
  '{
    "items": [
      {"id": "bed", "label_en": "Bed and mattress deep cleaned", "label_ar": "السرير والمرتبة نظيفة تماماً", "required": true},
      {"id": "bathroom", "label_en": "Bathroom completely sanitized", "label_ar": "الحمام معقم بالكامل", "required": true},
      {"id": "floor", "label_en": "Floor deep cleaned and polished", "label_ar": "الأرضية نظيفة ولامعة", "required": true},
      {"id": "walls", "label_en": "Walls and ceiling cleaned", "label_ar": "الجدران والسقف نظيفة", "required": true},
      {"id": "windows", "label_en": "Windows thoroughly cleaned", "label_ar": "النوافذ نظيفة تماماً", "required": true},
      {"id": "curtains", "label_en": "Curtains cleaned/replaced", "label_ar": "الستائر نظيفة أو مستبدلة", "required": true},
      {"id": "ac_vents", "label_en": "AC vents cleaned", "label_ar": "فتحات المكيف نظيفة", "required": true},
      {"id": "furniture", "label_en": "All furniture deep cleaned", "label_ar": "جميع الأثاث نظيف تماماً", "required": true},
      {"id": "fixtures", "label_en": "Light fixtures cleaned", "label_ar": "وحدات الإضاءة نظيفة", "required": true},
      {"id": "carpet", "label_en": "Carpet shampooed (if applicable)", "label_ar": "السجاد منظف (إن وجد)", "required": false}
    ]
  }'::jsonb,
  TRUE
);

-- Function to auto-set inspection status when task is completed
CREATE OR REPLACE FUNCTION set_inspection_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If task is being marked as completed and requires inspection
  IF NEW.status = 'completed' AND NEW.requires_inspection = TRUE AND OLD.status != 'completed' THEN
    NEW.inspection_status = 'pending';
  END IF;
  
  -- If inspection is passed, ensure task status is completed
  IF NEW.inspection_status = 'passed' THEN
    NEW.status = 'completed';
  END IF;
  
  -- If inspection failed, set task back to pending
  IF NEW.inspection_status = 'failed' THEN
    NEW.status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_inspection_status ON housekeeping_tasks;
CREATE TRIGGER trigger_inspection_status
  BEFORE UPDATE ON housekeeping_tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_inspection_status();

-- Update existing tasks to set inspection requirements based on task type
UPDATE housekeeping_tasks
SET requires_inspection = TRUE,
    inspection_status = CASE 
      WHEN status = 'completed' THEN 'pending'
      ELSE 'not_required'
    END
WHERE task_type IN ('checkout', 'deep_clean');

UPDATE housekeeping_tasks
SET requires_inspection = FALSE,
    inspection_status = 'not_required'
WHERE task_type IN ('regular', 'inspection', 'turndown');
