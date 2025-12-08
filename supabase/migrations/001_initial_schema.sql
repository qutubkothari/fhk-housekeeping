-- FHK HOUSEKEEPING MANAGEMENT SYSTEM
-- Initial Database Schema
-- Migration: 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ORGANIZATIONS & USERS
-- ============================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  settings JSONB DEFAULT '{
    "currency": "SAR",
    "timezone": "Asia/Riyadh",
    "default_language": "ar",
    "business_hours": {
      "start": "06:00",
      "end": "23:00"
    }
  }'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,
  full_name_ar TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'supervisor', 'staff', 'laundry', 'maintenance')),
  preferred_language TEXT DEFAULT 'ar' CHECK (preferred_language IN ('ar', 'en')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. ROOMS
-- ============================================

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  floor INTEGER,
  building TEXT,
  room_type TEXT DEFAULT 'standard', -- standard, deluxe, suite, presidential
  status TEXT DEFAULT 'vacant' CHECK (status IN ('vacant', 'occupied', 'cleaning', 'maintenance', 'out_of_order')),
  current_staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  occupancy_status TEXT DEFAULT 'vacant' CHECK (occupancy_status IN ('vacant', 'occupied', 'reserved')),
  guest_name TEXT,
  checkout_date DATE,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, room_number)
);

CREATE INDEX idx_rooms_org_status ON rooms(org_id, status);
CREATE INDEX idx_rooms_staff ON rooms(current_staff_id) WHERE current_staff_id IS NOT NULL;

-- ============================================
-- 3. HOUSEKEEPING TASKS
-- ============================================

CREATE TABLE housekeeping_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'inspected', 'failed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  task_type TEXT DEFAULT 'regular' CHECK (task_type IN ('regular', 'checkout', 'deep_clean', 'inspection', 'turndown')),
  scheduled_date DATE DEFAULT CURRENT_DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  inspected_at TIMESTAMPTZ,
  inspected_by UUID REFERENCES users(id) ON DELETE SET NULL,
  inspection_passed BOOLEAN,
  inspection_notes TEXT,
  checklist JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_status ON housekeeping_tasks(status, scheduled_date);
CREATE INDEX idx_tasks_assigned ON housekeeping_tasks(assigned_to, status);
CREATE INDEX idx_tasks_room ON housekeeping_tasks(room_id);

-- ============================================
-- 4. SERVICE REQUESTS
-- ============================================

CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('guest_request', 'breakdown', 'maintenance', 'housekeeping')),
  category TEXT NOT NULL, -- extra_towels, cleaning, ac_issue, plumbing, electrical, etc.
  title TEXT NOT NULL,
  description TEXT,
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved', 'closed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  guest_notified BOOLEAN DEFAULT FALSE,
  estimated_time INTEGER, -- minutes
  actual_time INTEGER, -- minutes
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_service_requests_status ON service_requests(status, priority);
CREATE INDEX idx_service_requests_assigned ON service_requests(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_service_requests_room ON service_requests(room_id);

-- ============================================
-- 5. INVENTORY ITEMS
-- ============================================

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  item_name_en TEXT NOT NULL,
  item_name_ar TEXT NOT NULL,
  category TEXT NOT NULL, -- consumables, cleaning_supplies, amenities, equipment, toiletries
  unit TEXT NOT NULL, -- pcs, kg, liters, boxes, bottles
  current_stock DECIMAL(10,2) DEFAULT 0 CHECK (current_stock >= 0),
  min_level DECIMAL(10,2) DEFAULT 0,
  reorder_level DECIMAL(10,2) DEFAULT 0,
  max_level DECIMAL(10,2),
  unit_cost DECIMAL(10,2) DEFAULT 0,
  location TEXT,
  supplier TEXT,
  barcode TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, item_code)
);

CREATE INDEX idx_inventory_org_active ON inventory_items(org_id, is_active);
CREATE INDEX idx_inventory_low_stock ON inventory_items(org_id) WHERE current_stock <= reorder_level;

-- ============================================
-- 6. INVENTORY TRANSACTIONS
-- ============================================

CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('receipt', 'issue', 'return', 'adjustment', 'discard', 'transfer')),
  quantity DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reference_number TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_trans_item ON inventory_transactions(item_id, created_at DESC);
CREATE INDEX idx_inv_trans_org ON inventory_transactions(org_id, created_at DESC);

-- ============================================
-- 7. LINEN MANAGEMENT
-- ============================================

CREATE TABLE linen_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  linen_type TEXT NOT NULL, -- bed_sheet, pillow_case, towel, bathrobe, blanket, duvet, mattress_protector
  size TEXT, -- single, double, king, queen
  color TEXT,
  item_name_en TEXT NOT NULL,
  item_name_ar TEXT NOT NULL,
  total_stock INTEGER DEFAULT 0 CHECK (total_stock >= 0),
  clean_stock INTEGER DEFAULT 0 CHECK (clean_stock >= 0),
  soiled_stock INTEGER DEFAULT 0 CHECK (soiled_stock >= 0),
  in_laundry INTEGER DEFAULT 0 CHECK (in_laundry >= 0),
  damaged_stock INTEGER DEFAULT 0 CHECK (damaged_stock >= 0),
  par_level INTEGER DEFAULT 0,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT linen_stock_balance CHECK (total_stock = clean_stock + soiled_stock + in_laundry + damaged_stock)
);

CREATE INDEX idx_linen_org ON linen_items(org_id, is_active);

-- ============================================
-- 8. LINEN TRANSACTIONS
-- ============================================

