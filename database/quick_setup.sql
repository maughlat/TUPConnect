-- ============================================================================
-- TUPConnect Quick Setup SQL
-- Run this in Supabase SQL Editor after creating users in Authentication
-- ============================================================================

-- ============================================================================
-- STEP 1: Insert Sample Organizations
-- ============================================================================
INSERT INTO organizations (name, abbreviation, description, affiliation, categories, email, url, is_active, account_status)
VALUES 
  (
    'Google Developer Groups on Campus',
    'GDG',
    'A community group for developers interested in Google technologies and platforms.',
    'COS',
    ARRAY['Technology', 'Academic'],
    'gdg@tup.edu.ph',
    'https://www.facebook.com/gdgtup',
    true,
    'No Account'
  ),
  (
    'Computer Students'' Association',
    'COS-WITS',
    'The official student organization for Computer Science students at TUP.',
    'COS',
    ARRAY['Academic', 'Technology'],
    'coswits@tup.edu.ph',
    'https://www.facebook.com/coswits',
    true,
    'No Account'
  ),
  (
    'Electrical Engineering Society',
    'EES',
    'Student organization for Electrical Engineering students.',
    'COE',
    ARRAY['Academic', 'Technology'],
    'ees@tup.edu.ph',
    'https://www.facebook.com/tup.ees',
    true,
    'No Account'
  )
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 2: Create Organization Profiles
-- ============================================================================
INSERT INTO org_profiles (organization_id, mission, vision, objectives)
SELECT 
  id,
  'To foster innovation and collaboration among students',
  'To be the leading student organization in technology and innovation',
  ARRAY['Promote learning', 'Build community', 'Develop leadership']
FROM organizations
WHERE name IN (
  'Google Developer Groups on Campus', 
  'Computer Students'' Association',
  'Electrical Engineering Society'
)
ON CONFLICT (organization_id) DO NOTHING;

-- ============================================================================
-- STEP 3: Display Organizations (Copy the IDs for next steps)
-- ============================================================================
SELECT 
  id,
  name,
  abbreviation,
  email,
  account_status
FROM organizations
WHERE name IN (
  'Google Developer Groups on Campus', 
  'Computer Students'' Association',
  'Electrical Engineering Society'
)
ORDER BY name;

-- ============================================================================
-- STEP 4: Create Admin Role (AUTO-FIND BY EMAIL)
-- ============================================================================
-- This automatically finds the user by email and assigns admin role
-- Email: veliganioandrian@gmail.com

INSERT INTO user_roles (user_id, role)
SELECT 
  id,
  'admin'
FROM auth.users
WHERE email = 'veliganioandrian@gmail.com'
ON CONFLICT (user_id) DO UPDATE
SET role = 'admin';

-- Verify admin role was created
SELECT 
  ur.role,
  au.email,
  ur.created_at
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'veliganioandrian@gmail.com';

-- ============================================================================
-- STEP 5: Create Org Officer Role (REPLACE UUIDs with actual values)
-- ============================================================================
-- First, create the org officer user in Supabase Dashboard → Authentication → Users
-- Then copy both UUIDs and replace below:

/*
INSERT INTO user_roles (user_id, organization_id, role)
VALUES (
  'YOUR_ORG_OFFICER_UUID',  -- Replace with org officer user UUID
  'YOUR_ORGANIZATION_ID',   -- Replace with organization ID from Step 3
  'org_officer'
)
ON CONFLICT (user_id) DO UPDATE
SET 
  organization_id = EXCLUDED.organization_id,
  role = 'org_officer';

-- Update organization account status
UPDATE organizations
SET account_status = 'Account Activated'
WHERE id = 'YOUR_ORGANIZATION_ID';  -- Same organization ID as above
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all users and their roles
SELECT 
  ur.role,
  au.email,
  o.name as organization_name,
  o.account_status
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN organizations o ON ur.organization_id = o.id
ORDER BY ur.role, o.name;

-- Check organizations
SELECT 
  name,
  abbreviation,
  email,
  account_status,
  is_active
FROM organizations
ORDER BY name;

