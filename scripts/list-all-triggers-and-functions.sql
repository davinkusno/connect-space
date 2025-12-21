-- List all triggers in the database
-- Run this in Supabase SQL Editor to see what triggers exist

-- ============================================
-- LIST ALL TRIGGERS
-- ============================================
SELECT 
  t.tgname AS trigger_name,
  t.tgrelid::regclass AS table_name,
  p.proname AS function_name,
  CASE t.tgtype::integer & 1
    WHEN 1 THEN 'ROW'
    ELSE 'STATEMENT'
  END AS level,
  CASE t.tgtype::integer & 66
    WHEN 2 THEN 'BEFORE'
    WHEN 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END AS timing,
  CASE 
    WHEN t.tgtype::integer & 4 = 4 THEN 'INSERT'
    WHEN t.tgtype::integer & 8 = 8 THEN 'DELETE'
    WHEN t.tgtype::integer & 16 = 16 THEN 'UPDATE'
    ELSE 'UNKNOWN'
  END AS event,
  CASE t.tgenabled
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
    WHEN 'R' THEN 'REPLICA'
    WHEN 'A' THEN 'ALWAYS'
    ELSE 'UNKNOWN'
  END AS status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE NOT t.tgisinternal  -- Exclude internal triggers
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')  -- Exclude system schemas
ORDER BY t.tgrelid::regclass::text, t.tgname;

-- ============================================
-- LIST ALL CUSTOM FUNCTIONS
-- ============================================
SELECT 
  p.proname AS function_name,
  n.nspname AS schema_name,
  pg_get_function_result(p.oid) AS return_type,
  pg_get_function_arguments(p.oid) AS arguments,
  CASE p.provolatile
    WHEN 'i' THEN 'IMMUTABLE'
    WHEN 's' THEN 'STABLE'
    WHEN 'v' THEN 'VOLATILE'
  END AS volatility,
  CASE p.prosecdef
    WHEN true THEN 'DEFINER'
    ELSE 'INVOKER'
  END AS security,
  obj_description(p.oid, 'pg_proc') AS description
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'  -- Only public schema
  AND p.prokind = 'f'  -- Only functions (not procedures)
ORDER BY p.proname;

-- ============================================
-- SHOW ALL FUNCTION SOURCE CODE
-- ============================================
-- This shows the complete definition of all custom functions
SELECT 
  p.proname AS function_name,
  n.nspname AS schema_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'  -- Only public schema
  AND p.prokind = 'f'  -- Only functions (not procedures)
ORDER BY p.proname;

-- ============================================
-- SHOW SPECIFIC FUNCTION SOURCE CODE
-- ============================================
-- Uncomment to see a specific function's code:

-- Show handle_new_user function
-- SELECT pg_get_functiondef(oid) AS function_definition
-- FROM pg_proc
-- WHERE proname = 'handle_new_user';

-- Show handle_user_update function
-- SELECT pg_get_functiondef(oid) AS function_definition
-- FROM pg_proc
-- WHERE proname = 'handle_user_update';

-- Show update_updated_at_column function
-- SELECT pg_get_functiondef(oid) AS function_definition
-- FROM pg_proc
-- WHERE proname = 'update_updated_at_column';

-- ============================================
-- CHECK SPECIFIC TRIGGER EXISTENCE
-- ============================================
SELECT 
  EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) AS trigger_exists,
  EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'handle_new_user'
      AND n.nspname = 'public'
  ) AS function_exists;

-- ============================================
-- LIST TRIGGERS ON SPECIFIC TABLE
-- ============================================
-- Check triggers on auth.users table (important for signup)
SELECT 
  t.tgname AS trigger_name,
  p.proname AS function_name,
  CASE t.tgtype::integer & 66
    WHEN 2 THEN 'BEFORE'
    WHEN 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END AS timing,
  CASE t.tgenabled
    WHEN 'O' THEN 'ENABLED'
    ELSE 'DISABLED'
  END AS status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'auth.users'::regclass
  AND NOT t.tgisinternal;

