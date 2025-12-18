-- Migration: Create Substore Inventory Tracking
-- Date: 2025-12-14
-- Purpose: Main Store → Substore → Floor tracking

-- =====================================================
-- SUBSTORES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS substores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'laundry', -- laundry, pantry, maintenance, etc.
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT substores_org_code_unique UNIQUE (org_id, code)
);

CREATE INDEX IF NOT EXISTS idx_substores_org ON substores(org_id);
CREATE INDEX IF NOT EXISTS idx_substores_location ON substores(location_id);

-- =====================================================
-- ADD SUBSTORE TO INVENTORY ITEMS
-- =====================================================
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS substore_id UUID REFERENCES substores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_items_substore ON inventory_items(substore_id);

-- =====================================================
-- ADD SUBSTORE TO LINEN ITEMS  
-- =====================================================
ALTER TABLE linen_items 
ADD COLUMN IF NOT EXISTS substore_id UUID REFERENCES substores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_linen_items_substore ON linen_items(substore_id);

-- =====================================================
-- SUBSTORE TRANSFERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS substore_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  transfer_number VARCHAR(50) NOT NULL,
  transfer_type VARCHAR(20) NOT NULL, -- 'main_to_sub', 'sub_to_floor', 'sub_to_sub'
  from_location VARCHAR(50) NOT NULL, -- 'main_store' or substore_id
  to_location VARCHAR(50) NOT NULL, -- substore_id or 'floor'
  substore_id UUID REFERENCES substores(id) ON DELETE SET NULL,
  item_id UUID, -- Can be inventory_item or linen_item
  item_type VARCHAR(20) NOT NULL, -- 'inventory' or 'linen'
  quantity INTEGER NOT NULL,
  transferred_by UUID NOT NULL REFERENCES users(id),
  transferred_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT substore_transfers_org_number_unique UNIQUE (org_id, transfer_number)
);

CREATE INDEX IF NOT EXISTS idx_substore_transfers_org ON substore_transfers(org_id);
CREATE INDEX IF NOT EXISTS idx_substore_transfers_substore ON substore_transfers(substore_id);
CREATE INDEX IF NOT EXISTS idx_substore_transfers_type ON substore_transfers(transfer_type);

-- =====================================================
-- TRIGGER: Auto-generate Transfer Number
-- =====================================================
CREATE OR REPLACE FUNCTION generate_transfer_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_transfer_number VARCHAR(50);
BEGIN
  -- Get next transfer number for the organization
  SELECT COALESCE(MAX(CAST(SUBSTRING(transfer_number FROM 'TRF-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM substore_transfers
  WHERE org_id = NEW.org_id;
  
  -- Generate transfer number: TRF-001, TRF-002, etc.
  new_transfer_number := 'TRF-' || LPAD(next_number::TEXT, 3, '0');
  
  NEW.transfer_number := new_transfer_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_transfer_number ON substore_transfers;
CREATE TRIGGER trigger_generate_transfer_number
  BEFORE INSERT ON substore_transfers
  FOR EACH ROW
  WHEN (NEW.transfer_number IS NULL OR NEW.transfer_number = '')
  EXECUTE FUNCTION generate_transfer_number();

-- =====================================================
-- TRIGGER: Update Stock on Transfer
-- =====================================================
CREATE OR REPLACE FUNCTION update_stock_on_transfer()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.item_type = 'inventory' THEN
    -- Main Store → Substore: Increase substore stock
    IF NEW.transfer_type = 'main_to_sub' THEN
      UPDATE inventory_items
      SET 
        quantity_in_stock = quantity_in_stock + NEW.quantity,
        substore_id = NEW.substore_id
      WHERE id = NEW.item_id;
    
    -- Substore → Floor: Decrease substore stock
    ELSIF NEW.transfer_type = 'sub_to_floor' THEN
      UPDATE inventory_items
      SET quantity_in_stock = quantity_in_stock - NEW.quantity
      WHERE id = NEW.item_id AND substore_id = NEW.substore_id;
    END IF;
    
  ELSIF NEW.item_type = 'linen' THEN
    -- Main Store → Substore: Increase substore stock
    IF NEW.transfer_type = 'main_to_sub' THEN
      UPDATE linen_items
      SET 
        quantity_in_stock = quantity_in_stock + NEW.quantity,
        substore_id = NEW.substore_id
      WHERE id = NEW.item_id;
    
    -- Substore → Floor: Decrease substore stock
    ELSIF NEW.transfer_type = 'sub_to_floor' THEN
      UPDATE linen_items
      SET quantity_in_stock = quantity_in_stock - NEW.quantity
      WHERE id = NEW.item_id AND substore_id = NEW.substore_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stock_on_transfer ON substore_transfers;
CREATE TRIGGER trigger_update_stock_on_transfer
  AFTER INSERT ON substore_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_transfer();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Substores RLS
ALTER TABLE substores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view substores in their org" ON substores;
CREATE POLICY "Users can view substores in their org"
  ON substores FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage substores" ON substores;
CREATE POLICY "Admins can manage substores"
  ON substores FOR ALL
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- Substore Transfers RLS
ALTER TABLE substore_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view transfers in their org" ON substore_transfers;
CREATE POLICY "Users can view transfers in their org"
  ON substore_transfers FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can create transfers in their org" ON substore_transfers;
CREATE POLICY "Users can create transfers in their org"
  ON substore_transfers FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));
