# TUPConnect Vercel Deployment Guide

This guide will walk you through deploying your TUPConnect project to Vercel.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Prepare Your Project](#prepare-your-project)
3. [Deploy to Vercel](#deploy-to-vercel)
4. [Configure Supabase Redirect URLs](#configure-supabase-redirect-urls)
5. [Custom Domain (Optional)](#custom-domain-optional)
6. [Post-Deployment Checklist](#post-deployment-checklist)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, make sure you have:

- ✅ A GitHub account (free)
- ✅ A Vercel account (free)
- ✅ Your TUPConnect project ready to deploy
- ✅ Access to your Supabase dashboard

---

## Prepare Your Project

### Step 1: Create a `.gitignore` File (if you don't have one)

Create a `.gitignore` file in your project root to exclude unnecessary files:

```
# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Environment files (if you add them later)
.env
.env.local
```

### Step 2: Initialize Git Repository (if not already done)

Open your terminal in the project folder and run:

```bash
git init
git add .
git commit -m "Initial commit - ready for Vercel deployment"
```

### Step 3: Push to GitHub

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Name it `TUPConnect` (or your preferred name)
   - Choose **Public** or **Private**
   - **Don't** initialize with README, .gitignore, or license
   - Click **Create repository**

2. **Push your code to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/TUPConnect.git
   git branch -M main
   git push -u origin main
   ```

   Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Deploy to Vercel

### Method 1: Deploy via Vercel Dashboard (Recommended for Beginners)

1. **Sign up/Login to Vercel:**
   - Go to https://vercel.com
   - Click **Sign Up** or **Log In**
   - Choose **Continue with GitHub** (easiest option)

2. **Import Your Project:**
   - After logging in, click **Add New** → **Project**
   - You'll see a list of your GitHub repositories
   - Find **TUPConnect** and click **Import**

3. **Configure Project Settings:**
   - **Project Name:** `TUPConnect` (or your choice)
   - **Framework Preset:** Select **Other** or **Vite** (Vercel will auto-detect)
   - **Root Directory:** Leave as `./` (root)
   - **Build Command:** Leave empty (no build needed for static HTML)
   - **Output Directory:** Leave empty or set to `./`
   - **Install Command:** Leave empty

4. **Deploy:**
   - Click **Deploy**
   - Wait for deployment to complete (usually 1-2 minutes)

5. **Get Your Deployment URL:**
   - Once deployed, you'll see: `https://tupconnect-xxxxx.vercel.app`
   - This is your live site URL! 🎉

### Method 2: Deploy via Vercel CLI (Alternative)

If you prefer using the command line:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   - Follow the prompts
   - Deploy to production? **Yes**

4. **Get your URL:**
   - The CLI will output your deployment URL

---

## Configure Supabase Redirect URLs

**CRITICAL:** After deployment, you must update Supabase to allow your production URL.

### Step 1: Get Your Production URL

After deploying to Vercel, you'll have a URL like:
- `https://tupconnect-xxxxx.vercel.app` (default)
- Or your custom domain if you set one up

### Step 2: Update Supabase Redirect URLs

1. **Go to Supabase Dashboard:**
   - Visit https://supabase.com/dashboard
   - Select your TUPConnect project

2. **Navigate to Authentication → URL Configuration:**
   - In the left sidebar, click **Authentication**
   - Scroll down to **CONFIGURATION**
   - Click **URL Configuration**

3. **Update Site URL:**
   - Set **Site URL** to your Vercel URL:
     ```
     https://tupconnect-xxxxx.vercel.app
     ```

4. **Add Redirect URL:**
   - In **Redirect URLs**, click **Add URL**
   - Add your password setup page URL:
     ```
     https://tupconnect-xxxxx.vercel.app/components/setup_password.html
     ```
   - Click **Save**

5. **Save All Changes:**
   - Make sure to click **Save** after making changes

### Step 3: Verify Email Template (Optional)

1. **Go to Authentication → Email:**
   - Click **Email** under **NOTIFICATIONS**
   - Find the **Reset Password** template
   - Verify the redirect URL in the template points to your production URL
   - (The template should automatically use the redirect URL you set above)

---

## Custom Domain (Optional)

If you have a custom domain (e.g., `tupconnect.com`):

### Step 1: Add Domain in Vercel

1. **Go to your project on Vercel Dashboard**
2. **Click Settings → Domains**
3. **Enter your domain** (e.g., `tupconnect.com`)
4. **Follow Vercel's instructions** to configure DNS

### Step 2: Update Supabase URLs

After your domain is live:

1. **Update Supabase Site URL:**
   ```
   https://tupconnect.com
   ```

2. **Update Supabase Redirect URL:**
   ```
   https://tupconnect.com/components/setup_password.html
   ```

---

## Post-Deployment Checklist

After deploying, test everything:

- [ ] **Homepage loads:** Visit your Vercel URL
- [ ] **Browse Clubs page works:** Navigate to `/components/browse.html`
- [ ] **Find Match page works:** Navigate to `/components/findmatch.html`
- [ ] **Login page works:** Navigate to `/components/login.html`
- [ ] **Admin login works:** Test with admin credentials
- [ ] **Organization activation works:**
  - Request an activation email
  - Check that email is received
  - Click the activation link
  - Verify it redirects to setup password page
  - Set password and verify login works
- [ ] **All images load correctly:** Check organization logos
- [ ] **Supabase connection works:** Verify data loads from database

---

## Troubleshooting

### Issue: 404 Errors on Routes

**Problem:** Pages return 404 when navigating directly.

**Solution:** Vercel handles static HTML files automatically, but if you're using client-side routing, you may need a `vercel.json` configuration file. For your current setup (standard HTML files), this shouldn't be an issue.

If needed, create a `vercel.json` file in your project root:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/$1"
    }
  ]
}
```

### Issue: Supabase Connection Errors

**Problem:** Supabase connection fails after deployment.

**Solutions:**
1. Check that your Supabase URL and Anon Key are correct in your HTML files
2. Verify Supabase project is active and not paused
3. Check browser console for specific error messages
4. Ensure CORS is enabled in Supabase (should be by default)

### Issue: Activation Email Links Don't Work

**Problem:** Clicking activation email link shows error.

**Solutions:**
1. Verify redirect URL is added in Supabase → Authentication → URL Configuration
2. Check that the URL in Supabase matches your Vercel URL exactly
3. Make sure URL includes `https://` (not `http://`)
4. Verify the path is correct: `/components/setup_password.html`

### Issue: Assets/Images Not Loading

**Problem:** Images or CSS files don't load.

**Solutions:**
1. Check that file paths use relative paths (e.g., `../assets/image.png`)
2. Verify all assets are committed to Git
3. Check browser console for 404 errors
4. Ensure file names match exactly (case-sensitive)

### Issue: Deployment Fails

**Problem:** Vercel deployment shows errors.

**Solutions:**
1. Check Vercel deployment logs for specific errors
2. Verify all files are committed to Git
3. Make sure there are no syntax errors in your HTML/JS files
4. Check that file structure is correct

### Issue: Changes Not Reflecting

**Problem:** After updating code, changes don't appear on live site.

**Solutions:**
1. Make sure you pushed changes to GitHub:
   ```bash
   git add .
   git commit -m "Update description"
   git push
   ```
2. Vercel automatically redeploys when you push to GitHub
3. Check Vercel dashboard for new deployment status
4. Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)

---

## Automatic Deployments

**Good News!** Vercel automatically redeploys your site whenever you push changes to GitHub:

1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your update message"
   git push
   ```
3. Vercel detects the push and automatically redeploys
4. Your site updates in 1-2 minutes

You can see deployment status in the Vercel dashboard.

---

## Environment Variables (Optional - Advanced)

Currently, your Supabase credentials are hardcoded in the HTML files. For better security practices (especially if you ever add server-side code), you can use environment variables:

### Using Environment Variables in Vercel:

1. **Go to Vercel Dashboard → Your Project → Settings → Environment Variables**
2. **Add variables:**
   - `SUPABASE_URL`: `https://rbmfimbdtiyuiflunuhx.supabase.co`
   - `SUPABASE_ANON_KEY`: `your-anon-key`
3. **Update your HTML files** to read from environment variables (requires a build step)

**Note:** For a static HTML site like yours, hardcoding the Supabase Anon Key is acceptable since it's meant to be public anyway. The real security comes from Row Level Security (RLS) policies in Supabase.

---

## Performance Tips

Vercel automatically optimizes your site, but here are some tips:

1. **Image Optimization:** Consider using Vercel's Image Optimization or Next.js Image component (if migrating to Next.js)
2. **CDN:** Vercel automatically serves your site via a global CDN
3. **Caching:** Static assets are automatically cached
4. **HTTPS:** Automatically enabled (free SSL certificate)

---

## Getting Help

If you encounter issues:

1. **Check Vercel Dashboard Logs:**
   - Go to your project → Deployments → Click on a deployment → View logs

2. **Check Browser Console:**
   - Open Developer Tools (F12) → Console tab
   - Look for JavaScript errors

3. **Check Supabase Logs:**
   - Go to Supabase Dashboard → Logs
   - Filter by "Auth" or "Database"

4. **Vercel Documentation:**
   - https://vercel.com/docs

---

## Summary

✅ **Deployment Steps:**
1. Push code to GitHub
2. Import project in Vercel
3. Deploy
4. Update Supabase redirect URLs
5. Test everything

✅ **Your site will be live at:** `https://tupconnect-xxxxx.vercel.app`

✅ **Future updates:** Just push to GitHub, and Vercel redeploys automatically!

Good luck with your deployment! 🚀

