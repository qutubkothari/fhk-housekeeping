-- Fix service_requests constraint to allow all request types used in the app
ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS service_requests_request_type_check;
ALTER TABLE service_requests ADD CONSTRAINT service_requests_request_type_check 
  CHECK (request_type IN ('guest_request', 'breakdown', 'maintenance', 'housekeeping', 'plumbing', 'electrical', 'hvac', 'other'));
