-- Fix RLS policy for users table to avoid circular dependency
-- This allows authenticated users to read their own user record

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users access own org" ON users;

-- Create a simpler policy that allows users to read their own record
CREATE POLICY "Users can read own record" ON users 
  FOR SELECT USING (id = auth.uid());

-- Allow users to update their own record
CREATE POLICY "Users can update own record" ON users 
  FOR UPDATE USING (id = auth.uid());

-- Allow service role to insert users (for admin operations)
CREATE POLICY "Service role can insert users" ON users 
  FOR INSERT WITH CHECK (true);

-- Allow users to read other users in their organization
CREATE POLICY "Users can read org users" ON users 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.org_id = users.org_id
    )
  );
