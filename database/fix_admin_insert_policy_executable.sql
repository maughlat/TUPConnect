-- Fix for Admin Insert Policy Issue
-- Run this in your Supabase SQL Editor or via MCP

-- Step 1: Update get_user_role() function with better error handling
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
  
  user_role_claim := (auth.jwt() ->> 'user_role')::TEXT;
  
  IF user_role_claim IS NULL OR user_role_claim = '' THEN
    BEGIN
      SELECT role::TEXT INTO user_role_claim
      FROM public.user_roles
      WHERE user_id = current_user_id
      LIMIT 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Error querying user_roles for user %: %', current_user_id, SQLERRM;
        user_role_claim := NULL;
    END;
  END IF;
  
  IF user_role_claim IS NULL OR user_role_claim = '' THEN
    RETURN NULL;
  END IF;
  
  BEGIN
    RETURN user_role_claim::user_role_type;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Error casting role % to user_role_type: %', user_role_claim, SQLERRM;
      RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 2: Fix the INSERT policy to handle NULL correctly
DROP POLICY IF EXISTS "Admins can insert organizations" ON organizations;

CREATE POLICY "Admins can insert organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() IS NOT DISTINCT FROM 'admin'::user_role_type
  );


