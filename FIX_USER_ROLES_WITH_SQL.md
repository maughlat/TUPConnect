# Fix User Roles with SQL

## Problem

The "User role not found" error occurs because:
1. **RLS (Row Level Security)** blocks regular users from inserting into `user_roles` table
2. The JavaScript code can't create the role due to RLS policies
3. Existing activated organizations may be missing `user_roles` records

## Solution: Database Trigger + SQL Fix

We'll use a **database trigger** that automatically creates `user_roles` records when an organization is activated. This bypasses RLS because it runs as a database function.

## Steps to Fix

### Step 1: Run the Auto-Create Trigger SQL

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `rbmfimbdtiyuiflunuhx`
3. **Navigate to**: SQL Editor (in left sidebar)
4. **Click**: "New Query"
5. **Copy and paste** the entire contents of `database/auto_create_user_role_trigger.sql`
6. **Click**: "Run" (or press Ctrl+Enter)

This will:
- Create a database trigger that automatically creates `user_roles` when `account_status = 'Account Activated'`
- Fix existing records that are missing roles
- Work for both new activations and existing ones

### Step 2: Fix Existing Records (One-time)

1. **In SQL Editor**, create a new query
2. **Copy and paste** the contents of `database/fix_existing_user_roles.sql`
3. **Click**: "Run"

This will create `user_roles` for any organizations that are already activated but missing roles.

### Step 3: Verify It Worked

Run this query to check:

```sql
SELECT 
  o.name as org_name,
  o.email as org_email,
  o.account_status,
  o.is_active,
  CASE WHEN ur.id IS NULL THEN '❌ MISSING' ELSE '✅ EXISTS' END as role_status,
  ur.role
FROM organizations o
LEFT JOIN auth.users au ON au.email = o.email
LEFT JOIN user_roles ur ON ur.user_id = au.id
WHERE (o.account_status = 'Account Activated' OR o.is_active = true)
ORDER BY 
  CASE WHEN ur.id IS NULL THEN 0 ELSE 1 END,  -- Missing roles first
  o.name;
```

All activated organizations should show `✅ EXISTS` in the `role_status` column.

## How It Works

### The Trigger

When an organization's `account_status` is updated to `'Account Activated'`:
1. The trigger fires automatically
2. It finds the matching `auth.users` record by email
3. It creates/updates the `user_roles` record
4. It uses `SECURITY DEFINER` to bypass RLS policies

### Benefits

- ✅ **Automatic**: No JavaScript code needed
- ✅ **Reliable**: Works even if client-side code fails
- ✅ **Secure**: Runs as database function, not client code
- ✅ **Backward Compatible**: Fixes existing records too

## For Future Activations

Once the trigger is in place:
1. User sets up password → Organization `account_status` → `'Account Activated'`
2. **Trigger automatically fires** → Creates `user_roles` record
3. User can login immediately → No "User role not found" error!

## Troubleshooting

### If trigger doesn't work:

1. **Check trigger exists**:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%user_role%';
   ```

2. **Check function exists**:
   ```sql
   SELECT proname FROM pg_proc WHERE proname LIKE '%user_role%';
   ```

3. **Manually test the function**:
   ```sql
   -- Find an organization
   SELECT id, name, email, account_status FROM organizations WHERE email = 'your-org-email@example.com';
   
   -- Update it to trigger the function
   UPDATE organizations 
   SET account_status = 'Account Activated', is_active = true 
   WHERE email = 'your-org-email@example.com';
   
   -- Check if role was created
   SELECT * FROM user_roles WHERE user_id IN (
     SELECT id FROM auth.users WHERE email = 'your-org-email@example.com'
   );
   ```

### If some records still missing:

Run the fix query again:
```sql
INSERT INTO user_roles (user_id, organization_id, role)
SELECT 
  au.id as user_id,
  o.id as organization_id,
  'org_officer' as role
FROM organizations o
INNER JOIN auth.users au ON au.email = o.email
LEFT JOIN user_roles ur ON ur.user_id = au.id
WHERE (o.account_status = 'Account Activated' OR o.is_active = true)
  AND ur.id IS NULL
ON CONFLICT (user_id) 
DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  role = 'org_officer',
  updated_at = NOW();
```

## Next Steps

After running the SQL:
1. ✅ Test login with an organization account
2. ✅ Should redirect to organization portal
3. ✅ No more "User role not found" errors!

