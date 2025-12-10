# TUPConnect Account Setup Guide

Complete guide for setting up Admin and Organization Officer accounts in Supabase.

---

## 📋 Prerequisites

- Supabase project created and configured
- Database schema deployed (from `schema.sql`)
- Supabase client configured in `src/lib/supabase.js`

---

## 1️⃣ Admin Account Setup

### Step 1: Find Your Existing Admin User UUID

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click on **Authentication** in the left sidebar
   - Click on **Users** tab

2. **Find Your Admin User**
   - Look for the user with email: `veliganioandrian@gmail.com`
   - If the user doesn't exist yet, you'll need to create it:
     - Click **"Add User"** or **"Invite User"**
     - Enter email: `veliganioandrian@gmail.com`
     - Set password: `123456`
     - Click **"Create User"**

3. **Get the User UUID**
   - Click on the user `veliganioandrian@gmail.com` to view details
   - **Copy the UUID** (it looks like: `123e4567-e89b-12d3-a456-426614174000`)
   - Save this UUID for the next step

### Step 2: Assign Admin Role

Run this SQL in the **Supabase SQL Editor**:

**Option A: If you know the UUID, use this:**
```sql
-- Replace 'YOUR_ADMIN_USER_UUID' with the UUID you copied in Step 1

INSERT INTO user_roles (user_id, role)
VALUES (
  'YOUR_ADMIN_USER_UUID',  -- Paste the UUID from Step 1 here
  'admin'
)
ON CONFLICT (user_id) DO UPDATE
SET role = 'admin';
```

**Option B: Auto-find UUID by email (EASIER):**
```sql
-- This will automatically find the user by email and assign admin role

INSERT INTO user_roles (user_id, role)
SELECT 
  id,
  'admin'
FROM auth.users
WHERE email = 'veliganioandrian@gmail.com'
ON CONFLICT (user_id) DO UPDATE
SET role = 'admin';

-- Verify the admin role was created
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  au.email,
  ur.created_at
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'veliganioandrian@gmail.com';
```

**✅ Test Admin Login:**
- Go to `components/login.html`
- Select **"Administrator"** role
- Enter email: `veliganioandrian@gmail.com`
- Enter password: `123456`
- You should be redirected to `admin-dashboard.html`

**✅ Test Admin Login:**
- Go to `components/login.html`
- Select **"Administrator"** role
- Enter your admin email and password
- You should be redirected to `admin-dashboard.html`

---

## 2️⃣ Organization Account Setup

### Step 1: Populate Organizations Table

Run this SQL to create sample organizations:

```sql
-- Insert sample organizations
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

-- Verify organizations were created
SELECT 
  id,
  name,
  abbreviation,
  email,
  account_status,
  is_active
FROM organizations
ORDER BY name;
```

**📝 Note:** Save the `id` values from the query result. You'll need them for linking org officers.

### Step 2: Create Organization Profiles (Optional but Recommended)

```sql
-- Create profiles for the organizations
-- Replace the organization_id values with the actual IDs from Step 1

INSERT INTO org_profiles (organization_id, mission, vision, objectives)
SELECT 
  id,
  'To foster innovation and collaboration among students',
  'To be the leading student organization in technology and innovation',
  ARRAY['Promote learning', 'Build community', 'Develop leadership']
FROM organizations
WHERE name IN ('Google Developer Groups on Campus', 'Computer Students'' Association', 'Electrical Engineering Society')
ON CONFLICT (organization_id) DO NOTHING;

-- Verify profiles were created
SELECT 
  op.id,
  o.name,
  op.mission,
  op.vision
FROM org_profiles op
JOIN organizations o ON op.organization_id = o.id;
```

---

## 3️⃣ Organization Officer Account Setup (For Testing)

### Step 1: Create Org Officer User in Supabase Auth

1. **Go to Supabase Dashboard → Authentication → Users**
2. **Invite Organization Officer**
   - Click **"Invite User"**
   - Enter the organization's official email (e.g., `gdg@tup.edu.ph` or `coswits@tup.edu.ph`)
   - Click **"Send Invitation"**
   - The officer will receive an email invitation

3. **Complete Account Setup**
   - Check the email inbox
   - Click the invitation link
   - Set a secure password
   - Complete the account setup

4. **Get the User UUID**
   - Go back to **Authentication → Users**
   - Find the org officer user
   - **Copy the UUID**

### Step 2: Link Org Officer to Organization

Run this SQL:

```sql
-- Replace 'YOUR_ORG_OFFICER_UUID' with the UUID from Step 1
-- Replace 'YOUR_ORGANIZATION_ID' with the organization ID from Section 2, Step 1

INSERT INTO user_roles (user_id, organization_id, role)
VALUES (
  'YOUR_ORG_OFFICER_UUID',  -- Paste the org officer UUID here
  'YOUR_ORGANIZATION_ID',   -- Paste the organization ID here (e.g., GDG's ID)
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

-- Verify the org officer role was created
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  ur.organization_id,
  o.name as organization_name,
  au.email,
  ur.created_at
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN organizations o ON ur.organization_id = o.id
WHERE ur.role = 'org_officer';
```

**✅ Test Org Officer Login:**
- Go to `components/login.html`
- Select **"Organization"** role
- Click **"Login to Existing Account"**
- Enter the org officer email and password
- You should be redirected to `organization-portal.html`

---

## 4️⃣ Activation Flow (Production Implementation)

### How Activation Should Work

When an Admin clicks **"Activate Your Org"** in the Admin Portal:

#### Action A: Send Activation Email (Supabase)

