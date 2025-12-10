# Fix for Session/Recovery Token Issues

## Problems Identified

1. **"Invalid or expired activation link"** - Appearing immediately on page load
2. **"Auth session missing!"** - Appearing when trying to submit password

## Root Cause

The page wasn't properly waiting for Supabase to process the recovery token from the URL hash. When users click the activation email link, Supabase redirects with hash parameters like:

```
#access_token=...&refresh_token=...&type=recovery&expires_in=...
```

Supabase automatically processes these on page load, but it takes a moment. The page was checking for a session too early, before Supabase finished processing.

## Fixes Applied

### 1. Improved Session Initialization (`setup_password.html`)

- ✅ Added retry logic to wait for Supabase to process the recovery token
- ✅ Added auth state change listener to catch when session is established
- ✅ Improved error messages with more helpful guidance
- ✅ Added extensive debugging logs to track session establishment

### 2. Enhanced Password Setup Function

- ✅ Added retry logic for session retrieval before password update
- ✅ Better error message: "Auth session missing!" with helpful guidance
- ✅ Improved session validation

## How It Works Now

1. **Page loads** with recovery token in URL hash
2. **Supabase automatically processes** the hash parameters (takes ~500ms-2s)
3. **Page waits and retries** checking for session up to 5 times (2.5 seconds total)
4. **Auth state listener** catches when session is established
5. **Once session is found**, user can proceed to set password
6. **Password setup** verifies session exists before updating

## Testing After Deployment

1. **Deploy the fix:**
   ```bash
   git add components/setup_password.html
   git commit -m "Fix: Properly handle recovery token and session initialization"
   git push
   ```

2. **Request a NEW activation email** from production site:
   - Go to: https://tupconnect.vercel.app/components/login.html
   - Request activation for an organization

3. **Click the link in the email**

4. **Check browser console** (F12 → Console tab):
   - You should see: "✓ Valid session found. User can set password."
   - If errors, check the debug logs

5. **Set your password:**
   - Enter new password
   - Confirm password
   - Click "Set Password"
   - Should redirect to login page

## What to Look For

### ✅ Success Indicators:
- No error message on page load
- Console shows "Valid session found"
- Password form is enabled
- Can successfully set password

### ❌ If Still Having Issues:

1. **Check browser console:**
   - Look for error messages
   - Check if recovery token is in URL hash
   - Verify session establishment logs

2. **Verify the email link:**
   - Should be: `https://tupconnect.vercel.app/components/setup_password.html#access_token=...`
   - Should NOT be: `127.0.0.1:5500/...`

3. **Check Supabase configuration:**
   - Authentication → URL Configuration
   - Redirect URL should include: `https://tupconnect.vercel.app/components/setup_password.html`

4. **Try in incognito/private window:**
   - Clears any cached sessions or tokens

## Common Issues

### Issue: "Session not established after 5 attempts"
**Possible causes:**
- Recovery token expired (usually valid for 1 hour)
- Token was already used
- Malformed token in URL

**Solution:** Request a new activation email

### Issue: "No recovery token found"
**Possible causes:**
- Link was copied/pasted incorrectly (hash parameters might be lost)
- Email client stripped the hash

**Solution:** Click the link directly from the email, don't copy/paste

### Issue: Session works on page load but fails on submit
**Possible causes:**
- Session expired between page load and submit
- Network issue

**Solution:** The retry logic should handle this, but if it persists, check network connectivity

## Debug Information

The console will show:
```
=== SESSION INITIALIZATION DEBUG ===
URL Hash: Present [hash contents]
Has Recovery Token: true
Session check attempt 1/5: Not found
Session check attempt 2/5: Found
✓ Valid session found. User can set password.
```

If you see errors, check:
- What attempt number it found the session (or if it never found it)
- Any error messages in red
- The URL hash contents

