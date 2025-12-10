# Fix for Email Redirect Issue

## Problem
When clicking the activation email link, you're being redirected to:
- ❌ `127.0.0.1:5500/components/components/setup_password.html` (localhost with double path)

## Root Causes
1. **Double path issue:** The code was adding `/components` twice when called from `/components/login.html` - **FIXED** ✅
2. **Localhost redirect:** The email was likely sent from localhost, so the link points to localhost

## Solutions

### ✅ Solution 1: Request New Activation Email from Production Site

**IMPORTANT:** The existing email link you received was generated from localhost, so it will always redirect to localhost. You need to request a **NEW** activation email from your production site.

1. **Go to your production site:**
   - Visit: https://tupconnect.vercel.app/components/login.html

2. **Request a new activation email:**
   - Select "Organization" role
   - Click "Activate Your Organization"
   - Select the organization
   - Enter the email address
   - Submit

3. **Check your email:**
   - The new email will have a link pointing to: `https://tupconnect.vercel.app/components/setup_password.html`
   - Click the button in the new email

### ✅ Solution 2: Verify Supabase Configuration

Make sure Supabase is configured with your production URL:

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your TUPConnect project

2. **Check Authentication → URL Configuration:**
   - **Site URL** should be: `https://tupconnect.vercel.app`
   - **Redirect URLs** should include: `https://tupconnect.vercel.app/components/setup_password.html`

3. **Save changes** if you updated anything

### ✅ Solution 3: Code Fix Applied

I've already fixed the code that was causing the double `/components/components/` path issue. The fix:
- Detects if you're on production (vercel.app domain)
- Uses the production URL directly: `https://tupconnect.vercel.app/components/setup_password.html`
- Fixes path construction for localhost/development

**After deploying this fix, all new activation emails will use the correct production URL.**

## Steps to Deploy the Fix

1. **Commit and push the updated `src/lib/activation.js`:**
   ```bash
   git add src/lib/activation.js
   git commit -m "Fix activation email redirect URL for production"
   git push
   ```

2. **Vercel will automatically redeploy** (usually takes 1-2 minutes)

3. **Request a new activation email** from the production site (Solution 1)

## Testing Checklist

After deploying:
- [ ] Code is pushed to GitHub
- [ ] Vercel redeployment is complete
- [ ] Supabase redirect URLs are configured correctly
- [ ] Request new activation email from production site
- [ ] Click the link in the new email
- [ ] Verify it redirects to: `https://tupconnect.vercel.app/components/setup_password.html`
- [ ] Complete password setup successfully

## Why the Old Email Link Doesn't Work

Email links are generated at the time the email is sent. They include:
- The redirect URL you specified when calling the function
- Authentication tokens that expire after some time

Since the old email was sent from localhost, it contains a localhost URL. Even if you fix Supabase configuration now, the old email link will still point to localhost.

**Solution:** Always request a new activation email after making changes.

