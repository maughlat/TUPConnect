# Fix Leaked API Key - Step by Step

## 🚨 Your Situation

You have **2 API keys**:
1. **Key `...E33A`** - ⚠️ **WARNING: Publicly exposed** (Dec 11, 2025) - **DO NOT USE THIS ONE**
2. **Key `...Pe0U`** - Default Gemini API Key (Dec 1, 2025) - This might work, but let's create a fresh one

## ✅ Solution: Delete Leaked Key & Create New One

### Step 1: Delete the Leaked API Key

1. **In the API Keys dashboard** (where you see the warning)
2. **Find the key ending in `...E33A`** (the one with the yellow warning)
3. **Click the three dots (`⋯`)** icon on the right side of that row
4. **Click "Delete"** or "Revoke" from the menu
5. **Confirm deletion** when prompted
6. **The warning banner should disappear** after deletion

### Step 2: Create a Brand New API Key

1. **Click the "Create API key" button** (top right, with the key icon)
2. **Select a project:**
   - If you see "TUPConnect" project, select it
   - Or create a new one if needed
3. **Copy the new API key** immediately (starts with `AIza...`)
4. **IMPORTANT:** Save it somewhere safe - you won't see it again!

### Step 3: Update Vercel Environment Variable

1. **Go to Vercel Dashboard:** https://vercel.com/dashboard
2. **Click on your TUPConnect project**
3. **Click "Settings" tab** (at the top)
4. **Click "Environment Variables"** (in left sidebar)
5. **Find `GEMINI_API_KEY`** in the list
6. **Click on it** (or click the edit/pencil icon)
7. **Delete the OLD key** completely
8. **Paste your NEW key** (the one you just created)
9. **Verify all environments are checked:**
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
10. **Click "Save"**

### Step 4: Redeploy (CRITICAL!)

**You MUST redeploy after updating the environment variable!**

1. **In Vercel Dashboard**, click the **"Deployments"** tab
2. **Find the most recent deployment**
3. **Click the three dots (`⋯`)** next to it
4. **Click "Redeploy"**
5. **Click "Redeploy"** again to confirm
6. **Wait 1-2 minutes** for it to finish (watch for the green checkmark ✅)

### Step 5: Test

1. **Test with Postman** using the same request
2. **It should work now!** ✅

## 🔒 Prevent Future Exposure

### What Happened:
- You accidentally committed the API key to GitHub
- Google's scanners detected it in the public repository
- Even after you removed it, Google permanently flagged that key

### Best Practices:
- ✅ **NEVER commit `.env` files** to git
- ✅ **Always use `.gitignore`** to exclude files with secrets
- ✅ **Use environment variables** (like Vercel) - which you're already doing correctly!
- ✅ **Rotate keys immediately** if exposed (like you're doing now)

### If You Have `.env` Files Locally:
1. Make sure `.env` is in your `.gitignore` file
2. Check if `.env` is already committed: `git ls-files | grep .env`
3. If it is, remove it: `git rm --cached .env` (keeps local file, removes from git)
4. Never commit actual API keys - use `.env.example` with placeholder values

## ✅ You're Doing Everything Right!

The fact that you:
- Removed it from GitHub immediately ✅
- Are using environment variables in Vercel ✅
- Are creating a new key now ✅

Shows you're handling this correctly! Once you delete the old key, create a new one, and update Vercel, everything will work perfectly.

