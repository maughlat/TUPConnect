# How to Customize the Password Reset Email Template in Supabase

## Problem
You're receiving the default Supabase password reset email template instead of a customized one. This happens because Supabase uses default templates unless you explicitly customize and save them.

## Solution: Customize the Email Template

### Step 1: Navigate to Email Templates

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Sign in and select your TUPConnect project

2. **Go to Authentication → Email:**
   - In the left sidebar, click on **"Authentication"** (lock/padlock icon)
   - Under the **"NOTIFICATIONS"** section, click on **"Email"**

3. **Find the Password Reset Template:**
   - You should see a list of email templates
   - Look for **"Reset Password"** or **"Password Reset"** template
   - Click on it to open the editor

### Step 2: Customize the Template

The email template uses variables that Supabase will replace with actual values:

**Available Variables:**
- `{{ .ConfirmationURL }}` - The activation link (points to your `setup_password.html`)
- `{{ .Token }}` - The 8-digit code (like "68278454")
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - The recipient's email address
- `{{ .RedirectTo }}` - The redirect URL you configured

**Example Custom Template:**

```html
<h2>Activate Your TUPConnect Organization Account</h2>

<p>Hello,</p>

<p>You have requested to activate your organization account on TUPConnect. Click the button below to set your password and complete the activation:</p>

<p>
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #A32727; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
    Activate Account & Set Password
  </a>
</p>

<p>Or copy and paste this link into your browser:</p>
<p style="word-break: break-all; color: #666;">{{ .ConfirmationURL }}</p>

<p><strong>Alternatively, enter this code:</strong> {{ .Token }}</p>

<p>This link will expire in 24 hours for security reasons.</p>

<p>If you didn't request this activation, please ignore this email.</p>

<p>Best regards,<br>TUPConnect Team</p>
```

**Or a simpler version:**

```
Activate Your TUPConnect Organization Account

Hello,

You have requested to activate your organization account on TUPConnect.

Click this link to set your password:
{{ .ConfirmationURL }}

Or enter this code: {{ .Token }}

This link expires in 24 hours.

If you didn't request this, please ignore this email.

TUPConnect Team
```

### Step 3: Save the Template

1. **After editing the template:**
   - Make sure you've replaced the default content with your custom template
   - Use the variables (like `{{ .ConfirmationURL }}`) where you want dynamic content

2. **Click "Save" or "Update":**
   - Look for a **"Save"**, **"Update"**, or **"Save Changes"** button
   - This is crucial - if you don't save, it will still use the default template

3. **Verify it's saved:**
   - The template should show as "Custom" or have a checkmark
   - You might see a confirmation message

### Step 4: Test the Template

1. **Send a test activation email:**
   - Go to your login page
   - Request an activation email for an organization
   - Check the email you receive

2. **Verify:**
   - The email should now use your custom template
   - The link should still work correctly
   - The code should still be displayed

## Important Notes

### Why You're Seeing the Default Template

- **Default templates are always active** until you customize and save a new one
- **Preview vs. Actual:** The template editor might show a preview, but the actual email uses what's saved
- **Template not saved:** If you edited but didn't click "Save", it's still using the default

### Template Variables

- **`{{ .ConfirmationURL }}`** - This is the most important one. It contains the full link to your `setup_password.html` page with authentication tokens
- **`{{ .Token }}`** - The 8-digit code (like "68278454") that users can enter manually
- **Both work:** Users can either click the link OR enter the code

### Subject Line

- You can also customize the **Subject** line of the email
- Look for a "Subject" field in the template editor
- Example: `"Activate Your TUPConnect Account"` or `"Set Your Organization Password"`

### HTML vs Plain Text

- Supabase supports both HTML and plain text templates
- HTML templates allow for styling, buttons, colors, etc.
- Plain text templates are simpler but less visually appealing
- Choose based on your needs

## Troubleshooting

### Template Still Shows Default

1. **Check if you saved:**
   - Go back to the template editor
   - Make sure your changes are still there
   - If not, you didn't save properly

2. **Clear cache:**
   - Sometimes Supabase caches templates
   - Wait a few minutes and try again
   - Or send a new test email

3. **Check template type:**
   - Make sure you're editing the correct template
   - There might be separate templates for different email types

### Link Not Working

- The `{{ .ConfirmationURL }}` variable automatically includes your redirect URL
- Make sure your redirect URL is configured in **Authentication → URL Configuration**
- The link should point to your `setup_password.html` page

### Code Not Showing

- The `{{ .Token }}` variable should display the 8-digit code
- If it's not showing, make sure you included it in your template
- The code is always generated, even if you don't display it

## Quick Checklist

- [ ] Navigated to Authentication → Email
- [ ] Found and opened "Reset Password" template
- [ ] Customized the template content
- [ ] Used `{{ .ConfirmationURL }}` for the activation link
- [ ] Used `{{ .Token }}` for the code (optional)
- [ ] Clicked "Save" or "Update"
- [ ] Verified template shows as "Custom" or saved
- [ ] Tested by sending a new activation email
- [ ] Confirmed new template is being used

## Example: Complete Custom Template

Here's a complete example you can copy and paste:

**Subject:** `Activate Your TUPConnect Organization Account`

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #A32727;">Activate Your TUPConnect Organization Account</h2>
    
    <p>Hello,</p>
    
    <p>You have requested to activate your organization account on TUPConnect. To complete the activation, please set your password by clicking the button below:</p>
    
    <p style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 28px; background-color: #A32727; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Activate Account & Set Password
      </a>
    </p>
    
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666; background: #f5f5f5; padding: 10px; border-radius: 4px;">
      {{ .ConfirmationURL }}
    </p>
    
    <p><strong>Alternatively, you can enter this code:</strong> <code style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px; font-size: 18px; font-weight: bold;">{{ .Token }}</code></p>
    
    <p style="color: #666; font-size: 14px;">This activation link will expire in 24 hours for security reasons.</p>
    
    <p>If you didn't request this activation, please ignore this email.</p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    
    <p style="color: #666; font-size: 12px;">
      Best regards,<br>
      <strong>TUPConnect Team</strong>
    </p>
  </div>
</body>
</html>
```

**Body (Plain Text - Simpler):**
```
Activate Your TUPConnect Organization Account

Hello,

You have requested to activate your organization account on TUPConnect.

To complete the activation, please set your password by clicking this link:
{{ .ConfirmationURL }}

Or enter this code: {{ .Token }}

This activation link expires in 24 hours.

If you didn't request this activation, please ignore this email.

Best regards,
TUPConnect Team
```

After customizing, make sure to **SAVE** the template, and then test it by sending a new activation email!

