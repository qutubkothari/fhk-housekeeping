-- General activity assignments (non-room tasks like passages cleaning)
-- This is additive and doesn't change existing room-based assignment flow.

CREATE TABLE IF NOT EXISTS public.general_activity_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  assignment_date date NOT NULL DEFAULT CURRENT_DATE,

  activity_id uuid NOT NULL REFERENCES public.housekeeping_activities(id) ON DELETE RESTRICT,
  assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_by uuid REFERENCES public.users(id) ON DELETE SET NULL,

  assignment_type text NOT NULL DEFAULT 'before_arrival',
  shift_id uuid REFERENCES public.shifts(id) ON DELETE SET NULL,
  target_completion_time time,

  status text NOT NULL DEFAULT 'pending',
  notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_general_activity_assignments_org_date
  ON public.general_activity_assignments (org_id, assignment_date);

CREATE INDEX IF NOT EXISTS idx_general_activity_assignments_assigned_to
  ON public.general_activity_assignments (assigned_to);

CREATE INDEX IF NOT EXISTS idx_general_activity_assignments_activity
  ON public.general_activity_assignments (activity_id);

-- Keep consistent with project pattern (direct auth): disable RLS
ALTER TABLE public.general_activity_assignments DISABLE ROW LEVEL SECURITY;

-- Basic grants (align with other migrations in this repo)
GRANT ALL ON TABLE public.general_activity_assignments TO anon;
GRANT ALL ON TABLE public.general_activity_assignments TO authenticated;
GRANT ALL ON TABLE public.general_activity_assignments TO service_role;

-- updated_at trigger (idempotent)
-- Use CREATE OR REPLACE so this can be rerun safely.
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trg_general_activity_assignments_updated_at ON public.general_activity_assignments;
CREATE TRIGGER trg_general_activity_assignments_updated_at
BEFORE UPDATE ON public.general_activity_assignments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();
