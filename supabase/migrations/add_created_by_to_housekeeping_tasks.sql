-- Add created_by column to housekeeping_tasks
ALTER TABLE housekeeping_tasks 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Set created_by for existing tasks to assigned_by if it exists
UPDATE housekeeping_tasks 
SET created_by = assigned_by 
WHERE created_by IS NULL AND assigned_by IS NOT NULL;
