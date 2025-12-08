-- Check valid task types
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'housekeeping_tasks'::regclass
    AND conname LIKE '%task_type%';

-- Check existing task types in the table
SELECT DISTINCT task_type FROM housekeeping_tasks LIMIT 10;
