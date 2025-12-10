# TUPConnect Organization Account Activation Setup Guide

This guide explains how to set up the Organization Account Activation flow in TUPConnect.

## Overview

The activation flow allows Organization Officers to set up their accounts by:
1. Requesting an activation link via the login page
2. Receiving a secure email with a password setup link
3. Setting their password on the dedicated setup page
4. Being redirected to the Organization Portal

## Files Created

### 1. `src/lib/activation.js`
Contains the `triggerAccountActivation()` function that sends the activation email using Supabase's password reset functionality.

### 2. `components/setup_password.html`
The password setup page where Organization Officers set their initial password after clicking the activation link in their email.

## Configuration Steps

### Step 1: Configure Supabase Redirect URL

**CRITICAL:** You must configure the redirect URL in Supabase Auth Settings so the activation email link works correctly.

#### Step 1a: Add Redirect URL to Allowed URLs

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Sign in and select your TUPConnect project

2. **Navigate to Authentication → URL Configuration:**
   - In the left sidebar, click on **"Authentication"** (lock/padlock icon at the top)
   - Scroll down in the sidebar to the **"CONFIGURATION"** section
   - Click on **"URL Configuration"** (you should see it in the list)

3. **Add Redirect URL:**
   - On the "URL Configuration" page, find the **"Redirect URLs"** or **"Additional Redirect URLs"** section
   - Click **"Add URL"** or the **"+"** button (or similar add button)
   - Enter your `setup_password.html` URL:
     ```
     https://yourdomain.com/components/setup_password.html
     ```
   - Or for local testing:
     ```
     http://localhost:5500/components/setup_password.html
     ```
   - Click **"Save"** or **"Update"** to save the changes

4. **Verify Site URL:**
   - On the same "URL Configuration" page, find the **"Site URL"** field (usually at the top)
   - Set it to your main domain (e.g., `https://yourdomain.com`)
   - Or for local testing: `http://localhost:5500`
   - Click **"Save"** if you made changes

#### Step 1b: Verify Email Templates (Optional - for customizing email content)

1. **Navigate to Authentication → Email:**
   - In the left sidebar, under the **"NOTIFICATIONS"** section, click on **"Email"**
   - This will show you the email templates that Supabase uses

2. **Find Password Reset Template:**
   - Look for the **"Reset Password"** or **"Password Reset"** template in the list
   - You can click on it to view or customize the email content if needed
   - **Important:** The redirect URL is configured in "URL Configuration" (Step 1a above), not directly in the template
   - The template will automatically use the redirect URL you set in Step 1a

**Important Notes:**
- The redirect URL must be an absolute URL (include `https://` or `http://`)
- The URL must match exactly where your `setup_password.html` file is located
- Supabase will append authentication tokens to this URL as URL hash parameters (e.g., `#access_token=...&type=recovery`)
- If using localhost, make sure the port matches your development server (commonly 5500, 3000, 8080, etc.)

### Step 2: Verify Supabase Auth Settings

1. **Double-check URL Configuration:**
   - Go back to **Authentication** → **URL Configuration** (in the sidebar under "CONFIGURATION")
   - Verify that **"Site URL"** is set correctly (this is used as a base for redirects)
   - Verify that your `setup_password.html` URL is listed in the **"Redirect URLs"** section
   - Make sure you clicked "Save" after adding the URL

