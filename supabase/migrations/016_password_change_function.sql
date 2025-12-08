-- Migration: Add password change function
-- Created: 2024-01-16
-- Description: Function to allow users to change their password

-- Drop function if exists
DROP FUNCTION IF EXISTS change_user_password(UUID, TEXT, TEXT);

-- Create password change function
CREATE OR REPLACE FUNCTION change_user_password(
  p_user_id UUID,
  p_old_password TEXT,
  p_new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_password_hash TEXT;
BEGIN
  -- Get current password hash
  SELECT password_hash INTO v_current_password_hash
  FROM users
  WHERE id = p_user_id;

  -- Verify old password matches
  IF NOT (v_current_password_hash = crypt(p_old_password, v_current_password_hash)) THEN
    RAISE EXCEPTION 'Current password is incorrect';
  END IF;

  -- Update to new password
  UPDATE users
  SET 
    password_hash = crypt(p_new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION change_user_password(UUID, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION change_user_password IS 'Allows users to change their password after verifying their current password';
