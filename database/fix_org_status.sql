-- ============================================================================
-- TUPConnect: Fix Organization Status Inconsistencies
-- ============================================================================
-- This script fixes organizations that have is_active = TRUE but 
-- account_status is not 'Account Activated'
-- ============================================================================

-- Set is_active to FALSE for all organizations that don't have activated accounts
UPDATE public.organizations
SET is_active = FALSE
WHERE account_status != 'Account Activated' AND is_active = TRUE;

-- Verify the fix
SELECT 
  name,
  account_status,
  is_active,
  CASE 
    WHEN account_status != 'Account Activated' AND is_active = TRUE THEN '❌ INCONSISTENT'
    WHEN account_status = 'Account Activated' AND is_active = FALSE THEN '⚠️  WARNING: Activated but inactive'
    ELSE '✅ OK'
  END as status_check
FROM public.organizations
ORDER BY name;

-- ============================================================================
-- Expected Result: All organizations should show '✅ OK'
-- ============================================================================