2. **Set Up Custom SMTP (Recommended for Production):**

   Supabase's default email service has rate limits and may not deliver emails reliably. Setting up custom SMTP is recommended.

   #### Option A: Gmail SMTP (Easiest for Testing)

   1. **Enable 2-Step Verification on Gmail:**
      - Go to your Google Account settings: https://myaccount.google.com/
      - Navigate to **Security** → **2-Step Verification**
      - Enable 2-Step Verification if not already enabled

   2. **Generate an App Password:**
      - Go to: https://myaccount.google.com/apppasswords
      - Select **"Mail"** as the app
      - Select **"Other (Custom name)"** as the device
      - Enter a name like "TUPConnect Supabase"
      - Click **"Generate"**
      - **Copy the 16-character password** (you'll need this)

   3. **Configure SMTP in Supabase:**
      - Go to **Authentication** → **Email** (in the sidebar under "NOTIFICATIONS")
      - Scroll down to **"SMTP Settings"** section
      - Toggle **"Enable custom SMTP"** to ON
      - Fill in the following settings:
        ```
        Host: smtp.gmail.com
        Port: 587
        Username: your-email@gmail.com (your Gmail address)
        Password: [paste the 16-character app password from step 2]
        Sender email: your-email@gmail.com (same as username)
        Sender name: TUPConnect (or your preferred name)
        ```
      - Click **"Save"** or **"Update"**

   #### Option B: SendGrid (Recommended for Production)

   1. **Create a SendGrid Account:**
      - Sign up at: https://sendgrid.com/
      - Verify your email address

   2. **Create an API Key:**
      - Go to **Settings** → **API Keys**
      - Click **"Create API Key"**
      - Name it "TUPConnect SMTP"
      - Select **"Full Access"** or **"Restricted Access"** with Mail Send permissions
      - Click **"Create & View"**
      - **Copy the API key** (you'll only see it once!)

   3. **Verify a Sender:**
      - Go to **Settings** → **Sender Authentication**
      - Click **"Verify a Single Sender"**
      - Fill in your details and verify via email

   4. **Configure SMTP in Supabase:**
      - Go to **Authentication** → **Email** in Supabase
      - Toggle **"Enable custom SMTP"** to ON
      - Fill in:
        ```
        Host: smtp.sendgrid.net
        Port: 587
        Username: apikey (literally type "apikey")
        Password: [paste your SendGrid API key from step 2]
        Sender email: [the verified sender email from step 3]
        Sender name: TUPConnect
        ```
      - Click **"Save"**

   #### Option C: Other SMTP Providers

   Common SMTP settings for other providers:

   **Outlook/Office 365:**
   ```
   Host: smtp.office365.com
   Port: 587
   Username: your-email@outlook.com
   Password: your-password
   ```

   **Mailgun:**
   ```
   Host: smtp.mailgun.org
   Port: 587
   Username: postmaster@your-domain.mailgun.org
   Password: [your Mailgun SMTP password]
   ```

   **Postmark:**
   ```
   Host: smtp.postmarkapp.com
   Port: 587
   Username: [your Postmark server API token]
   Password: [your Postmark server API token]
   ```

   **After Setting Up SMTP:**
   - Test by sending a test activation email
   - Check the Supabase logs to verify emails are being sent
   - Make sure to check spam folders initially

**Important Notes:**
- Custom SMTP is **highly recommended** for production use
- Gmail is good for testing but has sending limits (500 emails/day for free accounts)
- SendGrid offers 100 free emails/day and is more reliable for production
- Always use App Passwords for Gmail, never your regular password
- Keep your SMTP credentials secure and never commit them to version control

### Step 3: Troubleshooting Email Issues

If you're not receiving activation emails, check the following:

1. **Check Browser Console for Errors:**
   - Open your browser's Developer Tools (F12)
   - Go to the "Console" tab
   - Try sending an activation email
   - Look for any error messages that might indicate what's wrong
   - Common errors:
     - "User not found" - The system will automatically create the user account
     - "Email rate limit exceeded" - Supabase's default email service has rate limits
     - Network errors - Check your internet connection

2. **Check Supabase Auth Logs:**
   - Go to **Supabase Dashboard** → **Logs** (in the left sidebar)
   - Filter by **"Auth"** events
   - Look for any errors related to email sending or user creation
   - Check if emails are being sent but failing to deliver

3. **Check Spam/Junk Folder:**
   - Activation emails might be filtered as spam
   - Check your email's spam/junk folder
   - Add Supabase emails to your contacts/whitelist

4. **Verify Email Address:**
   - Make sure the email address is correct and valid
   - The email must match exactly what's stored in the database
   - Check for typos or extra spaces

5. **Rate Limits:**
   - Supabase's default email service has strict rate limits (usually 3-4 emails per hour per project)
   - Gmail has limits: 500 emails/day for free accounts
   - SendGrid offers 100 free emails/day
   - If you hit rate limits, wait before trying again or upgrade your SMTP plan

6. **User Account Creation:**
   - The system will automatically create the user account if it doesn't exist
   - If you see "User created" in the console but no email, check the logs
   - The user account is created with a temporary password, then a password reset email is sent

**If emails still don't work:**
- Consider setting up custom SMTP (Gmail, SendGrid, etc.) for better deliverability
- Check Supabase's status page for any service issues
- Review the browser console and Supabase logs for specific error messages

### Step 3: Test the Activation Flow

1. **Test Email Sending:**
   - Go to the login page
   - Select "Organization" role
   - Click "Activate Your Organization"
   - Select an inactive organization
   - Enter the organization's official email
   - Submit the form
   - Check the email inbox for the activation link

2. **Test Password Setup:**
   - Click the activation link in the email
   - You should be redirected to `setup_password.html`
   - Enter a new password (at least 6 characters)
   - Confirm the password
   - Click "Set Password"
   - You should be redirected to the login page

3. **Test Login:**
   - After setting the password, try logging in with the email and new password
   - Select "Organization" role
   - Enter credentials
   - You should be redirected to the Organization Portal

## How It Works

### Activation Email Trigger

When an Organization Officer requests activation:
1. The system validates the email matches the organization's official email in the database
2. `triggerAccountActivation()` is called with the email address
3. Supabase sends a password reset email with a secure token
4. The email contains a link to `setup_password.html` with authentication tokens

### Password Setup Process

When the officer clicks the activation link:
1. The `setup_password.html` page loads
2. The page verifies a valid session or recovery token exists
3. The officer enters and confirms their new password
4. `handlePasswordSetup()` updates the password using `supabase.auth.updateUser()`
5. Upon success, the officer is redirected to the login page

### Security Features

- **Email Validation:** Only the official email registered in the database can be used
- **Secure Tokens:** Supabase generates secure, time-limited tokens for password setup
- **Session Verification:** The setup page verifies valid authentication before allowing password changes
- **Password Requirements:** Minimum 6 characters (can be customized)
- **Password Confirmation:** Ensures passwords match before submission

## Troubleshooting

### Issue: Activation email not received

**Solutions:**
- Check spam/junk folder
- Verify email address is correct in the database
- Check Supabase Dashboard → Authentication → Logs for email sending errors
- Verify email service is configured in Supabase (SMTP settings)

### Issue: Redirect URL not working

**Solutions:**
- Go to **Authentication** → **URL Configuration** and verify your `setup_password.html` URL is in the "Redirect URLs" list
- Ensure the URL is absolute (includes `https://` or `http://`)
- Make sure the URL matches exactly where your `setup_password.html` file is located
- Check browser console for errors when clicking the activation link
- Verify `setup_password.html` is accessible at the specified URL
- For localhost testing, ensure the port number matches your development server

### Issue: "Invalid or expired activation link" error

**Solutions:**
- Activation links expire after a certain time (default: 1 hour)
- Request a new activation email
- Verify the link wasn't modified or truncated
- Check that the URL hash parameters are preserved

### Issue: Password setup fails

**Solutions:**
- Ensure password is at least 6 characters
- Check that passwords match in both fields
- Verify Supabase authentication is working
- Check browser console for specific error messages

## Integration with Admin Portal

The activation function can also be called from the Admin Portal when activating an organization:

```javascript
// Example: Trigger activation from Admin Portal
const result = await triggerAccountActivation('compass@tup.edu.ph');
if (result.success) {
  console.log('Activation email sent');
} else {
  console.error('Error:', result.error);
}
```

## Next Steps

After successful activation:
1. The organization's `account_status` should be updated to `'Pending Activation'` or `'Account Activated'`
2. The organization should be removed from the activation dropdown (if `is_active = true`)
3. The officer can now log in using their email and password

## Support

For issues or questions:
1. Check Supabase Dashboard → Authentication → Logs
2. Review browser console for JavaScript errors
3. Verify all configuration steps were completed
4. Test with a known working email address

