-- Migration: Create Vendor Management Tables
-- Date: 2025-12-14
-- Purpose: Multi-vendor support for inventory items

-- =====================================================
-- VENDORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  tax_id VARCHAR(50),
  payment_terms VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT vendors_org_code_unique UNIQUE (org_id, code)
);

CREATE INDEX IF NOT EXISTS idx_vendors_org_active ON vendors(org_id, is_active);

-- =====================================================
-- ITEM-VENDOR JUNCTION TABLE (Many-to-Many)
-- =====================================================
CREATE TABLE IF NOT EXISTS item_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  unit_price DECIMAL(10, 2),
  lead_time_days INTEGER,
  min_order_quantity INTEGER,
  is_preferred BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT item_vendors_unique UNIQUE (item_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_item_vendors_item ON item_vendors(item_id);
CREATE INDEX IF NOT EXISTS idx_item_vendors_vendor ON item_vendors(vendor_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Vendors RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view vendors in their org" ON vendors;
CREATE POLICY "Users can view vendors in their org"
  ON vendors FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can insert vendors" ON vendors;
CREATE POLICY "Admins can insert vendors"
  ON vendors FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update vendors" ON vendors;
CREATE POLICY "Admins can update vendors"
  ON vendors FOR UPDATE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can delete vendors" ON vendors;
CREATE POLICY "Admins can delete vendors"
  ON vendors FOR DELETE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- Item-Vendors RLS
ALTER TABLE item_vendors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view item-vendor mappings" ON item_vendors;
CREATE POLICY "Users can view item-vendor mappings"
  ON item_vendors FOR SELECT
  USING (
    item_id IN (SELECT id FROM inventory_items WHERE org_id IN (SELECT org_id FROM users WHERE id = auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can manage item-vendor mappings" ON item_vendors;
CREATE POLICY "Admins can manage item-vendor mappings"
  ON item_vendors FOR ALL
  USING (
    item_id IN (SELECT id FROM inventory_items WHERE org_id IN (SELECT org_id FROM users WHERE id = auth.uid()))
  );
