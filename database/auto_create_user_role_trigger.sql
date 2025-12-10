-- ============================================================================
-- AUTO CREATE USER ROLE TRIGGER
-- ============================================================================
-- This trigger automatically creates a user_roles record when an organization's
-- account_status is set to 'Account Activated'
--
-- IMPORTANT: This bypasses RLS issues by running as a database function
-- ============================================================================

-- Step 1: Create a function that creates the user_roles record
-- This function uses SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION auto_create_user_role()
RETURNS TRIGGER AS $$
DECLARE
  auth_user_id UUID;
BEGIN
  -- Only proceed if account_status was changed to 'Account Activated'
  IF NEW.account_status = 'Account Activated' AND 
     (OLD.account_status IS DISTINCT FROM NEW.account_status OR OLD.account_status IS NULL) THEN
    
    -- Find the auth.users record by matching email
    SELECT id INTO auth_user_id
    FROM auth.users
    WHERE email = NEW.email
    LIMIT 1;
    
    -- If we found a matching auth user, create the user_roles record
    IF auth_user_id IS NOT NULL THEN
      -- Use INSERT ... ON CONFLICT to handle case where role already exists
      INSERT INTO user_roles (user_id, organization_id, role)
      VALUES (auth_user_id, NEW.id, 'org_officer')
      ON CONFLICT (user_id) 
      DO UPDATE SET
        organization_id = NEW.id,
        role = 'org_officer',
        updated_at = NOW();
      
      RAISE NOTICE 'Created/updated user_roles for user_id: %, organization_id: %', auth_user_id, NEW.id;
    ELSE
      RAISE NOTICE 'No auth.users record found for email: %. User role will be created on first login.', NEW.email;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger on organizations table
DROP TRIGGER IF EXISTS trigger_auto_create_user_role ON organizations;

CREATE TRIGGER trigger_auto_create_user_role
  AFTER UPDATE OF account_status, is_active ON organizations
  FOR EACH ROW
  WHEN (NEW.account_status = 'Account Activated' OR NEW.is_active = true)
  EXECUTE FUNCTION auto_create_user_role();

-- Step 3: Also create a trigger that runs on INSERT in case account_status is set during insert
CREATE OR REPLACE FUNCTION auto_create_user_role_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  auth_user_id UUID;
BEGIN
  -- Only proceed if account_status is 'Account Activated' or is_active is true
  IF (NEW.account_status = 'Account Activated' OR NEW.is_active = true) AND NEW.email IS NOT NULL THEN
    
    -- Find the auth.users record by matching email
    SELECT id INTO auth_user_id
    FROM auth.users
    WHERE email = NEW.email
    LIMIT 1;
    
    -- If we found a matching auth user, create the user_roles record
    IF auth_user_id IS NOT NULL THEN
      -- Use INSERT ... ON CONFLICT to handle case where role already exists
      INSERT INTO user_roles (user_id, organization_id, role)
      VALUES (auth_user_id, NEW.id, 'org_officer')
      ON CONFLICT (user_id) 
      DO UPDATE SET
        organization_id = NEW.id,
        role = 'org_officer',
        updated_at = NOW();
      
      RAISE NOTICE 'Created/updated user_roles for user_id: %, organization_id: %', auth_user_id, NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_create_user_role_on_insert ON organizations;

CREATE TRIGGER trigger_auto_create_user_role_on_insert
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_user_role_on_insert();

-- ============================================================================
-- FIX EXISTING RECORDS
-- ============================================================================
-- This query will create user_roles for any organizations that are already
-- activated but don't have a corresponding user_roles record

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

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to check which organizations are activated but missing user_roles:

-- SELECT 
--   o.id as org_id,
--   o.name as org_name,
--   o.email as org_email,
--   o.account_status,
--   o.is_active,
--   au.id as auth_user_id,
--   ur.id as user_role_id,
--   ur.role
-- FROM organizations o
-- LEFT JOIN auth.users au ON au.email = o.email
-- LEFT JOIN user_roles ur ON ur.user_id = au.id
-- WHERE (o.account_status = 'Account Activated' OR o.is_active = true)
-- ORDER BY o.name;

