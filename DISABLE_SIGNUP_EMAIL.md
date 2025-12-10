# Fix: Stop Receiving "You have been invited" Emails

## Problem

When activating an organization, you're receiving TWO emails:
1. ❌ "You have been invited" email from QuickBite Support (unwanted)
2. ✅ "Set Your Organization Portal Password" email (the one you want)

## Why This Happens

When the activation code creates a new user account (using `supabase.auth.signUp()`), Supabase automatically sends a confirmation/invitation email **unless email confirmations are disabled** in your project settings.

## Solution: Disable Email Confirmations in Supabase

You need to disable email confirmations so that `signUp()` doesn't send the invitation email. The activation flow will only send the password reset email.

### Steps:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your TUPConnect project** (`rbmfimbdtiyuiflunuhx`)
3. **Navigate to**: Authentication → Providers (in the sidebar)
4. **Click on "Email"** provider
5. **Find "Enable email confirmations"** toggle
6. **Turn it OFF** (disable it)
7. **Click "Save"**

### Alternative Path (if the above doesn't work):

1. **Go to**: Authentication → Settings
2. **Look for "Email confirmation"** or "Confirm email" setting
3. **Disable it**
4. **Save**

## What This Does

- ✅ Disables automatic invitation emails when `signUp()` is called
- ✅ Users can still be created successfully
- ✅ Only the password reset email (activation email) will be sent
- ✅ Users can set their password via the activation link

## Important Notes

- **This affects ALL signups in your project** - if you have other signup flows, they won't send confirmation emails either
- **For organization activation**, this is fine because we handle activation via the password reset flow
- **Users will still receive the activation email** (password reset email) - that's the one they need

## After Disabling

1. **Wait a few minutes** for settings to propagate
2. **Request a new activation email** from your production site
3. **You should only receive ONE email** now: "TUPConnect Portal Activation"
4. **The "You have been invited" email should stop appearing**

## Code Changes Made

I've also updated the activation code (`src/lib/activation.js`) to:
- Remove `emailRedirectTo` from `signUp()` options (this was triggering the invitation email)
- Add better error handling
- Improve logging

**After disabling email confirmations in Supabase, the unwanted invitation emails will stop.**

## Verification

After making the change:
- ✅ Activate a new organization
- ✅ Check your email
- ✅ You should only see "TUPConnect Portal Activation" email
- ✅ No more "You have been invited" emails

## If You Still Receive Invitation Emails

1. **Double-check the setting is disabled** in Supabase
2. **Wait 5-10 minutes** for changes to take effect
3. **Clear your browser cache** and try again
4. **Check Supabase logs**: Dashboard → Logs → Auth to see what emails are being sent

