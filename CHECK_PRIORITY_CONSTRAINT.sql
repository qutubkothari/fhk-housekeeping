-- Check the priority constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'housekeeping_tasks'::regclass
    AND conname LIKE '%priority%';
