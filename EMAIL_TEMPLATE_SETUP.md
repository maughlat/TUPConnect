# TUPConnect Email Template Setup - Production Ready

## Quick Setup Instructions

Your TUPConnect site is now live at: **https://tupconnect.vercel.app**

### Step 1: Configure Supabase Redirect URL

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://tupconnect.vercel.app`
3. Add **Redirect URL**: `https://tupconnect.vercel.app/components/setup_password.html`
4. Click **Save**

### Step 2: Update Email Template

1. Go to **Supabase Dashboard** → **Authentication** → **Email**
2. Find the **"Reset Password"** template (this is what Supabase uses for password resets/activation)
3. Click on it to edit
4. Copy the HTML content from `SUPABASE_EMAIL_TEMPLATE.html` file in your project
5. Paste it into the template editor
6. Click **Save**

### Step 3: Test

1. Go to your live site: https://tupconnect.vercel.app/components/login.html
2. Request an activation email for an organization
3. Check the email - it should have your custom template
4. Click the "Set Your Organization Portal Password" button
5. Verify it redirects to: `https://tupconnect.vercel.app/components/setup_password.html`

## How It Works

- The `{{ .RedirectTo }}` variable in the email template is automatically populated by Supabase with the redirect URL you configured
- When a user clicks the button/link, Supabase appends authentication tokens to the URL
- The `setup_password.html` page receives these tokens and allows the user to set their password
- After setting the password, they can log in to the Organization Portal

## Template Location

The ready-to-use email template HTML is in: **`SUPABASE_EMAIL_TEMPLATE.html`**

Just copy the content between the `<div>` tags (excluding the HTML comments at the top) and paste it into Supabase.

## Troubleshooting

**If the link doesn't work:**
- Verify the redirect URL in Supabase → Authentication → URL Configuration matches exactly: `https://tupconnect.vercel.app/components/setup_password.html`
- Check that there are no extra spaces or typos
- Ensure the URL includes `https://` (not `http://`)
- Test by clicking the link in the email and checking the browser console for errors

**If the email template doesn't update:**
- Make sure you clicked "Save" after pasting the template
- Send a new test email (old emails use the old template)
- Check that you're editing the correct template ("Reset Password" not "Confirm Signup")

