-- Make item_code optional since the app doesn't generate it
ALTER TABLE inventory_items ALTER COLUMN item_code DROP NOT NULL;
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_org_id_item_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS inventory_items_org_id_item_code_unique 
  ON inventory_items(org_id, item_code) 
  WHERE item_code IS NOT NULL;-- Add bed_type column to rooms table
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS bed_type VARCHAR(50) DEFAULT 'twin';

-- Update existing rooms to have a bed_type based on room_type
UPDATE rooms 
SET bed_type = CASE
  WHEN room_type = 'suite' OR room_type = 'executive' THEN 'king'
  WHEN room_type = 'deluxe' THEN 'queen'
  ELSE 'twin'
END
WHERE bed_type IS NULL;
