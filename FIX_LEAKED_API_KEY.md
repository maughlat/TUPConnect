# Fix: API Key Reported as Leaked

## 🚨 Problem

Your Gemini API key was flagged as "leaked" and has been revoked by Google. This happens when API keys are exposed publicly (like in git commits, logs, screenshots, etc.).

**Error message:**
```
"Your API key was reported as leaked. Please use another API key."
```

## ✅ Solution: Create a New API Key

**It's NOT too late!** Just create a fresh API key. Here's how:

### Step 1: Create a New API Key

1. **Go to Google AI Studio:** https://aistudio.google.com/app/apikey
2. **Sign in** with your Google account
3. **Look for your existing API keys** (if any)
   - You might see your old key marked as "Revoked" or with an error
   - **DO NOT try to reuse the old key** - it won't work
4. **Click "Create API Key"** button
5. **Select your project** (or create a new one)
6. **Copy the NEW API key** (starts with `AIza...`)
7. **Save it somewhere safe** - you won't be able to see it again!

### Step 2: Update Vercel Environment Variable

1. **Go to Vercel Dashboard:** https://vercel.com/dashboard
2. **Click on your TUPConnect project**
3. **Click "Settings" tab** (at the top)
4. **Click "Environment Variables"** (in left sidebar)
5. **Find `GEMINI_API_KEY`** in the list
6. **Click on it** (or click the edit/pencil icon)
7. **Replace the old key** with your NEW API key:
   - Delete the old key value
   - Paste your NEW key
8. **Make sure all environments are checked:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development
9. **Click "Save"**

### Step 3: Redeploy

**Important:** After updating the environment variable, you MUST redeploy!

1. **In Vercel Dashboard**, click the **"Deployments"** tab
2. **Find the most recent deployment**
3. **Click the three dots (`⋯`)** next to it
4. **Click "Redeploy"**
5. **Click "Redeploy"** again to confirm
6. **Wait 1-2 minutes** for it to finish

### Step 4: Test Again

1. **Test with Postman** (or your testing tool)
2. **You should now see it working!**

## 🔒 Prevent This in the Future

### DO:
- ✅ Store API keys in environment variables (Vercel, not in code)
- ✅ Use `.env` files locally (and add `.env` to `.gitignore`)
- ✅ Never commit API keys to git
- ✅ Rotate keys periodically

### DON'T:
- ❌ Commit API keys to git repositories
- ❌ Share API keys in screenshots or messages
- ❌ Hard-code API keys in source code
- ❌ Post API keys publicly

## ✅ Good News!

The **code is working perfectly**! The logs show:
- ✅ ListModels API call succeeded
- ✅ Found 32 available models including `gemini-2.0-flash`, `gemini-pro-latest`, etc.
- ✅ The only issue is the revoked API key

Once you create a new key and update it in Vercel, everything should work immediately!

