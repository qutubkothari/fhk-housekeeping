-- Disable RLS on users table to allow REST API access
-- Run this in Supabase SQL Editor

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
