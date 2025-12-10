-- ============================================================================
-- ACTIVATE ORGANIZATION ON PASSWORD SETUP
-- ============================================================================
-- This function activates an organization and creates user_roles when a user
-- sets their password. It bypasses RLS and handles everything in one transaction.
--
-- Call this function from the password setup page after password is set.
-- ============================================================================

-- Function to activate organization and create user role
CREATE OR REPLACE FUNCTION activate_organization_by_email(org_email TEXT)
RETURNS JSON AS $$
DECLARE
  org_record RECORD;
  auth_user_record RECORD;
  role_record RECORD;
  result JSON;
BEGIN
  -- Find the organization by email
  SELECT * INTO org_record
  FROM organizations
  WHERE email = org_email
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Organization not found for email: ' || org_email
    );
  END IF;

  -- Find the auth user by email
  SELECT * INTO auth_user_record
  FROM auth.users
  WHERE email = org_email
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Auth user not found for email: ' || org_email
    );
  END IF;

  -- Update organization status (this bypasses RLS because we're in SECURITY DEFINER)
  UPDATE organizations
  SET 
    account_status = 'Account Activated',
    is_active = true,
    updated_at = NOW()
  WHERE id = org_record.id;

  -- Create or update user_roles record
  INSERT INTO user_roles (user_id, organization_id, role)
  VALUES (auth_user_record.id, org_record.id, 'org_officer')
  ON CONFLICT (user_id) 
  DO UPDATE SET
    organization_id = org_record.id,
    role = 'org_officer',
    updated_at = NOW();

  -- Get the updated role record
  SELECT * INTO role_record
  FROM user_roles
  WHERE user_id = auth_user_record.id;

  -- Return success with details
  RETURN json_build_object(
    'success', true,
    'organization_id', org_record.id,
    'organization_name', org_record.name,
    'user_id', auth_user_record.id,
    'role_id', role_record.id,
    'message', 'Organization activated and user role created successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION activate_organization_by_email(TEXT) TO authenticated;

-- ============================================================================
-- USAGE EXAMPLE
-- ============================================================================
-- Call this function from JavaScript after password setup:
-- 
-- const { data, error } = await supabase.rpc('activate_organization_by_email', {
--   org_email: 'organization@example.com'
-- });
--
-- if (data.success) {
--   console.log('Organization activated!');
-- } else {
--   console.error('Error:', data.error);
-- }
-- ============================================================================

