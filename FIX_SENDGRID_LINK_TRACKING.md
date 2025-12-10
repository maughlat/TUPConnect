# Fix: SendGrid Tracking Link Breaking Hash Tokens

## Problem Identified

The email link is going through **SendGrid's tracking system**:
```
https://u57938898.ct.sendgrid.net/ls/click?upn=...
```

This tracking link redirects through SendGrid first, then to your site. **The problem is that hash fragments (`#access_token=...`) are often lost during redirect chains**, especially through tracking services.

## Root Cause

When Supabase generates the email, it creates a link like:
```
https://tupconnect.vercel.app/components/setup_password.html#access_token=...
```

But SendGrid wraps it in a tracking URL, and when the tracking redirects, the hash fragment (`#access_token=...`) gets lost because:
1. Hash fragments are **not sent to the server** during redirects
2. SendGrid's tracking server receives the URL but the hash stays in the browser
3. The redirect chain breaks and the hash is lost

## Solution: Disable SendGrid Click Tracking

You need to disable SendGrid's click tracking so the link goes directly to your site without redirects.

### Option 1: Disable Click Tracking in SendGrid Dashboard (Recommended)

1. **Go to SendGrid Dashboard**: https://app.sendgrid.com/
2. **Navigate to**: Settings → Tracking
3. **Find "Click Tracking"**
4. **Turn it OFF** or **Disable it**
5. **Save changes** 

**Note:** This disables tracking for ALL emails sent through SendGrid. If you only want to disable it for password reset emails, you'll need to configure it via API (Option 2).

### Option 2: Disable Tracking Per Email (Via Supabase SMTP Settings)

If Supabase supports per-email tracking settings, you might be able to disable it in the email template or SMTP configuration. Check:
- Supabase Dashboard → Authentication → Email → SMTP Settings
- Look for "Disable click tracking" or similar option

### Option 3: Use a Different Email Variable

Some email services support variables that bypass tracking. In Supabase email templates, try using:
- `{{ .ConfirmationURL }}` instead of `{{ .RedirectTo }}` 
- Check Supabase documentation for variables that preserve hash fragments

### Option 4: Switch SMTP Provider Temporarily

If SendGrid can't be configured properly:
1. Use Gmail SMTP (simpler, no tracking by default)
2. Or use another provider that doesn't interfere with hash fragments

## Alternative Solution: Use Query Parameters Instead

Since hash fragments are lost in redirects, we could modify the code to accept tokens as **query parameters** instead of hash fragments. However, this requires changes to both:
1. How Supabase generates the link (may not be configurable)
2. The setup_password.html code to read from query params

**Note:** This is a workaround. The proper fix is to disable SendGrid tracking.

## Immediate Steps

1. **Disable SendGrid Click Tracking:**
   - Go to SendGrid Dashboard → Settings → Tracking
   - Turn OFF "Click Tracking"
   - Save

2. **Wait 5-10 minutes** for changes to propagate

3. **Request a NEW activation email**

4. **Check the email link:**
   - Should now go directly to: `https://tupconnect.vercel.app/components/setup_password.html#access_token=...`
   - Should NOT go through `sendgrid.net`

5. **Click the link** - hash tokens should now be preserved

## Why This Happens

- **Hash fragments (`#...`)** are client-side only - browsers don't send them to servers
- When SendGrid tracks clicks, it redirects through their server
- The server never sees the hash, so it can't preserve it in the redirect
- Result: Hash is lost, no tokens, authentication fails

## Verification

After disabling tracking, the email link should look like:
```html
<a href="https://tupconnect.vercel.app/components/setup_password.html#access_token=xxx&refresh_token=yyy&type=recovery">
```

NOT like:
```html
<a href="https://u57938898.ct.sendgrid.net/ls/click?upn=...">
```

## If You Still Need Tracking

If you need SendGrid tracking for other emails but want to bypass it for password resets:
1. Use a separate SendGrid account/API key for password reset emails
2. Or configure Supabase to use different SMTP settings for password resets (if supported)
3. Or accept that password reset links can't be tracked (which is actually more secure)

## Security Note

Disabling click tracking for password reset emails is actually **more secure** because:
- No third-party service can intercept the link
- Direct redirect preserves all tokens
- Reduces attack surface

