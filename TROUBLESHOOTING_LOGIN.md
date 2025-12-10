# Login Troubleshooting Guide

If login isn't working, follow these steps:

## Step 1: Verify User Exists in Supabase Auth

1. Go to **Supabase Dashboard → Authentication → Users**
2. Check if `veliganioandrian@gmail.com` exists in the list
3. **If user doesn't exist:**
   - Click **"Add User"** or **"Invite User"**
   - Email: `veliganioandrian@gmail.com`
   - Password: `123456`
   - Click **"Create User"**

## Step 2: Verify Role Assignment

Run this SQL in Supabase SQL Editor:

```sql
-- Check if user and role exist
SELECT 
  CASE 
    WHEN au.id IS NULL THEN '❌ User does NOT exist in auth.users'
    WHEN ur.id IS NULL THEN '❌ User exists but NO role assigned'
    ELSE '✅ User exists and role is assigned'
  END as status,
  au.id as user_id,
  au.email,
  ur.role
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
WHERE au.email = 'veliganioandrian@gmail.com';
```

**If role is missing**, run:

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'veliganioandrian@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

## Step 3: Check Browser Console

1. Open `components/login.html` in your browser
2. Press **F12** to open Developer Tools
3. Go to the **Console** tab
4. Try to login
5. Look for any error messages (red text)

**Common errors:**
- `Failed to fetch` → Check Supabase URL and keys in `src/lib/supabase.js`
- `Invalid login credentials` → Wrong email or password
- `User role not found` → Role not assigned (see Step 2)
- `Access denied` → Wrong role selected on login form

## Step 4: Verify Supabase Configuration

Check `src/lib/supabase.js`:

```javascript
const supabaseUrl = 'https://rbmfimbdtiyuiflunuhx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

Make sure:
- ✅ URL is correct (no trailing spaces)
- ✅ Anon key is correct
- ✅ File is saved

## Step 5: Test Authentication Directly

Open browser console (F12) and run:

```javascript
// Test Supabase connection
import { supabase } from './src/lib/supabase.js';

// Try to sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'veliganioandrian@gmail.com',
  password: '123456'
});

console.log('Auth result:', { data, error });

// Check user role
if (data?.user) {
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .single();
  
  console.log('Role data:', { roleData, roleError });
}
```

## Common Issues & Solutions

### Issue: "Invalid login credentials"
**Solution:**
- Verify email: `veliganioandrian@gmail.com` (exact spelling)
- Verify password: `123456`
- Check if user exists in Supabase Auth

### Issue: "User role not found"
**Solution:**
- Run the SQL from Step 2 to assign the role
- Verify the role was created: `SELECT * FROM user_roles WHERE user_id = 'USER_UUID';`

### Issue: "Access denied"
**Solution:**
- Make sure you selected **"Administrator"** role on the login form
- Verify the role in database is `'admin'` (not `'org_officer'`)

### Issue: No error shown, but login doesn't work
**Solution:**
- Check browser console for JavaScript errors
- Verify all files are saved
- Clear browser cache and reload
- Check if `src/lib/auth.js` and `src/lib/supabase.js` are accessible

### Issue: "Failed to fetch" or network error
**Solution:**
- Check internet connection
- Verify Supabase project is active
- Check if CORS is enabled in Supabase settings
- Verify Supabase URL and keys are correct

## Quick Fix: Re-assign Admin Role

If nothing works, try this complete reset:

```sql
-- Step 1: Remove existing role (if any)
DELETE FROM user_roles 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'veliganioandrian@gmail.com'
);

-- Step 2: Re-assign admin role
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'veliganioandrian@gmail.com';

-- Step 3: Verify
SELECT 
  ur.role,
  au.email,
  au.id
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'veliganioandrian@gmail.com';
```

## Still Not Working?

1. **Check the exact error message** in browser console
2. **Verify user exists** in Supabase Dashboard → Authentication → Users
3. **Verify role exists** using the SQL queries above
4. **Test with a simple script** (see Step 5)

Share the error message from the console for further help!

