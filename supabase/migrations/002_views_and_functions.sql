-- FHK Housekeeping - Helper Views and Functions
-- Migration: 002_views_and_functions.sql

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- View: Real-time room status overview
CREATE OR REPLACE VIEW v_room_status_overview AS
SELECT 
  r.id,
  r.org_id,
  r.room_number,
  r.floor,
  r.room_type,
  r.status,
  r.occupancy_status,
  r.guest_name,
  u.full_name as assigned_staff,
  u.full_name_ar as assigned_staff_ar,
  t.status as task_status,
  t.priority as task_priority,
  r.assigned_at,
  r.updated_at
FROM rooms r
LEFT JOIN users u ON r.current_staff_id = u.id
LEFT JOIN housekeeping_tasks t ON r.id = t.room_id 
  AND t.status IN ('pending', 'in_progress')
  AND t.scheduled_date = CURRENT_DATE;

-- View: Inventory items below reorder level
CREATE OR REPLACE VIEW v_low_stock_items AS
SELECT 
  i.id,
  i.org_id,
  i.item_code,
  i.item_name_en,
  i.item_name_ar,
  i.category,
  i.current_stock,
  i.reorder_level,
  i.unit,
  (i.reorder_level - i.current_stock) as shortage,
  i.supplier,
  i.updated_at
FROM inventory_items i
WHERE i.current_stock <= i.reorder_level
  AND i.is_active = TRUE
ORDER BY (i.reorder_level - i.current_stock) DESC;

-- View: Daily housekeeping performance
CREATE OR REPLACE VIEW v_daily_housekeeping_stats AS
SELECT 
  t.org_id,
  t.assigned_to,
  u.full_name,
  u.full_name_ar,
  t.scheduled_date,
  COUNT(*) FILTER (WHERE t.status = 'completed') as completed_tasks,
  COUNT(*) FILTER (WHERE t.status = 'pending') as pending_tasks,
  COUNT(*) FILTER (WHERE t.status = 'in_progress') as in_progress_tasks,
  AVG(t.duration_minutes) FILTER (WHERE t.status = 'completed') as avg_duration,
  COUNT(*) FILTER (WHERE t.status = 'inspected' AND t.inspection_passed = TRUE) as passed_inspections,
  COUNT(*) FILTER (WHERE t.status = 'inspected' AND t.inspection_passed = FALSE) as failed_inspections
FROM housekeeping_tasks t
LEFT JOIN users u ON t.assigned_to = u.id
WHERE t.scheduled_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY t.org_id, t.assigned_to, u.full_name, u.full_name_ar, t.scheduled_date;

-- View: Linen stock status
CREATE OR REPLACE VIEW v_linen_stock_status AS
SELECT 
  id,
  org_id,
  linen_type,
  size,
  item_name_en,
  item_name_ar,
  total_stock,
  clean_stock,
  soiled_stock,
  in_laundry,
  damaged_stock,
  par_level,
  CASE 
    WHEN clean_stock < par_level * 0.5 THEN 'critical'
    WHEN clean_stock < par_level THEN 'low'
    ELSE 'adequate'
  END as stock_status,
  ROUND((clean_stock::DECIMAL / NULLIF(par_level, 0)) * 100, 2) as stock_percentage
FROM linen_items
WHERE is_active = TRUE;

-- View: Active service requests
CREATE OR REPLACE VIEW v_active_service_requests AS
SELECT 
  sr.id,
  sr.org_id,
  sr.room_id,
  r.room_number,
  sr.request_type,
  sr.category,
  sr.title,
  sr.status,
  sr.priority,
  u_reported.full_name as reported_by_name,
  u_assigned.full_name as assigned_to_name,
  sr.created_at,
  EXTRACT(EPOCH FROM (NOW() - sr.created_at))/60 as age_minutes
