-- Make item_code optional since the app doesn't generate it
ALTER TABLE inventory_items ALTER COLUMN item_code DROP NOT NULL;
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_org_id_item_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS inventory_items_org_id_item_code_unique 
  ON inventory_items(org_id, item_code) 
  WHERE item_code IS NOT NULL;
