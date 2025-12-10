# Fix: Receiving "QuickBite Support" Emails Instead of TUPConnect

## Problem

You're receiving activation emails from "QuickBite Support" instead of "TUPConnect". This means your Supabase project's email settings are configured for a different project.

## Causes

1. **Wrong Supabase Project**: You might be using a different Supabase project that belongs to "QuickBite"
2. **Email Templates Not Updated**: The email templates in Supabase still have "QuickBite" branding
3. **SMTP Sender Name**: If you configured custom SMTP, the sender name might be set to "QuickBite Support"

## Solutions

### ✅ Solution 1: Verify You're Using the Correct Supabase Project

Your code uses: `https://rbmfimbdtiyuiflunuhx.supabase.co`

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Check your project list**: Do you see multiple projects?
3. **Verify the correct project**: The project with URL `rbmfimbdtiyuiflunuhx` should be your TUPConnect project
4. **If you see a "QuickBite" project**: Make sure you're not accidentally using that project's credentials

### ✅ Solution 2: Update Email Templates in Supabase

1. **Go to Supabase Dashboard** → Your TUPConnect project
2. **Navigate to**: Authentication → Email (in sidebar under "NOTIFICATIONS")
3. **Find the "Reset Password" template** (this is what's used for activation)
4. **Click on it to edit**
5. **Replace the content** with the template from `SUPABASE_EMAIL_TEMPLATE.html` in your project
6. **Make sure it says "TUPConnect"** not "QuickBite"
7. **Click Save**

### ✅ Solution 3: Update SMTP Sender Name (If Using Custom SMTP)

If you configured custom SMTP:

1. **Go to**: Authentication → Email
2. **Scroll to "SMTP Settings"**
3. **Find "Sender name"** field
4. **Change it to**: `TUPConnect` or `TUPConnect System Administration`
5. **Click Save**

### ✅ Solution 4: Update Site Name in Supabase Settings

1. **Go to**: Project Settings → General
2. **Find "Site Name"** or "Project Name"**
3. **Make sure it's set to**: `TUPConnect` (not "QuickBite")
4. **Click Save**

### ✅ Solution 5: Check If You Have Multiple Supabase Projects

If you're working on multiple projects (TUPConnect and QuickBite):

1. **Check your code files**: Make sure all files use:
   ```javascript
   const supabaseUrl = 'https://rbmfimbdtiyuiflunuhx.supabase.co';
   ```

2. **Verify in Supabase Dashboard**: 
   - Go to: https://supabase.com/dashboard/project/rbmfimbdtiyuiflunuhx
   - Make sure the project name is "TUPConnect" (or rename it)

3. **Double-check your .env files** (if you use them):
   - Make sure you're not accidentally using QuickBite's credentials

## Quick Fix Checklist

- [ ] Verified you're in the correct Supabase project (`rbmfimbdtiyuiflunuhx`)
- [ ] Updated "Reset Password" email template to use TUPConnect branding
- [ ] Changed SMTP sender name to "TUPConnect" (if using custom SMTP)
- [ ] Updated project name in Supabase settings
- [ ] Tested by requesting a new activation email
- [ ] Verified the new email says "TUPConnect" not "QuickBite"

## Testing

After making changes:

1. **Request a new activation email** from your production site
2. **Check the email sender**: Should say "TUPConnect" or "TUPConnect System Administration"
3. **Check the email content**: Should mention "TUPConnect Portal Activation"
4. **Check the email links**: Should point to `https://tupconnect.vercel.app` not `localhost:3000`

## Why This Happened

This typically happens when:
- You copied code from another project (QuickBite)
- You're using a Supabase project that was previously used for QuickBite
- The email templates weren't customized and still show default/previous branding

## Still Seeing QuickBite Emails?

If you're still receiving QuickBite emails after making all changes:

1. **Check browser console** when requesting activation:
   - Open DevTools (F12) → Console
   - Look for the Supabase URL being used
   - Verify it's `rbmfimbdtiyuiflunuhx.supabase.co`

2. **Clear browser cache** and try again

3. **Check if there are multiple Supabase clients** initialized:
   - Search your codebase for "QuickBite" to see if there are any hardcoded references

