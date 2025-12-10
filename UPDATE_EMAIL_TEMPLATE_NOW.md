# URGENT: Update Email Template to Use ConfirmationURL

## Problem

The email template is using `{{ .RedirectTo }}` which only contains the base URL without tokens. The link shows as:
```
https://tupconnect.vercel.app/components/setup_password.html
```

But it should include tokens like:
```
https://tupconnect.vercel.app/components/setup_password.html#access_token=xxx&refresh_token=yyy&type=recovery
```

## Solution: Update Email Template

### Step 1: Update the Template in Supabase

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `rbmfimbdtiyuiflunuhx`
3. **Navigate to**: Authentication → Email (under NOTIFICATIONS)
4. **Find**: "Reset Password" template
5. **Click on it to edit**

### Step 2: Replace the Link Variable

**FIND this line in the template:**
```html
<a href="{{ .RedirectTo }}" ...>
```

**REPLACE with:**
```html
<a href="{{ .ConfirmationURL }}" ...>
```

### Step 3: Update the Full Template

Copy the updated template from `SUPABASE_EMAIL_TEMPLATE.html` file. The key change is:

**OLD (WRONG):**
```html
<a href="{{ .RedirectTo }}" ...>
```

**NEW (CORRECT):**
```html
<a href="{{ .ConfirmationURL }}" ...>
```

### Step 4: Save and Test

1. **Click "Save"** in Supabase
2. **Wait 2-3 minutes** for changes to apply
3. **Request a NEW activation email**
4. **Check the email link** - it should now contain `#access_token=...`

## Why This Works

- `{{ .RedirectTo }}` = Just the redirect URL (no tokens) ❌
- `{{ .ConfirmationURL }}` = Full URL WITH authentication tokens ✅
- `{{ .URL }}` = Alternative variable that should also include tokens ✅

## If ConfirmationURL Doesn't Work

If `{{ .ConfirmationURL }}` also doesn't include tokens, try:

1. **Use `{{ .URL }}` instead**
2. **Check Supabase documentation** for your Supabase version
3. **Look at the default template** to see what variable Supabase uses

## Verification

After updating:
- ✅ Copy the link from the email
- ✅ It should contain: `#access_token=...&refresh_token=...&type=recovery`
- ✅ Click the link - should work now!

The template file has been updated. Just copy it to Supabase Dashboard!