The system should call Supabase Auth to send a password reset/invitation link:

```javascript
// In your admin-dashboard.html activation handler
import { supabase } from '../src/lib/supabase.js';

async function sendActivationLink(orgEmail, orgId) {
  // Option 1: Send password reset link (if user already exists)
  const { error: resetError } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: orgEmail,
  });

  // Option 2: Invite new user (if user doesn't exist)
  const { data, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(orgEmail, {
    data: {
      organization_id: orgId,
      role: 'org_officer'
    }
  });

  // Update organization status
  const { error: updateError } = await supabase
    .from('organizations')
    .update({ account_status: 'Pending Activation' })
    .eq('id', orgId);
}
```

#### Action B: Auto-Create User Role (Database Trigger)

Create a database trigger that automatically creates a `user_roles` entry when a new user signs up with organization metadata:

```sql
-- Function to auto-create user role for org officers
CREATE OR REPLACE FUNCTION handle_new_org_officer()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Check if user has organization_id in metadata
  IF NEW.raw_user_meta_data->>'organization_id' IS NOT NULL THEN
    org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;
    
    -- Insert into user_roles
    INSERT INTO user_roles (user_id, organization_id, role)
    VALUES (NEW.id, org_id, 'org_officer')
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Update organization status
    UPDATE organizations
    SET account_status = 'Account Activated'
    WHERE id = org_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created_org_officer ON auth.users;
CREATE TRIGGER on_auth_user_created_org_officer
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_org_officer();
```

**📝 Note:** This trigger requires the user's metadata to include `organization_id` when they're invited.

---

## 5️⃣ Quick Setup Script (All-in-One)

Run this complete setup script to create everything at once:

```sql
-- ============================================
-- TUPConnect Complete Setup Script
-- ============================================

-- Step 1: Insert sample organizations
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
  )
ON CONFLICT (name) DO NOTHING;

-- Step 2: Create organization profiles
INSERT INTO org_profiles (organization_id, mission, vision, objectives)
SELECT 
  id,
  'To foster innovation and collaboration among students',
  'To be the leading student organization in technology and innovation',
  ARRAY['Promote learning', 'Build community', 'Develop leadership']
FROM organizations
WHERE name IN ('Google Developer Groups on Campus', 'Computer Students'' Association')
ON CONFLICT (organization_id) DO NOTHING;

-- Step 3: Display organization IDs for reference
SELECT 
  id,
  name,
  abbreviation,
  email,
  account_status
FROM organizations
WHERE name IN ('Google Developer Groups on Campus', 'Computer Students'' Association')
ORDER BY name;

-- ============================================
-- MANUAL STEPS REQUIRED:
-- ============================================
-- 1. Create Admin user in Supabase Auth → Users → Invite User
-- 2. Copy Admin UUID and run:
--    INSERT INTO user_roles (user_id, role) VALUES ('ADMIN_UUID', 'admin');
--
-- 3. Create Org Officer user in Supabase Auth → Users → Invite User
-- 4. Copy Org Officer UUID and Organization ID, then run:
--    INSERT INTO user_roles (user_id, organization_id, role) 
--    VALUES ('OFFICER_UUID', 'ORG_ID', 'org_officer');
--    UPDATE organizations SET account_status = 'Account Activated' WHERE id = 'ORG_ID';
-- ============================================
```

---

## 🔍 Verification Queries

### Check All Users and Roles

```sql
SELECT 
  ur.id as role_id,
  ur.role,
  au.email,
  au.id as user_id,
  o.name as organization_name,
  o.account_status,
  ur.created_at
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN organizations o ON ur.organization_id = o.id
ORDER BY ur.role, o.name;
```

### Check Organizations Status

```sql
SELECT 
  id,
  name,
  abbreviation,
  email,
  account_status,
  is_active,
  created_at
FROM organizations
ORDER BY name;
```

### Check Organizations Without Officers

```sql
SELECT 
  o.id,
  o.name,
  o.email,
  o.account_status
FROM organizations o
LEFT JOIN user_roles ur ON o.id = ur.organization_id AND ur.role = 'org_officer'
WHERE ur.id IS NULL
ORDER BY o.name;
```

---

## 🚨 Troubleshooting

### Issue: "User role not found" error on login

**Solution:**
- Verify the user exists in `auth.users`
- Check if `user_roles` entry exists: `SELECT * FROM user_roles WHERE user_id = 'USER_UUID';`
- If missing, insert the role using the SQL from Step 2

### Issue: "Access denied" error

**Solution:**
- Verify the role matches: `SELECT role FROM user_roles WHERE user_id = 'USER_UUID';`
- Ensure you selected the correct role on the login form (Admin vs Organization)

### Issue: Organization not showing in Admin Portal

**Solution:**
- Verify organizations exist: `SELECT * FROM organizations;`
- Check if `is_active = true`
- Ensure the Admin Portal is fetching from the `organizations` table

### Issue: Org Officer can't see applications

**Solution:**
- Verify `organization_id` is set in `user_roles`: `SELECT * FROM user_roles WHERE user_id = 'OFFICER_UUID';`
- Check if applications exist for that organization: `SELECT * FROM applications WHERE organization_id = 'ORG_ID';`

---

## 📚 Next Steps

1. ✅ Admin account created and tested
2. ✅ Sample organizations added
3. ✅ Org Officer account created for testing
4. 🔄 Implement activation email flow in Admin Portal
5. 🔄 Set up database trigger for auto-role assignment
6. 🔄 Test full activation workflow

---

**Need Help?** Check the `AUTH_README.md` for authentication function documentation.

