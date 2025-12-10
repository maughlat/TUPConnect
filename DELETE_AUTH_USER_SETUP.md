# Setting Up Automatic Auth User Deletion

## Problem

When an organization is deleted from the admin dashboard, the associated user account in Supabase Auth (Authentication → Users) should also be deleted. Currently, the code attempts to do this but requires admin privileges.

## Solution Options

### ✅ Option 1: Database Trigger (Recommended - Most Secure)

This automatically deletes the auth user when an organization is deleted, using a database function.

#### Step 1: Create the Database Function

Go to Supabase Dashboard → SQL Editor and run this:

```sql
-- Function to delete auth user when organization is deleted
CREATE OR REPLACE FUNCTION delete_auth_user_on_org_delete()
RETURNS TRIGGER AS $$
DECLARE
  user_id_to_delete uuid;
BEGIN
  -- Get the user ID from auth.users table where email matches the deleted organization's email
  IF OLD.email IS NOT NULL THEN
    SELECT id INTO user_id_to_delete
    FROM auth.users
    WHERE email = OLD.email
    LIMIT 1;
    
    -- If user found, delete it
    IF user_id_to_delete IS NOT NULL THEN
      DELETE FROM auth.users WHERE id = user_id_to_delete;
      RAISE NOTICE 'Deleted auth user % for organization email %', user_id_to_delete, OLD.email;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires AFTER organization is deleted
CREATE TRIGGER trigger_delete_auth_user_on_org_delete
  AFTER DELETE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION delete_auth_user_on_org_delete();
```

#### Step 2: Grant Necessary Permissions

```sql
-- Grant the function permission to delete from auth.users
-- This requires superuser access or proper permissions setup
GRANT EXECUTE ON FUNCTION delete_auth_user_on_org_delete() TO authenticated;
```

**Note:** You may need to run this with a superuser account. If you get permission errors, you'll need Option 2 (Edge Function).

---

### ✅ Option 2: Supabase Edge Function (Good Alternative)

Create a serverless function that handles auth user deletion with admin privileges.

#### Step 1: Create Edge Function

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Initialize Supabase in your project**:
   ```bash
   supabase init
   ```

3. **Create the function**:
   ```bash
   supabase functions new delete-auth-user
   ```

4. **Edit `supabase/functions/delete-auth-user/index.ts`**:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Get the service role key from environment (set in Supabase dashboard)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Find user by email
    const { data: users, error: findError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (findError) {
      throw findError
    }

    const user = users.users.find(u => u.email === email)

    if (!user) {
      return new Response(
        JSON.stringify({ success: true, message: 'User not found' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Delete the user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      throw deleteError
    }

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

5. **Deploy the function**:
   ```bash
   supabase functions deploy delete-auth-user
   ```

#### Step 2: Update Admin Dashboard Code

Update the `deleteAuthUserByEmail` function in `admin-dashboard.html`:

```javascript
async function deleteAuthUserByEmail(email) {
  if (!email) {
    return { success: true };
  }

  try {
    const { data, error } = await supabase.functions.invoke('delete-auth-user', {
      body: { email: email }
    });

    if (error) {
      console.error('Error calling delete-auth-user function:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error deleting auth user:', error);
    return { success: false, error: error.message };
  }
}
```

---

### ✅ Option 3: Manual Cleanup (Quick Fix - Not Recommended for Production)

For testing or if you can't set up the above solutions immediately:

1. When deleting an organization, note the email address
2. Manually go to Supabase Dashboard → Authentication → Users
3. Search for the email and delete the user manually

---

## Recommended Approach

**Use Option 1 (Database Trigger)** because:
- ✅ Automatically handles deletion (no code changes needed)
- ✅ Most secure (runs on the database server)
- ✅ No additional API calls
- ✅ Works even if admin dashboard code has issues

**Use Option 2 (Edge Function)** if:
- You don't have database trigger permissions
- You want more control over the deletion process
- You want to add additional logic (logging, notifications, etc.)

## Testing

After implementing either option:

1. **Create a test organization** with an email
2. **Create the auth user** for that organization (via activation flow)
3. **Delete the organization** from admin dashboard
4. **Verify in Supabase Dashboard** → Authentication → Users
5. **Confirm the user is deleted**

## Troubleshooting

### Database Trigger Not Working

- Check if function has `SECURITY DEFINER` (allows elevated privileges)
- Verify trigger is created: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_delete_auth_user_on_org_delete';`
- Check Supabase logs for errors

### Edge Function Not Working

- Verify function is deployed: `supabase functions list`
- Check function logs: `supabase functions logs delete-auth-user`
- Ensure service role key is set in function secrets
- Verify the function is being called (check network tab in browser)

## Security Notes

- **Never expose service role key** in client-side code
- Database triggers run with database privileges (secure)
- Edge functions require proper authentication/authorization
- Always verify the user has permission to delete before allowing deletion

