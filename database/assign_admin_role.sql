-- ============================================================================
-- Quick Admin Role Assignment
-- Assigns admin role to: veliganioandrian@gmail.com
-- ============================================================================

-- Auto-find user by email and assign admin role
INSERT INTO user_roles (user_id, role)
SELECT 
  id,
  'admin'
FROM auth.users
WHERE email = 'veliganioandrian@gmail.com'
ON CONFLICT (user_id) DO UPDATE
SET role = 'admin';

-- Verify the admin role was assigned
SELECT 
  ur.role,
  au.email,
  ur.created_at
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'veliganioandrian@gmail.com';

