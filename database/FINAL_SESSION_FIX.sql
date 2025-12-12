-- ============================================================================
-- FINAL FIX: Session Caching Issue
-- ============================================================================
-- Problem: After first insert, role check fails because function result is cached
-- Solution: Use direct check in policy (bypasses function caching)
-- ============================================================================

-- Option 1: Fix the function to be VOLATILE (always re-evaluate)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role_type AS $$
DECLARE
  user_role_claim TEXT;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Always check database directly (don't rely on JWT cache)
  SELECT role::TEXT INTO user_role_claim
  FROM public.user_roles
  WHERE user_id = current_user_id
  LIMIT 1;
  
  IF user_role_claim IS NULL THEN
    RETURN NULL;
  END IF;
  
  BEGIN
    RETURN user_role_claim::user_role_type;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE;  -- Changed from STABLE to VOLATILE

-- Option 2: Use direct check in policy (BETTER - no function caching at all)
DROP POLICY IF EXISTS "Admins can insert organizations" ON organizations;

CREATE POLICY "Admins can insert organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

