# Add Existing Organizations to Supabase Auth > Users

## Overview

This guide explains how to add existing organization emails from the `organizations` table to Supabase Authentication > Users, so they can receive activation emails when their accounts are activated.

---

## Quick Start

### Step 1: Check Current Status

1. Open **Supabase Dashboard** → **SQL Editor**
2. Run the query from `database/add_existing_orgs_to_auth.sql` (Step 2)
3. This will show you which organizations need Auth users created

**Example query:**
```sql
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  o.email as organization_email,
  o.account_status,
  o.is_active
FROM public.organizations o
LEFT JOIN auth.users au ON LOWER(TRIM(au.email)) = LOWER(TRIM(o.email))
WHERE o.email IS NOT NULL 
  AND o.email != ''
  AND TRIM(o.email) != ''
  AND au.id IS NULL
ORDER BY o.name;
```

---

## Method 1: Use Admin Dashboard Activation (Recommended)

**Easiest method** - Automatically creates Auth users and sends activation emails.

### Steps:

1. **Log in to Admin Dashboard**
   - Go to `https://tupconnect.vercel.app/components/admin-dashboard.html`
   - Log in with admin credentials

2. **Activate Each Organization**
   - Find the organization in the table
   - Click the **"Activate"** toggle button
   - OR click the **"Activate Organization"** button if available
   - This automatically:
     - Creates the Auth user if it doesn't exist
     - Sets `is_org_officer: true` metadata
     - Sends the activation email with password setup link

3. **Verify**
   - Check Supabase Dashboard → Authentication → Users
   - Verify the email appears in the users list
   - Check that metadata shows `is_org_officer: true`

**Advantage:** Automatic, handles password setup, sends activation email immediately.

---

## Method 2: Use Supabase Admin API (Bulk Creation)

**Best for bulk creation** - Programmatically create multiple users at once.

### Prerequisites:

- Get your **Service Role Key** from:
  - Supabase Dashboard → Settings → API → `service_role` key (secret)

### Steps:

1. **Get the list of organization emails** (from SQL query in Step 1)

2. **Use the Admin API** to create users:

```bash
# Example using curl
curl -X POST 'https://[your-project-ref].supabase.co/auth/v1/admin/users' \
  -H "apikey: [your-service-role-key]" \
  -H "Authorization: Bearer [your-service-role-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "organization@example.com",
    "email_confirm": true,
    "user_metadata": {
      "is_org_officer": true
    }
  }'
```

**JavaScript example:**
```javascript
async function createOrgAuthUsers(orgEmails) {
  const serviceRoleKey = 'YOUR_SERVICE_ROLE_KEY';
  const projectRef = 'YOUR_PROJECT_REF';
  const url = `https://${projectRef}.supabase.co/auth/v1/admin/users`;

  for (const email of orgEmails) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          email_confirm: true,
          user_metadata: {
            is_org_officer: true
          }
        })
      });

      const data = await response.json();
      console.log(`Created user for ${email}:`, data);
    } catch (error) {
      console.error(`Failed to create user for ${email}:`, error);
    }
  }
}
```

**Note:** Users created this way will need to use "Forgot Password" or be activated via the Admin Dashboard to set their password and receive the activation email.

---

## Method 3: Manual Creation via Supabase Dashboard

**Good for small numbers** - Create users one by one manually.

### Steps:

1. **Open Supabase Dashboard**
   - Go to **Authentication** → **Users**
   - Click **"Add User"**

2. **Fill in User Details**
   - **Email:** Enter the organization's official email
   - **Email Confirmed:** ✅ Check this box
   - **Auto Generate Password:** Leave unchecked (user will set via activation email)
   - **User Metadata:** Click "Add metadata" and add:
     ```json
     {
       "is_org_officer": true
     }
     ```

3. **Save User**

4. **Send Activation Email** (Optional):
   - After creating, you can manually send password reset email
   - OR use the Admin Dashboard's "Activate Organization" feature

5. **Repeat** for each organization

---

## Method 4: Use Admin Dashboard Activation Button (Automatic Bulk)

If your Admin Dashboard has a bulk activation feature:

1. Select multiple organizations
2. Click "Activate Selected" or similar button
3. System automatically creates Auth users and sends emails

---

## Verification

### Check if Auth Users Were Created:

1. **Run the verification query:**
```sql
SELECT 
  o.name as organization_name,
  o.email as organization_email,
  CASE 
    WHEN au.id IS NOT NULL THEN '✅ Has Auth User'
    ELSE '❌ Missing Auth User'
  END as status
FROM public.organizations o
LEFT JOIN auth.users au ON LOWER(TRIM(au.email)) = LOWER(TRIM(o.email))
WHERE o.email IS NOT NULL 
ORDER BY status, o.name;
```

2. **Check in Supabase Dashboard:**
   - Authentication → Users
   - Verify emails are present
   - Click on a user to verify metadata shows `is_org_officer: true`

---

## What Happens After Auth Users Are Created?

Once an Auth user exists for an organization:

1. **Admin can activate the organization**
   - Click "Activate" toggle in Admin Dashboard
   - System sends activation email automatically

2. **Organization receives activation email**
   - Email contains link to set password
   - Link points to: `https://tupconnect.vercel.app/components/setup_password.html`

3. **Organization officer sets password**
   - Clicks link in email
   - Sets their password
   - Account is activated

4. **Organization can log in**
   - Uses email and password
   - Accesses Organization Portal
   - Can manage profile and applications

---

## Troubleshooting

### Issue: Email already exists in Auth

**Solution:**
- User already exists - check if it has correct metadata
- Update metadata if needed: `{ "is_org_officer": true }`

### Issue: Activation email not sent

**Solution:**
- Check Supabase Email settings (SMTP configured)
- Verify email template is set up
- Try manually sending password reset from Auth > Users

### Issue: User created but can't log in

**Solution:**
- User needs to set password via activation email
- OR manually send password reset email from Auth > Users

---

## Important Notes

1. **Password Setup:**
   - Users created via API/Manual don't have passwords set initially
   - They must use the activation email link to set password
   - OR Admin can send password reset email

2. **Email Confirmation:**
   - Set `email_confirm: true` when creating users
   - This allows immediate activation without email verification

3. **Metadata:**
   - Always include `is_org_officer: true` in user metadata
   - This is required for role-based access control

4. **Service Role Key:**
   - Keep this key SECRET - never expose it in client-side code
   - Only use in secure server-side environments

---

## Recommended Approach

**For most cases, use Method 1 (Admin Dashboard Activation):**
- ✅ Automatic Auth user creation
- ✅ Automatic activation email sending
- ✅ Handles password setup flow
- ✅ No manual API calls needed
- ✅ Built-in error handling

Simply activate each organization from the Admin Dashboard, and the system will handle everything automatically!

