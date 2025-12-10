-- ============================================================================
-- FIX EXISTING USER ROLES (One-time fix)
-- ============================================================================
-- This script creates user_roles records for organizations that are already
-- activated but don't have corresponding user_roles records
--
-- IMPORTANT: Run this AFTER running auto_create_user_role_trigger.sql
-- ============================================================================

-- Step 1: Create user_roles for activated organizations missing roles
INSERT INTO user_roles (user_id, organization_id, role)
SELECT 
  au.id as user_id,
  o.id as organization_id,
  'org_officer' as role
FROM organizations o
INNER JOIN auth.users au ON au.email = o.email
LEFT JOIN user_roles ur ON ur.user_id = au.id
WHERE (o.account_status = 'Account Activated' OR o.is_active = true)
  AND ur.id IS NULL  -- Only insert if role doesn't exist
ON CONFLICT (user_id) 
DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  role = 'org_officer',
  updated_at = NOW();

-- Step 2: Update existing user_roles that might have wrong organization_id
UPDATE user_roles ur
SET 
  organization_id = o.id,
  role = 'org_officer',
  updated_at = NOW()
FROM organizations o
INNER JOIN auth.users au ON au.email = o.email
WHERE ur.user_id = au.id
  AND (o.account_status = 'Account Activated' OR o.is_active = true)
  AND (ur.organization_id IS NULL OR ur.organization_id != o.id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check which organizations are activated but missing user_roles:
-- SELECT 
--   o.id as org_id,
--   o.name as org_name,
--   o.email as org_email,
--   o.account_status,
--   o.is_active,
--   au.id as auth_user_id,
--   CASE WHEN au.id IS NULL THEN 'No Auth User' ELSE 'Auth User Found' END as auth_status,
--   ur.id as user_role_id,
--   CASE WHEN ur.id IS NULL THEN 'MISSING ROLE' ELSE 'Role Exists' END as role_status,
--   ur.role
-- FROM organizations o
-- LEFT JOIN auth.users au ON au.email = o.email
-- LEFT JOIN user_roles ur ON ur.user_id = au.id
-- WHERE (o.account_status = 'Account Activated' OR o.is_active = true)
-- ORDER BY 
--   CASE WHEN ur.id IS NULL THEN 0 ELSE 1 END,  -- Missing roles first
--   o.name;

-- Count summary:
-- SELECT 
--   COUNT(*) as total_activated_orgs,
--   COUNT(au.id) as orgs_with_auth_users,
--   COUNT(ur.id) as orgs_with_roles,
--   COUNT(*) - COUNT(ur.id) as missing_roles
-- FROM organizations o
-- LEFT JOIN auth.users au ON au.email = o.email
-- LEFT JOIN user_roles ur ON ur.user_id = au.id
-- WHERE (o.account_status = 'Account Activated' OR o.is_active = true);

