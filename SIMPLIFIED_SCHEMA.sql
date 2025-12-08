-- ============================================
-- SIMPLIFIED ENTERPRISE SCHEMA
-- Clean, professional, trackable
-- ============================================

-- ASSETS TABLE (AC, Fridge, Iron, etc.)
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_code TEXT NOT NULL UNIQUE, -- AC001, FRIDGE023, IRON045
  asset_type TEXT NOT NULL CHECK (asset_type IN ('ac', 'fridge', 'iron', 'tv', 'kettle', 'microwave', 'heater', 'other')),
  brand TEXT,
  model TEXT,
  purchase_date DATE,
  warranty_expiry DATE,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'maintenance', 'retired')),
  current_room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assets_room ON assets(current_room_id) WHERE current_room_id IS NOT NULL;
CREATE INDEX idx_assets_type_status ON assets(asset_type, status);

-- ASSET MAINTENANCE HISTORY
CREATE TABLE IF NOT EXISTS asset_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  service_request_id UUID REFERENCES service_requests(id) ON DELETE SET NULL,
  issue_description TEXT NOT NULL,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  resolution TEXT,
  cost DECIMAL(10,2),
  downtime_hours DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_asset_maintenance_asset ON asset_maintenance(asset_id);

-- STORE CHECKOUT TRANSACTIONS
CREATE TABLE IF NOT EXISTS store_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  transaction_type TEXT DEFAULT 'checkout' CHECK (transaction_type IN ('checkout', 'return')),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  items JSONB NOT NULL, -- [{item_id, quantity, unit}]
  total_items INTEGER NOT NULL,
  notes TEXT,
  checked_out_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_store_transactions_staff ON store_transactions(staff_id, checked_out_at);
CREATE INDEX idx_store_transactions_date ON store_transactions(checked_out_at);

-- ROOM WORK SESSIONS (Clean tracking for housekeeping/maintenance)
CREATE TABLE IF NOT EXISTS work_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  session_type TEXT NOT NULL CHECK (session_type IN ('housekeeping', 'maintenance')),
  task_id UUID REFERENCES housekeeping_tasks(id) ON DELETE SET NULL,
  service_request_id UUID REFERENCES service_requests(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stopped_at TIMESTAMPTZ,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN stopped_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (stopped_at - started_at))/60 
      ELSE NULL 
    END
  ) STORED,
  issues_found JSONB DEFAULT '[]'::jsonb, -- [{ category, description }]
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paused')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_work_sessions_staff ON work_sessions(staff_id, started_at);
CREATE INDEX idx_work_sessions_room ON work_sessions(room_id, started_at);
CREATE INDEX idx_work_sessions_active ON work_sessions(staff_id, status) WHERE status = 'in_progress';

-- Add columns to existing tables
ALTER TABLE housekeeping_tasks 
  ADD COLUMN IF NOT EXISTS work_session_id UUID REFERENCES work_sessions(id) ON DELETE SET NULL;

ALTER TABLE service_requests 
  ADD COLUMN IF NOT EXISTS work_session_id UUID REFERENCES work_sessions(id) ON DELETE SET NULL;

-- AI TRACKING: Consumption patterns
CREATE TABLE IF NOT EXISTS consumption_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_quantity DECIMAL(10,2) NOT NULL,
  transaction_count INTEGER NOT NULL,
  average_per_transaction DECIMAL(10,2),
  flag_status TEXT CHECK (flag_status IN ('normal', 'high_usage', 'excessive')),
  ai_recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, item_id, period_start, period_end)
);

-- AI TRACKING: Asset reliability
CREATE TABLE IF NOT EXISTS asset_reliability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  maintenance_count INTEGER NOT NULL DEFAULT 0,
  total_downtime_hours DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  reliability_score DECIMAL(5,2), -- 0-100
  flag_status TEXT CHECK (flag_status IN ('good', 'warning', 'critical')),
  ai_recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asset_id, period_start, period_end)
);

CREATE INDEX idx_consumption_staff ON consumption_analytics(staff_id, period_start);
CREATE INDEX idx_asset_reliability_asset ON asset_reliability(asset_id, period_start);
