-- ============================================================================
-- Verify Admin Account Setup
-- Run this to check if your admin account is set up correctly
-- ============================================================================

-- Step 1: Check if user exists in Supabase Auth
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'veliganioandrian@gmail.com';

-- Step 2: Check if user_roles entry exists
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  ur.organization_id,
  au.email,
  ur.created_at
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'veliganioandrian@gmail.com';

-- Step 3: If user exists but no role, this will show what's missing
SELECT 
  CASE 
    WHEN au.id IS NULL THEN '❌ User does NOT exist in auth.users'
    WHEN ur.id IS NULL THEN '❌ User exists but NO role assigned in user_roles'
    ELSE '✅ User exists and role is assigned'
  END as status,
  au.id as user_id,
  au.email,
  ur.role
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
WHERE au.email = 'veliganioandrian@gmail.com';

