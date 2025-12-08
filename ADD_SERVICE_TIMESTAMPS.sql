-- Add start and completion tracking for service requests
-- This allows tracking actual work time for maintenance requests

ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

COMMENT ON COLUMN service_requests.started_at IS 'When maintenance/staff started working on this request';
COMMENT ON COLUMN service_requests.completed_at IS 'When the work was actually completed';

-- Success message
SELECT 'Service request timestamps added successfully' as result;
