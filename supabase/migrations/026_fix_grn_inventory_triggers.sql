-- Migration: Fix GRN inventory & PI status triggers for UPDATE/DELETE safety
-- Date: 2026-01-09
-- Purpose:
--   1) Ensure inventory stock updates use deltas on UPDATE (NEW-OLD)
--   2) Ensure inventory stock rolls back on DELETE
--   3) Ensure PI status recalculates on DELETE as well

-- =====================================================
-- TRIGGER: Update Inventory on GRN Acceptance (delta-safe)
-- =====================================================
CREATE OR REPLACE FUNCTION update_inventory_on_grn()
RETURNS TRIGGER AS $$
DECLARE
  delta INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    delta := COALESCE(NEW.accepted_quantity, 0);
  ELSIF TG_OP = 'UPDATE' THEN
    delta := COALESCE(NEW.accepted_quantity, 0) - COALESCE(OLD.accepted_quantity, 0);
  ELSIF TG_OP = 'DELETE' THEN
    delta := -COALESCE(OLD.accepted_quantity, 0);
  ELSE
    RETURN NULL;
  END IF;

  IF delta <> 0 THEN
    UPDATE inventory_items
    SET
      quantity_in_stock = quantity_in_stock + delta,
      updated_at = now()
    WHERE id = COALESCE(NEW.item_id, OLD.item_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_inventory_on_grn ON grn_items;
CREATE TRIGGER trigger_update_inventory_on_grn
  AFTER INSERT OR UPDATE OF accepted_quantity OR DELETE ON grn_items
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_grn();

-- =====================================================
-- TRIGGER: Update PI Status based on GRN (also on DELETE)
-- =====================================================
CREATE OR REPLACE FUNCTION update_pi_status_on_grn()
RETURNS TRIGGER AS $$
DECLARE
  total_ordered INTEGER;
  total_received INTEGER;
  target_grn_id UUID;
  target_invoice_id UUID;
BEGIN
  target_grn_id := COALESCE(NEW.grn_id, OLD.grn_id);

  SELECT invoice_id
  INTO target_invoice_id
  FROM goods_received_notes
  WHERE id = target_grn_id;

  IF target_invoice_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  SELECT
    SUM(pii.quantity),
    COALESCE(SUM(gi.accepted_quantity), 0)
  INTO total_ordered, total_received
  FROM purchase_invoice_items pii
  LEFT JOIN grn_items gi ON gi.invoice_item_id = pii.id
  WHERE pii.invoice_id = target_invoice_id;

  IF COALESCE(total_received, 0) = 0 THEN
    UPDATE purchase_invoices SET status = 'submitted'
    WHERE id = target_invoice_id;
  ELSIF total_received < total_ordered THEN
    UPDATE purchase_invoices SET status = 'partial'
    WHERE id = target_invoice_id;
  ELSE
    UPDATE purchase_invoices SET status = 'received'
    WHERE id = target_invoice_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_pi_status_on_grn ON grn_items;
CREATE TRIGGER trigger_update_pi_status_on_grn
  AFTER INSERT OR UPDATE OR DELETE ON grn_items
  FOR EACH ROW
  EXECUTE FUNCTION update_pi_status_on_grn();
