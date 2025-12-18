-- Migration: Create Procurement Module (PI & GRN)
-- Date: 2025-12-14
-- Purpose: Purchase Invoice and Goods Received Note tracking

-- =====================================================
-- PURCHASE INVOICES
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  invoice_number VARCHAR(50) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  grand_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, submitted, received, partial, closed
  payment_status VARCHAR(20) DEFAULT 'unpaid', -- unpaid, partial, paid
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT purchase_invoices_org_number_unique UNIQUE (org_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_purchase_invoices_org ON purchase_invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_vendor ON purchase_invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status ON purchase_invoices(status);

-- =====================================================
-- PURCHASE INVOICE ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_invoice ON purchase_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_item ON purchase_invoice_items(item_id);

-- =====================================================
-- GOODS RECEIVED NOTES (GRN)
-- =====================================================
CREATE TABLE IF NOT EXISTS goods_received_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES purchase_invoices(id) ON DELETE RESTRICT,
  grn_number VARCHAR(50) NOT NULL,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_by UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, partial
  quality_check_status VARCHAR(20) DEFAULT 'pending', -- pending, passed, failed
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT grn_org_number_unique UNIQUE (org_id, grn_number)
);

CREATE INDEX IF NOT EXISTS idx_grn_org ON goods_received_notes(org_id);
CREATE INDEX IF NOT EXISTS idx_grn_invoice ON goods_received_notes(invoice_id);
CREATE INDEX IF NOT EXISTS idx_grn_status ON goods_received_notes(status);

-- =====================================================
-- GRN ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS grn_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_id UUID NOT NULL REFERENCES goods_received_notes(id) ON DELETE CASCADE,
  invoice_item_id UUID NOT NULL REFERENCES purchase_invoice_items(id) ON DELETE RESTRICT,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  ordered_quantity INTEGER NOT NULL,
  received_quantity INTEGER NOT NULL,
  accepted_quantity INTEGER NOT NULL DEFAULT 0,
  rejected_quantity INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10, 2) NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grn_items_grn ON grn_items(grn_id);
CREATE INDEX IF NOT EXISTS idx_grn_items_invoice_item ON grn_items(invoice_item_id);

-- =====================================================
-- TRIGGER: Auto-generate GRN Number
-- =====================================================
CREATE OR REPLACE FUNCTION generate_grn_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_grn_number VARCHAR(50);
BEGIN
  -- Get the next GRN number for the organization
  SELECT COALESCE(MAX(CAST(SUBSTRING(grn_number FROM 'GRN-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM goods_received_notes
  WHERE org_id = NEW.org_id;
  
  -- Generate GRN number: GRN-001, GRN-002, etc.
  new_grn_number := 'GRN-' || LPAD(next_number::TEXT, 3, '0');
  
  NEW.grn_number := new_grn_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_grn_number ON goods_received_notes;
CREATE TRIGGER trigger_generate_grn_number
  BEFORE INSERT ON goods_received_notes
  FOR EACH ROW
  WHEN (NEW.grn_number IS NULL OR NEW.grn_number = '')
  EXECUTE FUNCTION generate_grn_number();

-- =====================================================
-- TRIGGER: Update Inventory on GRN Acceptance
-- =====================================================
CREATE OR REPLACE FUNCTION update_inventory_on_grn()
RETURNS TRIGGER AS $$
BEGIN
  -- When a GRN item is accepted, update inventory stock
  IF NEW.accepted_quantity > 0 THEN
    UPDATE inventory_items
    SET 
      quantity_in_stock = quantity_in_stock + NEW.accepted_quantity,
      updated_at = now()
    WHERE id = NEW.item_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_inventory_on_grn ON grn_items;
CREATE TRIGGER trigger_update_inventory_on_grn
  AFTER INSERT OR UPDATE OF accepted_quantity ON grn_items
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_grn();

-- =====================================================
-- TRIGGER: Update PI Status based on GRN
-- =====================================================
CREATE OR REPLACE FUNCTION update_pi_status_on_grn()
RETURNS TRIGGER AS $$
DECLARE
  total_ordered INTEGER;
  total_received INTEGER;
BEGIN
  -- Calculate total ordered vs received for the invoice
  SELECT 
    SUM(pii.quantity),
    COALESCE(SUM(gi.accepted_quantity), 0)
  INTO total_ordered, total_received
  FROM purchase_invoice_items pii
  LEFT JOIN grn_items gi ON gi.invoice_item_id = pii.id
  WHERE pii.invoice_id = (
    SELECT invoice_id FROM goods_received_notes WHERE id = NEW.grn_id
  );
  
  -- Update invoice status
  IF total_received = 0 THEN
    UPDATE purchase_invoices SET status = 'submitted' 
    WHERE id = (SELECT invoice_id FROM goods_received_notes WHERE id = NEW.grn_id);
  ELSIF total_received < total_ordered THEN
    UPDATE purchase_invoices SET status = 'partial' 
    WHERE id = (SELECT invoice_id FROM goods_received_notes WHERE id = NEW.grn_id);
  ELSE
    UPDATE purchase_invoices SET status = 'received' 
    WHERE id = (SELECT invoice_id FROM goods_received_notes WHERE id = NEW.grn_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_pi_status_on_grn ON grn_items;
CREATE TRIGGER trigger_update_pi_status_on_grn
  AFTER INSERT OR UPDATE ON grn_items
  FOR EACH ROW
  EXECUTE FUNCTION update_pi_status_on_grn();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Purchase Invoices RLS
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view PIs in their org" ON purchase_invoices;
CREATE POLICY "Users can view PIs in their org"
  ON purchase_invoices FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage PIs in their org" ON purchase_invoices;
CREATE POLICY "Users can manage PIs in their org"
  ON purchase_invoices FOR ALL
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- Purchase Invoice Items RLS
ALTER TABLE purchase_invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view PI items" ON purchase_invoice_items;
CREATE POLICY "Users can view PI items"
  ON purchase_invoice_items FOR SELECT
  USING (
    invoice_id IN (SELECT id FROM purchase_invoices WHERE org_id IN (SELECT org_id FROM users WHERE id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can manage PI items" ON purchase_invoice_items;
CREATE POLICY "Users can manage PI items"
  ON purchase_invoice_items FOR ALL
  USING (
    invoice_id IN (SELECT id FROM purchase_invoices WHERE org_id IN (SELECT org_id FROM users WHERE id = auth.uid()))
  );

-- GRN RLS
ALTER TABLE goods_received_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view GRNs in their org" ON goods_received_notes;
CREATE POLICY "Users can view GRNs in their org"
  ON goods_received_notes FOR SELECT
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage GRNs in their org" ON goods_received_notes;
CREATE POLICY "Users can manage GRNs in their org"
  ON goods_received_notes FOR ALL
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- GRN Items RLS
ALTER TABLE grn_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view GRN items" ON grn_items;
CREATE POLICY "Users can view GRN items"
  ON grn_items FOR SELECT
  USING (
    grn_id IN (SELECT id FROM goods_received_notes WHERE org_id IN (SELECT org_id FROM users WHERE id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can manage GRN items" ON grn_items;
CREATE POLICY "Users can manage GRN items"
  ON grn_items FOR ALL
  USING (
    grn_id IN (SELECT id FROM goods_received_notes WHERE org_id IN (SELECT org_id FROM users WHERE id = auth.uid()))
  );
