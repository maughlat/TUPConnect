# 🚨 URGENT: Deploy the Redirect URL Fix

## The Problem
You're still seeing `127.0.0.1:5500/components/components/setup_password.html` because:
- ❌ The fix hasn't been deployed to Vercel yet
- ❌ You're using an old activation email (links are generated when the email is sent)

## The Solution

### ✅ Step 1: Commit and Push the Fix

The code fix is ready. You need to deploy it:

```bash
# Check what files changed
git status

# Add the fixed file
git add src/lib/activation.js

# Commit
git commit -m "Fix: Always use production URL for activation email redirects"

# Push to GitHub
git push
```

### ✅ Step 2: Wait for Vercel Deployment

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Find your `TUPConnect` project
3. Wait for the new deployment to complete (usually 1-2 minutes)
4. Verify the deployment shows ✅ "Ready"

### ✅ Step 3: Request a NEW Activation Email

**IMPORTANT:** Old emails won't work! You MUST request a new one.

1. **Go to your PRODUCTION site:**
   - Visit: **https://tupconnect.vercel.app/components/login.html**
   - ⚠️ Make sure you're on the production URL, NOT localhost!

2. **Request activation:**
   - Select "Organization" role
   - Click "Activate Your Organization"
   - Select your organization
   - Enter the email address
   - Submit

3. **Check your email:**
   - The NEW email will have the correct production URL
   - The link should be: `https://tupconnect.vercel.app/components/setup_password.html#access_token=...`

### ✅ Step 4: Test the Link

1. Click the "Set Your Organization Portal Password" button in the NEW email
2. Verify it redirects to: `https://tupconnect.vercel.app/components/setup_password.html`
3. NOT to: `127.0.0.1:5500` ❌

## What Changed

The fix now **ALWAYS** uses the production URL:
```javascript
const PRODUCTION_URL = 'https://tupconnect.vercel.app';
const PRODUCTION_REDIRECT = `${PRODUCTION_URL}/components/setup_password.html`;
```

Even if you trigger activation from localhost, the email link will point to production.

## Why Old Emails Don't Work

Email links are **generated when the email is sent**. They contain:
- The redirect URL you specified at that moment
- Authentication tokens that expire

**Once an email is sent, the link cannot be changed.** You must request a new email after deploying the fix.

## Quick Checklist

- [ ] Committed `src/lib/activation.js` changes
- [ ] Pushed to GitHub
- [ ] Vercel deployment completed
- [ ] Requested NEW activation email from **production site**
- [ ] Clicked link in NEW email
- [ ] Verified it goes to `https://tupconnect.vercel.app/components/setup_password.html`
- [ ] Successfully set password

## Still Having Issues?

If the error persists after following all steps:

1. **Check browser console:**
   - Open DevTools (F12)
   - Check for any JavaScript errors
   - Look at the Network tab when clicking the link

2. **Verify Supabase redirect URL:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Make sure `https://tupconnect.vercel.app/components/setup_password.html` is in the Redirect URLs list

3. **Clear browser cache:**
   - Hard refresh (Ctrl+F5 or Cmd+Shift+R)
   - Or try in an incognito/private window

