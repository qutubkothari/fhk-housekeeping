-- Add bed_type column to rooms table
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
