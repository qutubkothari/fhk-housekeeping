-- Create linen_inventory table
CREATE TABLE IF NOT EXISTS linen_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  item_name VARCHAR(255) NOT NULL,
  item_type VARCHAR(100),
  clean_quantity INTEGER DEFAULT 0,
  soiled_quantity INTEGER DEFAULT 0,
  in_laundry_quantity INTEGER DEFAULT 0,
  total_quantity INTEGER GENERATED ALWAYS AS (clean_quantity + soiled_quantity + in_laundry_quantity) STORED,
  unit VARCHAR(50) DEFAULT 'pieces',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_linen_inventory_org_id ON linen_inventory(org_id);

-- Insert test data
INSERT INTO linen_inventory (org_id, item_name, item_type, clean_quantity, soiled_quantity, in_laundry_quantity, unit, notes)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Bed Sheets - King', 'Bedding', 50, 15, 10, 'pieces', 'White cotton 300 thread count'),
  ('00000000-0000-0000-0000-000000000001', 'Bed Sheets - Queen', 'Bedding', 45, 20, 8, 'pieces', 'White cotton 300 thread count'),
  ('00000000-0000-0000-0000-000000000001', 'Pillow Cases', 'Bedding', 120, 30, 25, 'pieces', 'Standard size white cotton'),
  ('00000000-0000-0000-0000-000000000001', 'Bath Towels', 'Towels', 80, 40, 15, 'pieces', 'White terry cloth'),
  ('00000000-0000-0000-0000-000000000001', 'Hand Towels', 'Towels', 100, 35, 20, 'pieces', 'White terry cloth'),
  ('00000000-0000-0000-0000-000000000001', 'Face Towels', 'Towels', 150, 45, 30, 'pieces', 'White terry cloth'),
  ('00000000-0000-0000-0000-000000000001', 'Bath Mat', 'Towels', 60, 20, 10, 'pieces', 'Non-slip white bath mat'),
  ('00000000-0000-0000-0000-000000000001', 'Duvet Covers - King', 'Bedding', 30, 10, 5, 'pieces', 'White cotton'),
  ('00000000-0000-0000-0000-000000000001', 'Duvet Covers - Queen', 'Bedding', 35, 12, 6, 'pieces', 'White cotton'),
  ('00000000-0000-0000-0000-000000000001', 'Blankets', 'Bedding', 40, 8, 4, 'pieces', 'Warm fleece blankets'),
  ('00000000-0000-0000-0000-000000000001', 'Table Cloth', 'Dining', 25, 10, 5, 'pieces', 'White linen table cloths'),
  ('00000000-0000-0000-0000-000000000001', 'Napkins', 'Dining', 200, 80, 40, 'pieces', 'White cotton napkins');