CREATE TABLE linen_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  linen_id UUID NOT NULL REFERENCES linen_items(id) ON DELETE RESTRICT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('issue_clean', 'return_soiled', 'send_laundry', 'receive_laundry', 'mark_damaged', 'discard', 'purchase', 'adjustment')),
  quantity INTEGER NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
  laundry_batch_id TEXT,
  damage_reason TEXT,
  notes TEXT,
  approval_required BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_linen_trans_item ON linen_transactions(linen_id, created_at DESC);
CREATE INDEX idx_linen_trans_batch ON linen_transactions(laundry_batch_id) WHERE laundry_batch_id IS NOT NULL;

-- ============================================
-- 9. AUDIT LOGS
-- ============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org_date ON audit_logs(org_id, created_at DESC);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name, record_id);

-- ============================================
-- 10. NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  message TEXT NOT NULL,
  message_ar TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  category TEXT, -- task_assigned, low_stock, service_request, etc.
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE housekeeping_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE linen_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE linen_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their organization's data
CREATE POLICY "Users access own org" ON users 
  FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Rooms access own org" ON rooms 
  FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Tasks access own org" ON housekeeping_tasks 
  FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Service requests access own org" ON service_requests 
  FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Inventory items access own org" ON inventory_items 
  FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Inventory transactions access own org" ON inventory_transactions 
  FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Linen items access own org" ON linen_items 
  FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Linen transactions access own org" ON linen_transactions 
  FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Audit logs access own org" ON audit_logs 
  FOR ALL USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Notifications access own" ON notifications 
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON housekeeping_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_linen_items_updated_at BEFORE UPDATE ON linen_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Update inventory stock on transaction
CREATE OR REPLACE FUNCTION update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type IN ('receipt', 'return', 'adjustment') THEN
    UPDATE inventory_items 
    SET current_stock = current_stock + NEW.quantity 
    WHERE id = NEW.item_id;
  ELSIF NEW.transaction_type IN ('issue', 'discard') THEN
    UPDATE inventory_items 
    SET current_stock = current_stock - NEW.quantity 
    WHERE id = NEW.item_id;
  END IF;
  
  -- Update balance_after
  NEW.balance_after := (SELECT current_stock FROM inventory_items WHERE id = NEW.item_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_stock 
  BEFORE INSERT ON inventory_transactions
  FOR EACH ROW EXECUTE FUNCTION update_inventory_stock();

-- Function: Update linen stock on transaction
CREATE OR REPLACE FUNCTION update_linen_stock()
RETURNS TRIGGER AS $$
BEGIN
  CASE NEW.transaction_type
    WHEN 'issue_clean' THEN
      UPDATE linen_items 
      SET clean_stock = clean_stock - NEW.quantity 
      WHERE id = NEW.linen_id;
    WHEN 'return_soiled' THEN
      UPDATE linen_items 
      SET soiled_stock = soiled_stock + NEW.quantity 
      WHERE id = NEW.linen_id;
    WHEN 'send_laundry' THEN
      UPDATE linen_items 
      SET soiled_stock = soiled_stock - NEW.quantity,
          in_laundry = in_laundry + NEW.quantity
      WHERE id = NEW.linen_id;
    WHEN 'receive_laundry' THEN
      UPDATE linen_items 
      SET in_laundry = in_laundry - NEW.quantity,
          clean_stock = clean_stock + NEW.quantity
      WHERE id = NEW.linen_id;
    WHEN 'mark_damaged' THEN
      UPDATE linen_items 
      SET damaged_stock = damaged_stock + NEW.quantity,
          total_stock = total_stock - NEW.quantity
      WHERE id = NEW.linen_id;
    WHEN 'purchase' THEN
      UPDATE linen_items 
      SET total_stock = total_stock + NEW.quantity,
          clean_stock = clean_stock + NEW.quantity
      WHERE id = NEW.linen_id;
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_linen_stock 
  BEFORE INSERT ON linen_transactions
  FOR EACH ROW EXECUTE FUNCTION update_linen_stock();

-- Function: Auto-update room status when task status changes
CREATE OR REPLACE FUNCTION update_room_status_on_task()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'in_progress' AND OLD.status = 'pending' THEN
    UPDATE rooms SET status = 'cleaning' WHERE id = NEW.room_id;
  ELSIF NEW.status = 'completed' THEN
    UPDATE rooms SET status = 'vacant', current_staff_id = NULL WHERE id = NEW.room_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_room_status 
  AFTER UPDATE ON housekeeping_tasks
  FOR EACH ROW EXECUTE FUNCTION update_room_status_on_task();

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- Insert demo organization
INSERT INTO organizations (id, name, email) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Hotel', 'admin@demohotel.com');

-- Insert demo admin user (password will be set via Supabase Auth)
INSERT INTO users (id, org_id, email, full_name, full_name_ar, role) 
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'admin@demohotel.com',
  'Admin User',
  'مستخدم المسؤول',
  'admin'
);

COMMENT ON TABLE organizations IS 'Hotel/property organizations';
COMMENT ON TABLE users IS 'System users with role-based access';
COMMENT ON TABLE rooms IS 'Hotel rooms with status tracking';
COMMENT ON TABLE housekeeping_tasks IS 'Daily housekeeping task assignments';
COMMENT ON TABLE service_requests IS 'Guest requests and maintenance tickets';
COMMENT ON TABLE inventory_items IS 'Consumables and equipment inventory';
COMMENT ON TABLE inventory_transactions IS 'Inventory movement audit trail';
COMMENT ON TABLE linen_items IS 'Linen stock management';
COMMENT ON TABLE linen_transactions IS 'Linen movement and laundry tracking';
COMMENT ON TABLE audit_logs IS 'System-wide activity audit trail';
COMMENT ON TABLE notifications IS 'User notifications and alerts';
