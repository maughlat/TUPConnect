# Restore Admin Account: veliganioandrian@gmail.com

## Quick Solution: Create Admin Account

Your admin account was deleted. Here's how to restore it:

### Option 1: Create via Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard** → Your Project → **Authentication** → **Users**
2. **Click "Add User"** or **"Create User"** button
3. **Fill in:**
   - Email: `veliganioandrian@gmail.com`
   - Password: `123456`
   - Auto Confirm User: **Yes** (check this box)
   - Email Confirmed: **Yes** (check this box)
4. **Click "Create User"**

### Option 2: Create via Sign Up Function (Alternative)

If Option 1 doesn't work, you can create it programmatically:

1. **Open your browser console** on any page of your site
2. **Run this code:**

```javascript
// Create admin user account
const supabaseUrl = 'https://rbmfimbdtiyuiflunuhx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibWZpbWJkdGl5dWlmbHVudWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMzA4MDQsImV4cCI6MjA4MDYwNjgwNH0.5LUfiV2PH78x5ExLROR9b0Z9j1O1ND75JJdGnEg2r4E';
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// Sign up the admin user
supabase.auth.signUp({
  email: 'veliganioandrian@gmail.com',
  password: '123456',
  options: {
    data: {
      role: 'admin'
    }
  }
}).then(({ data, error }) => {
  if (error) {
    console.error('Error creating user:', error);
    alert('Error: ' + error.message);
  } else {
    console.log('User created:', data);
    alert('User created successfully! Now assign admin role (see next step).');
  }
});
```

3. **If email confirmation is enabled**, you'll need to confirm the email or disable email confirmation first

---

## Step 2: Assign Admin Role

After creating the user, you need to assign the admin role:

### Via Supabase SQL Editor

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Run this SQL:**

```sql
-- Assign admin role to veliganioandrian@gmail.com
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
```

### Or use the existing SQL file:

Run the contents of `database/assign_admin_role.sql`

---

## Step 3: Verify Admin Account

1. **Go to login page**: https://tupconnect.vercel.app/components/login.html
2. **Select "Administrator"**
3. **Login with:**
   - Email: `veliganioandrian@gmail.com`
   - Password: `123456`
4. **You should be redirected to Admin Dashboard**

---

## Troubleshooting

### If user creation fails:

**Check if email confirmation is required:**
1. Go to **Authentication** → **Providers** → **Email**
2. **Disable "Enable email confirmations"** temporarily
3. Try creating the user again
4. Re-enable email confirmations if needed

### If admin role assignment fails:

**Check if user exists:**
```sql
SELECT id, email FROM auth.users WHERE email = 'veliganioandrian@gmail.com';
```

**If user exists but role assignment fails:**
- Check if `user_roles` table exists
- Verify the user_id matches

### If login doesn't work:

1. **Verify user was created:**
   - Go to **Authentication** → **Users**
   - Look for `veliganioandrian@gmail.com`

2. **Verify admin role:**
   ```sql
   SELECT * FROM user_roles ur
   JOIN auth.users au ON ur.user_id = au.id
   WHERE au.email = 'veliganioandrian@gmail.com';
   ```

3. **Try resetting password** if needed:
   - Go to login page
   - Click "Forgot Password"
   - Or manually update in Supabase Dashboard

---

## Quick Reference

- **Email:** `veliganioandrian@gmail.com`
- **Password:** `123456`
- **Role:** `admin`
- **SQL File:** `database/assign_admin_role.sql`