FROM service_requests sr
LEFT JOIN rooms r ON sr.room_id = r.id
LEFT JOIN users u_reported ON sr.reported_by = u_reported.id
LEFT JOIN users u_assigned ON sr.assigned_to = u_assigned.id
WHERE sr.status NOT IN ('closed', 'cancelled')
ORDER BY 
  CASE sr.priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'normal' THEN 3
    WHEN 'low' THEN 4
  END,
  sr.created_at;

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function: Get user's organization ID
CREATE OR REPLACE FUNCTION get_user_org_id(user_uuid UUID)
RETURNS UUID AS $$
  SELECT org_id FROM users WHERE id = user_uuid;
$$ LANGUAGE SQL STABLE;

-- Function: Check if item is low on stock
CREATE OR REPLACE FUNCTION is_low_stock(item_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT current_stock <= reorder_level 
  FROM inventory_items 
  WHERE id = item_uuid;
$$ LANGUAGE SQL STABLE;

-- Function: Calculate task completion rate for staff
CREATE OR REPLACE FUNCTION get_staff_completion_rate(
  staff_uuid UUID,
  days_back INTEGER DEFAULT 7
)
RETURNS DECIMAL AS $$
  SELECT 
    COALESCE(
      ROUND(
        COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / 
        NULLIF(COUNT(*), 0) * 100,
        2
      ),
      0
    )
  FROM housekeeping_tasks
  WHERE assigned_to = staff_uuid
    AND scheduled_date >= CURRENT_DATE - days_back;
$$ LANGUAGE SQL STABLE;

-- Function: Get room cleaning history
CREATE OR REPLACE FUNCTION get_room_cleaning_history(
  room_uuid UUID,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  task_id UUID,
  staff_name TEXT,
  status TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  inspection_passed BOOLEAN
) AS $$
  SELECT 
    t.id,
    u.full_name,
    t.status,
    t.started_at,
    t.completed_at,
    t.duration_minutes,
    t.inspection_passed
  FROM housekeeping_tasks t
  LEFT JOIN users u ON t.assigned_to = u.id
  WHERE t.room_id = room_uuid
  ORDER BY t.created_at DESC
  LIMIT limit_count;
$$ LANGUAGE SQL STABLE;

-- Sequence for laundry batch IDs
CREATE SEQUENCE IF NOT EXISTS laundry_batch_seq;

-- Function: Generate laundry batch ID
CREATE OR REPLACE FUNCTION generate_laundry_batch_id()
RETURNS TEXT AS $$
  SELECT 'BATCH-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('laundry_batch_seq')::TEXT, 4, '0');
$$ LANGUAGE SQL VOLATILE;

-- Function: Create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_title_ar TEXT,
  p_message TEXT,
  p_message_ar TEXT,
  p_type TEXT DEFAULT 'info',
  p_category TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  user_org_id UUID;
BEGIN
  SELECT org_id INTO user_org_id FROM users WHERE id = p_user_id;
  
  INSERT INTO notifications (
    org_id, user_id, title, title_ar, message, message_ar, 
    type, category, reference_id, reference_type
  )
  VALUES (
    user_org_id, p_user_id, p_title, p_title_ar, p_message, p_message_ar,
    p_type, p_category, p_reference_id, p_reference_type
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- AUTOMATED NOTIFICATIONS
-- ============================================

-- Trigger: Notify on task assignment
CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN
    PERFORM create_notification(
      NEW.assigned_to,
      'New Task Assigned',
      'تم تعيين مهمة جديدة',
      'You have been assigned to clean room ' || (SELECT room_number FROM rooms WHERE id = NEW.room_id),
      'تم تعيينك لتنظيف الغرفة ' || (SELECT room_number FROM rooms WHERE id = NEW.room_id),
      'info',
      'task_assigned',
      NEW.id,
      'housekeeping_task'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_task_assignment
  AFTER INSERT OR UPDATE ON housekeeping_tasks
  FOR EACH ROW EXECUTE FUNCTION notify_task_assignment();

-- Trigger: Notify on low stock
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
DECLARE
  admin_users UUID[];
  admin_user UUID;
BEGIN
  IF NEW.current_stock <= NEW.reorder_level THEN
    SELECT ARRAY_AGG(id) INTO admin_users 
    FROM users 
    WHERE org_id = NEW.org_id AND role IN ('admin', 'supervisor');
    
    FOREACH admin_user IN ARRAY admin_users
    LOOP
      PERFORM create_notification(
        admin_user,
        'Low Stock Alert',
        'تنبيه مخزون منخفض',
        NEW.item_name_en || ' is running low. Current stock: ' || NEW.current_stock || ' ' || NEW.unit,
        NEW.item_name_ar || ' مخزون منخفض. المخزون الحالي: ' || NEW.current_stock || ' ' || NEW.unit,
        'warning',
        'low_stock',
        NEW.id,
        'inventory_item'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_low_stock
  AFTER UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION notify_low_stock();

-- Trigger: Notify on service request
CREATE OR REPLACE FUNCTION notify_service_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL THEN
    PERFORM create_notification(
      NEW.assigned_to,
      'Service Request Assigned',
      'تم تعيين طلب خدمة',
      'New ' || NEW.request_type || ' request for room ' || (SELECT room_number FROM rooms WHERE id = NEW.room_id),
      'طلب ' || NEW.request_type || ' جديد للغرفة ' || (SELECT room_number FROM rooms WHERE id = NEW.room_id),
      CASE WHEN NEW.priority = 'urgent' THEN 'error' ELSE 'info' END,
      'service_request',
      NEW.id,
      'service_request'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_service_request
  AFTER INSERT OR UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION notify_service_request();

-- ============================================
-- ANALYTICS FUNCTIONS
-- ============================================

-- Function: Get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_org_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'rooms', json_build_object(
      'total', COUNT(*),
      'occupied', COUNT(*) FILTER (WHERE occupancy_status = 'occupied'),
      'vacant', COUNT(*) FILTER (WHERE status = 'vacant'),
      'cleaning', COUNT(*) FILTER (WHERE status = 'cleaning'),
      'maintenance', COUNT(*) FILTER (WHERE status = 'maintenance')
    ),
    'tasks_today', json_build_object(
      'total', (SELECT COUNT(*) FROM housekeeping_tasks WHERE org_id = p_org_id AND scheduled_date = CURRENT_DATE),
      'completed', (SELECT COUNT(*) FROM housekeeping_tasks WHERE org_id = p_org_id AND scheduled_date = CURRENT_DATE AND status = 'completed'),
      'pending', (SELECT COUNT(*) FROM housekeeping_tasks WHERE org_id = p_org_id AND scheduled_date = CURRENT_DATE AND status = 'pending'),
      'in_progress', (SELECT COUNT(*) FROM housekeeping_tasks WHERE org_id = p_org_id AND scheduled_date = CURRENT_DATE AND status = 'in_progress')
    ),
    'service_requests', json_build_object(
      'open', (SELECT COUNT(*) FROM service_requests WHERE org_id = p_org_id AND status IN ('open', 'assigned', 'in_progress')),
      'urgent', (SELECT COUNT(*) FROM service_requests WHERE org_id = p_org_id AND status IN ('open', 'assigned') AND priority = 'urgent')
    ),
    'inventory', json_build_object(
      'low_stock_items', (SELECT COUNT(*) FROM inventory_items WHERE org_id = p_org_id AND current_stock <= reorder_level AND is_active = TRUE)
    ),
    'linen', json_build_object(
      'clean', (SELECT SUM(clean_stock) FROM linen_items WHERE org_id = p_org_id),
      'soiled', (SELECT SUM(soiled_stock) FROM linen_items WHERE org_id = p_org_id),
      'in_laundry', (SELECT SUM(in_laundry) FROM linen_items WHERE org_id = p_org_id)
    )
  )
  FROM rooms WHERE org_id = p_org_id;
$$ LANGUAGE SQL STABLE;

COMMENT ON VIEW v_room_status_overview IS 'Real-time overview of all rooms with staff and task status';
COMMENT ON VIEW v_low_stock_items IS 'Inventory items that need reordering';
COMMENT ON VIEW v_daily_housekeeping_stats IS 'Staff performance metrics';
COMMENT ON VIEW v_linen_stock_status IS 'Current linen availability status';
COMMENT ON VIEW v_active_service_requests IS 'All open service requests sorted by priority';
