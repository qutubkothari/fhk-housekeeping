-- Seed demo data for activity-based housekeeping
-- Run in Supabase SQL editor after migrations 021/022 are applied.
-- Safe to re-run: uses ON CONFLICT upserts and guard clauses.

-- Resolve org context once for all inserts
WITH org_cte AS (
  SELECT id AS org_id FROM organizations LIMIT 1
)
-- Shifts
INSERT INTO shifts (org_id, name, code, start_time, end_time, color, is_active)
SELECT org_id, name, code, start_time, end_time, color, TRUE
FROM org_cte
CROSS JOIN (
  VALUES
    ('Morning Shift', 'MS', '07:00:00'::time, '15:00:00'::time, '#3b82f6'),
    ('Evening Shift', 'ES', '15:00:00'::time, '23:00:00'::time, '#f59e0b'),
    ('Night Shift', 'NS', '23:00:00'::time, '07:00:00'::time, '#8b5cf6')
    ) AS s(name, code, start_time, end_time, color)
ON CONFLICT (org_id, code) DO UPDATE
SET name = EXCLUDED.name,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    color = EXCLUDED.color,
    is_active = TRUE,
    updated_at = NOW();

-- Locations
WITH org_cte AS (
  SELECT id AS org_id FROM organizations LIMIT 1
)
INSERT INTO locations (org_id, name, code, location_type, description, is_active)
SELECT org_id, name, code, location_type, description, TRUE
FROM org_cte
CROSS JOIN (
  VALUES
    ('Ground Floor', 'GF', 'floor', 'Ground floor rooms and facilities'),
    ('First Floor', '1F', 'floor', 'First floor rooms and facilities'),
    ('Second Floor', '2F', 'floor', 'Second floor rooms and facilities')
    ) AS l(name, code, location_type, description)
ON CONFLICT (org_id, code) DO UPDATE
SET name = EXCLUDED.name,
    location_type = EXCLUDED.location_type,
    description = EXCLUDED.description,
    is_active = TRUE,
    updated_at = NOW();

-- Activities
WITH org_cte AS (
  SELECT id AS org_id FROM organizations LIMIT 1
)
INSERT INTO housekeeping_activities (org_id, name, code, description, estimated_minutes, sequence_order, is_mandatory, is_active)
SELECT org_id, name, code, description, minutes, seq, TRUE, TRUE
FROM org_cte
CROSS JOIN (
  VALUES
    ('Dusting', 'DUST', 'Dust all surfaces including furniture, fixtures, and decorations', 15, 1),
    ('Bathroom Cleaning', 'BATH', 'Complete bathroom cleaning including toilet, sink, shower, and floor', 20, 2),
    ('Linen Change', 'LINEN', 'Replace bed linens, pillowcases, and towels', 15, 3),
    ('Vacuuming', 'VAC', 'Vacuum carpets and floors', 10, 4),
    ('Mopping', 'MOP', 'Mop hard floors', 10, 5),
    ('Amenities Restocking', 'AMEN', 'Restock toiletries, tea/coffee, and other amenities', 5, 6),
    ('Inspection', 'INSP', 'Final quality inspection of the room', 10, 7)
    ) AS a(name, code, description, minutes, seq)
ON CONFLICT (org_id, code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    estimated_minutes = EXCLUDED.estimated_minutes,
    sequence_order = EXCLUDED.sequence_order,
    is_mandatory = TRUE,
    is_active = TRUE,
    updated_at = NOW();

-- Optional: create a small demo assignment set if data exists
DO $$
DECLARE
  v_org UUID;
  v_shift UUID;
  v_supervisor UUID;
  v_rooms UUID[];
  v_staff UUID[];
  v_activities UUID[];
  v_room UUID;
  v_act UUID;
  v_assignment UUID;
  v_idx INT;
BEGIN
  SELECT id INTO v_org FROM organizations LIMIT 1;
  IF v_org IS NULL THEN
    RAISE NOTICE 'No organization found. Skipping demo assignments.';
    RETURN;
  END IF;

  -- Prefer supervisor/admin as the assigning user
  SELECT id INTO v_supervisor
  FROM users
  WHERE role IN ('super_admin', 'admin', 'supervisor')
  ORDER BY created_at
  LIMIT 1;

  IF v_supervisor IS NULL THEN
    RAISE NOTICE 'No admin/supervisor found. Skipping demo assignments.';
    RETURN;
  END IF;

  -- Pick any active shift for the org (optional)
  SELECT id INTO v_shift
  FROM shifts
  WHERE org_id = v_org AND is_active = TRUE
  ORDER BY start_time
  LIMIT 1;

  -- First three rooms in the org
  SELECT ARRAY(
    SELECT id FROM rooms
    WHERE org_id = v_org AND is_active = TRUE
    ORDER BY room_number
    LIMIT 3
  ) INTO v_rooms;

  -- First three staff users
  SELECT ARRAY(
    SELECT id FROM users
    WHERE role IN ('staff', 'cleaner')
    ORDER BY created_at
    LIMIT 3
  ) INTO v_staff;

  -- First four activities by sequence order
  SELECT ARRAY(
    SELECT id FROM housekeeping_activities
    WHERE org_id = v_org AND is_active = TRUE
    ORDER BY sequence_order
    LIMIT 4
  ) INTO v_activities;

  IF COALESCE(array_length(v_rooms, 1), 0) = 0 THEN
    RAISE NOTICE 'No rooms found. Skipping demo assignments.';
    RETURN;
  END IF;

  IF COALESCE(array_length(v_staff, 1), 0) = 0 THEN
    RAISE NOTICE 'No staff users found. Skipping demo assignments.';
    RETURN;
  END IF;

  IF COALESCE(array_length(v_activities, 1), 0) = 0 THEN
    RAISE NOTICE 'No activities found. Skipping demo assignments.';
    RETURN;
  END IF;

  -- Create one room_assignment per room
  FOREACH v_room IN ARRAY v_rooms LOOP
    INSERT INTO room_assignments (
      org_id,
      room_id,
      assignment_type,
      assigned_by,
      assignment_date,
      shift_id,
      target_completion_time,
      status,
      notes
    )
    VALUES (
      v_org,
      v_room,
      'before_arrival',
      v_supervisor,
      CURRENT_DATE,
      v_shift,
      NOW() + INTERVAL '2 hours',
      'pending',
      'Demo auto-generated assignment'
    )
    RETURNING id INTO v_assignment;

    -- Fan activities across available staff round-robin
    v_idx := 0;
    FOREACH v_act IN ARRAY v_activities LOOP
      v_idx := v_idx + 1;
      INSERT INTO activity_assignments (
        room_assignment_id,
        activity_id,
        assigned_to,
        status
      )
      VALUES (
        v_assignment,
        v_act,
        v_staff[((v_idx - 1) % GREATEST(array_length(v_staff, 1), 1)) + 1],
        'pending'
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Demo assignments created: % rooms × % activities (round-robin across % staff).',
    COALESCE(array_length(v_rooms, 1), 0),
    COALESCE(array_length(v_activities, 1), 0),
    COALESCE(array_length(v_staff, 1), 0);
END $$;
