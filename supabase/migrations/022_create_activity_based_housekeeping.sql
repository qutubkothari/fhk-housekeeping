-- Migration: Activity-Based Housekeeping System
-- Date: 2025-12-13
-- Purpose: Multi-activity assignments per room with completion tracking

-- =====================================================
-- HOUSEKEEPING ACTIVITY MASTER
-- =====================================================
CREATE TABLE IF NOT EXISTS housekeeping_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  description TEXT,
  estimated_minutes INTEGER DEFAULT 30,
  sequence_order INTEGER DEFAULT 1, -- Order in which activities should be done
  is_mandatory BOOLEAN DEFAULT true, -- Must be completed for RFO
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT activities_org_code_unique UNIQUE (org_id, code)
);

CREATE INDEX IF NOT EXISTS idx_activities_org_active ON housekeeping_activities(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_activities_sequence ON housekeeping_activities(org_id, sequence_order);

-- =====================================================
-- ROOM ASSIGNMENT (Bulk Assignment by Supervisor)
-- =====================================================
CREATE TABLE IF NOT EXISTS room_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  assignment_type VARCHAR(50) NOT NULL, -- 'before_arrival', 'occupied', 'preventive_maintenance', 'turn_down'
  assigned_by UUID NOT NULL REFERENCES users(id),
  assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift_id UUID REFERENCES shifts(id),
  target_completion_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  completion_percentage INTEGER DEFAULT 0, -- Calculated from activity completions
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_room_assignments_room ON room_assignments(room_id);
CREATE INDEX IF NOT EXISTS idx_room_assignments_date ON room_assignments(assignment_date);
CREATE INDEX IF NOT EXISTS idx_room_assignments_status ON room_assignments(org_id, status);
CREATE INDEX IF NOT EXISTS idx_room_assignments_shift ON room_assignments(shift_id);

-- =====================================================
-- ACTIVITY ASSIGNMENTS (Individual Activities per Room)
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_assignment_id UUID NOT NULL REFERENCES room_assignments(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES housekeeping_activities(id),
  assigned_to UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped'
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_taken_minutes INTEGER,
  notes TEXT,
  issues_reported TEXT[], -- Array of issue keys reported during this activity
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT activity_assignments_unique UNIQUE (room_assignment_id, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_assignments_room ON activity_assignments(room_assignment_id);
CREATE INDEX IF NOT EXISTS idx_activity_assignments_user ON activity_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_activity_assignments_status ON activity_assignments(status);
CREATE INDEX IF NOT EXISTS idx_activity_assignments_activity ON activity_assignments(activity_id);

-- =====================================================
-- TURN DOWN SERVICE REQUESTS
-- =====================================================
CREATE TABLE IF NOT EXISTS turn_down_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  requested_by VARCHAR(100), -- Guest name or front desk staff
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  preferred_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'requested', -- 'requested', 'assigned', 'completed', 'cancelled'
  assigned_to UUID REFERENCES users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_turn_down_room ON turn_down_requests(room_id);
CREATE INDEX IF NOT EXISTS idx_turn_down_status ON turn_down_requests(org_id, status);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Housekeeping Activities
ALTER TABLE housekeeping_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities in their org" ON housekeeping_activities
  FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage activities" ON housekeeping_activities
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Room Assignments
ALTER TABLE room_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assignments in their org" ON room_assignments
  FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Supervisors can create assignments" ON room_assignments
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'supervisor')
    )
  );

CREATE POLICY "Supervisors can update assignments" ON room_assignments
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'supervisor')
    )
  );

-- Activity Assignments
ALTER TABLE activity_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their activity assignments" ON activity_assignments
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    room_assignment_id IN (
      SELECT id FROM room_assignments 
      WHERE org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own assignments" ON activity_assignments
  FOR UPDATE USING (assigned_to = auth.uid());

CREATE POLICY "Supervisors can manage activity assignments" ON activity_assignments
  FOR ALL USING (
    room_assignment_id IN (
      SELECT id FROM room_assignments 
      WHERE org_id IN (
        SELECT org_id FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'supervisor')
      )
    )
  );

-- Turn Down Requests
ALTER TABLE turn_down_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view turn down requests in their org" ON turn_down_requests
  FOR SELECT USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Staff can manage turn down requests" ON turn_down_requests
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'supervisor', 'staff')
    )
  );

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================
CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON housekeeping_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_assignments_updated_at
  BEFORE UPDATE ON room_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_assignments_updated_at
  BEFORE UPDATE ON activity_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Calculate Room Assignment Completion %
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_room_completion_percentage()
RETURNS TRIGGER AS $$
DECLARE
  total_activities INTEGER;
  completed_activities INTEGER;
  completion_pct INTEGER;
BEGIN
  -- Count total mandatory activities for this room assignment
  SELECT COUNT(*) INTO total_activities
  FROM activity_assignments
  WHERE room_assignment_id = NEW.room_assignment_id;
  
  -- Count completed activities
  SELECT COUNT(*) INTO completed_activities
  FROM activity_assignments
  WHERE room_assignment_id = NEW.room_assignment_id
  AND status = 'completed';
  
  -- Calculate percentage
  IF total_activities > 0 THEN
    completion_pct := ROUND((completed_activities::DECIMAL / total_activities) * 100);
  ELSE
    completion_pct := 0;
  END IF;
  
  -- Update room assignment
  UPDATE room_assignments
  SET 
    completion_percentage = completion_pct,
    status = CASE 
      WHEN completion_pct = 100 THEN 'completed'
      WHEN completion_pct > 0 THEN 'in_progress'
      ELSE 'pending'
    END,
    completed_at = CASE 
      WHEN completion_pct = 100 THEN now()
      ELSE NULL
    END,
    updated_at = now()
  WHERE id = NEW.room_assignment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate on activity completion
CREATE TRIGGER trigger_calculate_completion
  AFTER INSERT OR UPDATE OF status ON activity_assignments
  FOR EACH ROW
  EXECUTE FUNCTION calculate_room_completion_percentage();

-- =====================================================
-- SAMPLE DATA (Default Activities)
-- =====================================================
-- Uncomment to insert standard housekeeping activities
/*
INSERT INTO housekeeping_activities (org_id, name, code, description, estimated_minutes, sequence_order) VALUES
((SELECT id FROM organizations LIMIT 1), 'Dusting', 'DUST', 'Dust all surfaces including furniture, fixtures, and decorations', 15, 1),
((SELECT id FROM organizations LIMIT 1), 'Bathroom Cleaning', 'BATH', 'Complete bathroom cleaning including toilet, sink, shower, and floor', 20, 2),
((SELECT id FROM organizations LIMIT 1), 'Linen Change', 'LINEN', 'Replace bed linens, pillowcases, and towels', 15, 3),
((SELECT id FROM organizations LIMIT 1), 'Vacuuming', 'VAC', 'Vacuum carpets and floors', 10, 4),
((SELECT id FROM organizations LIMIT 1), 'Mopping', 'MOP', 'Mop hard floors', 10, 5),
((SELECT id FROM organizations LIMIT 1), 'Amenities Restocking', 'AMEN', 'Restock toiletries, tea/coffee, and other amenities', 5, 6),
((SELECT id FROM organizations LIMIT 1), 'Inspection', 'INSP', 'Final quality inspection of the room', 10, 7),
((SELECT id FROM organizations LIMIT 1), 'Turn Down Service', 'TURN', 'Evening turn down service', 10, 8);
*/
