# SMTP Email Troubleshooting Checklist

If you're not receiving activation emails after setting up SMTP, follow this checklist:

## ✅ Step 1: Verify SMTP Configuration in Supabase

1. **Go to Supabase Dashboard:**
   - Navigate to: **Authentication** → **Email** (under "NOTIFICATIONS" in sidebar)
   - Scroll to **"SMTP Settings"** section

2. **Check these settings are correct:**

   **For Gmail:**
   ```
   ✅ Enable custom SMTP: ON (toggle should be enabled)
   ✅ Host: smtp.gmail.com
   ✅ Port: 587
   ✅ Username: your-email@gmail.com (your full Gmail address)
   ✅ Password: [16-character app password from Google]
   ✅ Sender email: your-email@gmail.com (same as username)
   ✅ Sender name: TUPConnect (or any name)
   ```

   **Common mistakes:**
   - ❌ Using your regular Gmail password instead of App Password
   - ❌ Wrong port (should be 587, not 465 or 25)
   - ❌ Typo in hostname (should be `smtp.gmail.com`)
   - ❌ SMTP toggle not enabled
   - ❌ Extra spaces in email or password fields

3. **Click "Save" or "Update"** after making changes

## ✅ Step 2: Test SMTP Connection

1. **In Supabase Dashboard:**
   - Go to **Authentication** → **Email**
   - Look for a **"Test Email"** or **"Send Test Email"** button
   - If available, send a test email to yourself
   - Check if you receive it

2. **If test email fails:**
   - Double-check all SMTP settings
   - Verify your App Password is correct
   - Check if 2-Step Verification is enabled on Gmail

## ✅ Step 3: Check Browser Console

1. **Open Developer Tools:**
   - Press `F12` or right-click → "Inspect"
   - Go to **"Console"** tab

2. **Try sending an activation email:**
   - Fill out the activation form
   - Submit it
   - Watch the console for messages

3. **Look for these messages:**
   - ✅ `"Sending activation email to: [email]"`
   - ✅ `"Redirect URL: [url]"`
   - ✅ `"triggerAccountActivation success: Activation email sent to [email]"`
   - ❌ Any red error messages

4. **Common console errors:**
   - `"User not found"` → System will create user automatically
   - `"Failed to send activation email"` → Check SMTP settings
   - `"Network error"` → Check internet connection
   - `"Invalid email"` → Verify email format

## ✅ Step 4: Check Supabase Logs

1. **Go to Supabase Dashboard:**
   - Click **"Logs"** in the left sidebar
   - Filter by **"Auth"** events

2. **Look for:**
   - Email sending events
   - Error messages related to SMTP
   - User creation events

3. **Common log errors:**
   - `"SMTP authentication failed"` → Wrong password or username
   - `"Connection timeout"` → Wrong host or port
   - `"Email rate limit exceeded"` → Too many emails sent

## ✅ Step 5: Verify Email Address

1. **Check the email address:**
   - Make sure it matches exactly what's in the database
   - No extra spaces before or after
   - Correct spelling
   - Valid email format

2. **Test with a different email:**
   - Try sending to a different email address you control
   - This helps determine if it's email-specific or system-wide

## ✅ Step 6: Check Email Folders

1. **Check all folders:**
   - ✅ Inbox
   - ✅ Spam/Junk
   - ✅ Promotions (Gmail)
   - ✅ Social (Gmail)
   - ✅ All Mail

2. **Search for:**
   - "TUPConnect"
   - "password reset"
   - "activation"
   - The sender email address

## ✅ Step 7: Gmail-Specific Checks

If using Gmail SMTP:

1. **Verify App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Make sure you see the app password you created
   - If not, create a new one

2. **Check 2-Step Verification:**
   - Go to: https://myaccount.google.com/security
   - Make sure 2-Step Verification is **ON**
   - App Passwords only work with 2-Step Verification enabled

3. **Check Gmail Security:**
   - Go to: https://myaccount.google.com/security
   - Look for "Less secure app access" (should be OFF - we use App Passwords instead)
   - Check "Recent security activity" for any blocked sign-ins

## ✅ Step 8: Verify Redirect URL Configuration

1. **Go to Supabase Dashboard:**
   - **Authentication** → **URL Configuration** (under "CONFIGURATION")

2. **Check:**
   - ✅ Site URL is set correctly
   - ✅ Redirect URL for `setup_password.html` is added
   - ✅ URL matches your actual domain/localhost

3. **Example for localhost:**
   ```
   http://localhost:5500/components/setup_password.html
   ```

4. **Example for production:**
   ```
   https://yourdomain.com/components/setup_password.html
   ```

## ✅ Step 9: Wait and Retry

1. **Email delivery delays:**
   - Sometimes emails take 1-5 minutes to arrive
   - Wait a few minutes before assuming it failed

2. **Rate limits:**
   - Gmail: 500 emails/day (free account)
   - Supabase default: 3-4 emails/hour
   - If you've sent many test emails, wait before trying again

## ✅ Step 10: Alternative: Use SendGrid

If Gmail continues to have issues, try SendGrid:

1. **Sign up:** https://sendgrid.com/
2. **Create API Key:** Settings → API Keys → Create API Key
3. **Verify Sender:** Settings → Sender Authentication
4. **Configure in Supabase:**
   ```
   Host: smtp.sendgrid.net
   Port: 587    
   Username: apikey
   Password: [your SendGrid API key]
   Sender email: [verified sender email]
   ```

## 🔍 Still Not Working?

If you've checked everything above and still not receiving emails:

1. **Share these details:**
   - Browser console errors (screenshot)
   - Supabase Auth logs (screenshot)
   - SMTP settings (without showing password)
   - What happens when you submit the form (success/error message)

2. **Try a different email provider:**
   - Use SendGrid instead of Gmail
   - Or try Outlook/Office 365

3. **Check Supabase Status:**
   - Visit: https://status.supabase.com/
   - Check if there are any service issues

## Quick Test Checklist

Before asking for help, verify:

- [ ] SMTP is enabled in Supabase
- [ ] All SMTP settings are correct (host, port, username, password)
- [ ] App Password is correct (for Gmail)
- [ ] 2-Step Verification is enabled (for Gmail)
- [ ] Redirect URL is configured in Supabase
- [ ] Browser console shows no errors
- [ ] Checked spam/junk folder
- [ ] Waited 5 minutes for email delivery
- [ ] Tried with a different email address

