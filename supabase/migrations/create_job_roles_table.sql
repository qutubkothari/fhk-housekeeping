-- Create job_roles table
CREATE TABLE IF NOT EXISTS job_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, code)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_roles_org_id ON job_roles(org_id);
CREATE INDEX IF NOT EXISTS idx_job_roles_is_active ON job_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_job_roles_department ON job_roles(department);

-- Disable RLS (using direct auth instead)
ALTER TABLE job_roles DISABLE ROW LEVEL SECURITY;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_job_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_roles_updated_at
  BEFORE UPDATE ON job_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_job_roles_updated_at();
