-- ============================================================================
-- Add Existing Organizations to Supabase Auth > Users
-- This script identifies organizations that need Auth users created
-- ============================================================================
-- 
-- IMPORTANT: Direct insertion into auth.users is complex due to password
-- hashing requirements. This script provides:
-- 1. A query to identify organizations needing Auth users
-- 2. Instructions for bulk user creation via Admin API
-- 3. A helper function to check which organizations have Auth users
-- 
-- ============================================================================

-- Step 1: Check which organizations already have Auth users
-- This query shows organizations and whether they have corresponding Auth users
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  o.email as organization_email,
  CASE 
    WHEN au.id IS NOT NULL THEN 'Has Auth User'
    ELSE 'Missing Auth User'
  END as auth_status,
  au.id as auth_user_id,
  au.email_confirmed_at,
  au.created_at as auth_user_created
FROM public.organizations o
LEFT JOIN auth.users au ON LOWER(TRIM(au.email)) = LOWER(TRIM(o.email))
WHERE o.email IS NOT NULL 
  AND o.email != ''
  AND TRIM(o.email) != ''
ORDER BY 
  CASE WHEN au.id IS NOT NULL THEN 1 ELSE 0 END,
  o.name;

-- Step 2: List organizations that NEED Auth users created
-- This query lists only organizations without Auth users
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  o.email as organization_email,
  o.account_status,
  o.is_active
FROM public.organizations o
LEFT JOIN auth.users au ON LOWER(TRIM(au.email)) = LOWER(TRIM(o.email))
WHERE o.email IS NOT NULL 
  AND o.email != ''
  AND TRIM(o.email) != ''
  AND au.id IS NULL
ORDER BY o.name;

-- Step 3: Create a helper function to check Auth user existence
CREATE OR REPLACE FUNCTION check_org_auth_user_status()
RETURNS TABLE (
  organization_id UUID,
  organization_name TEXT,
  organization_email TEXT,
  has_auth_user BOOLEAN,
  auth_user_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.email,
    CASE WHEN au.id IS NOT NULL THEN TRUE ELSE FALSE END,
    au.id
  FROM public.organizations o
  LEFT JOIN auth.users au ON LOWER(TRIM(au.email)) = LOWER(TRIM(o.email))
  WHERE o.email IS NOT NULL 
    AND o.email != ''
    AND TRIM(o.email) != ''
  ORDER BY o.name;
END;
$$;

-- Usage: SELECT * FROM check_org_auth_user_status();

-- Step 4: Get count summary
SELECT 
  COUNT(*) as total_organizations,
  COUNT(au.id) as organizations_with_auth_users,
  COUNT(*) - COUNT(au.id) as organizations_needing_auth_users
FROM public.organizations o
LEFT JOIN auth.users au ON LOWER(TRIM(au.email)) = LOWER(TRIM(o.email))
WHERE o.email IS NOT NULL 
  AND o.email != ''
  AND TRIM(o.email) != '';

-- ============================================================================
-- IMPORTANT: Bulk User Creation Instructions
-- ============================================================================
--
-- Due to password hashing complexity, you have two options:
--
-- OPTION 1: Use Supabase Admin API (Recommended)
-- 1. Use the Supabase Management API with service role key
-- 2. For each organization from Step 2, call:
--    POST https://[project-ref].supabase.co/auth/v1/admin/users
--    Headers: {
--      "apikey": "[service-role-key]",
--      "Authorization": "Bearer [service-role-key]",
--      "Content-Type": "application/json"
--    }
--    Body: {
--      "email": "[organization-email]",
--      "email_confirm": true,
--      "user_metadata": { "is_org_officer": true }
--    }
--
-- OPTION 2: Use Admin Dashboard
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" for each organization email
-- 3. Set email, confirm email, and add metadata: { "is_org_officer": true }
--
-- OPTION 3: Trigger activation from Admin Dashboard (Automatic)
-- 1. Use the "Activate Organization" button in admin-dashboard.html
-- 2. This will automatically create the Auth user if it doesn't exist
-- 3. The activation email will be sent automatically
--
-- ============================================================================

