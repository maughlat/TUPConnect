-- ============================================================================
-- TUPConnect: Database Trigger to Delete Auth User When Organization is Deleted
-- ============================================================================
-- This trigger automatically deletes the associated Supabase Auth user
-- when an organization is deleted from the organizations table.
--
-- IMPORTANT: This requires proper permissions. You may need to run this
-- with a superuser account or through Supabase Dashboard SQL Editor.
-- ============================================================================

-- Step 1: Create the function that will delete the auth user
CREATE OR REPLACE FUNCTION delete_auth_user_on_org_delete()
RETURNS TRIGGER AS $$
DECLARE
  user_id_to_delete uuid;
  user_email text;
BEGIN
  -- Store the email from the deleted organization
  user_email := OLD.email;
  
  -- Only proceed if organization had an email
  IF user_email IS NOT NULL AND user_email != '' THEN
    -- Try to find the user in auth.users table by email
    -- Note: This requires access to auth schema, which may need special permissions
    SELECT id INTO user_id_to_delete
    FROM auth.users
    WHERE email = user_email
    LIMIT 1;
    
    -- If user found, delete it
    IF user_id_to_delete IS NOT NULL THEN
      DELETE FROM auth.users WHERE id = user_id_to_delete;
      RAISE NOTICE 'Deleted auth user % (email: %) for deleted organization %', 
        user_id_to_delete, user_email, OLD.name;
    ELSE
      RAISE NOTICE 'No auth user found for email % (organization: %)', 
        user_email, OLD.name;
    END IF;
  ELSE
    RAISE NOTICE 'Organization % had no email, skipping auth user deletion', OLD.name;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger that fires AFTER an organization is deleted
DROP TRIGGER IF EXISTS trigger_delete_auth_user_on_org_delete ON public.organizations;

CREATE TRIGGER trigger_delete_auth_user_on_org_delete
  AFTER DELETE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION delete_auth_user_on_org_delete();

-- Step 3: Grant necessary permissions
-- Note: This may require superuser privileges or you may need to run this
-- through Supabase Dashboard with proper permissions
-- GRANT EXECUTE ON FUNCTION delete_auth_user_on_org_delete() TO authenticated;
-- GRANT EXECUTE ON FUNCTION delete_auth_user_on_org_delete() TO service_role;

-- ============================================================================
-- Verification Queries (Run these to verify the trigger is set up correctly)
-- ============================================================================

-- Check if trigger exists
-- SELECT * FROM pg_trigger WHERE tgname = 'trigger_delete_auth_user_on_org_delete';

-- Check if function exists
-- SELECT proname, prosrc FROM pg_proc WHERE proname = 'delete_auth_user_on_org_delete';

-- Test the trigger (be careful - this will actually delete):
-- 1. Create a test organization with an email
-- 2. Create an auth user with that email
-- 3. Delete the organization
-- 4. Verify the auth user is also deleted

-- ============================================================================
-- Troubleshooting
-- ============================================================================

-- If you get permission errors:
-- 1. Make sure you're running this in Supabase SQL Editor
-- 2. The function uses SECURITY DEFINER which should grant elevated privileges
-- 3. If still not working, you may need to use a Supabase Edge Function instead

-- To remove the trigger:
-- DROP TRIGGER IF EXISTS trigger_delete_auth_user_on_org_delete ON public.organizations;
-- DROP FUNCTION IF EXISTS delete_auth_user_on_org_delete();

