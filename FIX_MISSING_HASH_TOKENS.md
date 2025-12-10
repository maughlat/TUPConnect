# Fix: URL Hash Missing - No Recovery Tokens in Email Link

## Problem Identified

The console shows:
- ❌ URL Hash: Missing
- ❌ Access Token Present: false
- ❌ Refresh Token Present: false

**This means the email link doesn't contain the recovery tokens.** When you click the link, there's no hash in the URL at all.

## Root Cause

The email link from Supabase is not including the hash parameters with tokens. This happens when:
1. **Redirect URL not configured correctly in Supabase**
2. **Email template using wrong variable**
3. **Supabase not generating the link properly**

## Solution: Verify and Fix Supabase Configuration

### Step 1: Check Supabase Redirect URL Configuration

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `rbmfimbdtiyuiflunuhx`
3. **Navigate to**: Authentication → URL Configuration (under CONFIGURATION in sidebar)
4. **Check these settings:**

   **Site URL:**
   - Should be: `https://tupconnect.vercel.app`
   - NOT: `http://localhost:3000` or empty

   **Redirect URLs:**
   - Should include: `https://tupconnect.vercel.app/components/setup_password.html`
   - Make sure it's listed in the "Additional Redirect URLs" section
   - Click "Add URL" if it's not there
   - **IMPORTANT**: The URL must be EXACT including `https://` (not `http://`)

5. **Click "Save"** if you made any changes

### Step 2: Verify Email Template

1. **Go to**: Authentication → Email (under NOTIFICATIONS)
2. **Find**: "Reset Password" template (this is used for activation)
3. **Check the template**: Make sure it uses `{{ .RedirectTo }}` or `{{ .URL }}`
4. **The link should look like:**
   ```html
   <a href="{{ .RedirectTo }}">Set Your Organization Portal Password</a>
   ```
   OR
   ```html
   <a href="{{ .URL }}">Set Your Organization Portal Password</a>
   ```

### Step 3: Test the Activation Flow

1. **Request a NEW activation email** from production site
2. **Before clicking the link, check the email:**
   - Right-click the button/link
   - Select "Copy link address" or "Inspect"
   - The link should look like:
     ```
     https://tupconnect.vercel.app/components/setup_password.html#access_token=...&refresh_token=...&type=recovery&...
     ```
   - If the link does NOT have `#access_token=...`, then Supabase isn't generating it correctly

### Step 4: Check Supabase Logs

1. **Go to**: Supabase Dashboard → Logs
2. **Filter by**: Auth events
3. **Look for**: Password reset email sent events
4. **Check if there are any errors** when sending the email

## Alternative: Manual Token Processing

If Supabase still doesn't add hash to the URL, we can modify the code to check query parameters instead (though hash is preferred).

## Testing Checklist

- [ ] Site URL in Supabase is `https://tupconnect.vercel.app`
- [ ] Redirect URL `https://tupconnect.vercel.app/components/setup_password.html` is added
- [ ] Redirect URL includes `https://` (not `http://`)
- [ ] Email template uses `{{ .RedirectTo }}` or `{{ .URL }}`
- [ ] Requested NEW activation email after fixing settings
- [ ] Email link contains `#access_token=...` when copied
- [ ] No errors in Supabase logs

## If Hash Still Missing After Fixes

If after fixing Supabase configuration the hash is still missing, the issue might be:

1. **Email client stripping the hash**: Some email clients remove hash fragments
   - **Solution**: Try clicking the link from a different email client or browser
   - Copy the link and paste it directly in browser address bar

2. **Supabase project configuration issue**: 
   - Check if you're using the correct Supabase project
   - Verify project URL matches your code

3. **Email template issue**:
   - Make sure template uses the correct Supabase variables
   - Try resetting to default template and then customizing again

