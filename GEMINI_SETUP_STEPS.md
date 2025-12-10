# Gemini AI Integration - Step-by-Step Setup Guide

This guide will walk you through implementing the Gemini AI integration for the "Find Your Match" feature.

## 🎯 Quick Overview

**What you'll do:**
1. Get a Gemini API key from Google
2. Create a serverless function file
3. Install a package
4. Add the API key to Vercel
5. Deploy and test

**Time needed:** ~15-20 minutes

---

## Prerequisites

- A Google Cloud account with Gemini API access
- Your TUPConnect project deployed on Vercel (or ready to deploy)
- Access to Vercel Dashboard for environment variables

---

## Step 1: Get Your Gemini API Key

### 1.1 Open Google AI Studio

1. **Open your web browser** (Chrome, Firefox, Edge, etc.)
2. **Go to one of these URLs:**
   - Primary: https://aistudio.google.com/app/apikey
   - Alternative: https://makersuite.google.com/app/apikey
3. **Press Enter** to load the page

### 1.2 Sign In (if not already signed in)

1. **Look at the top-right corner** of the page
2. **If you see "Sign in" button:**
   - Click the **"Sign in"** button
   - Enter your Google account email
   - Enter your password
   - Click **"Next"** if prompted
   - Complete any 2-factor authentication if required
3. **If you're already signed in**, you'll see your profile picture/icon in the top-right

### 1.3 Create API Key

1. **Look for a button that says "Create API Key"**
   - It's usually a blue button on the main page
   - Or you might see "Get API Key" button
2. **Click the "Create API Key" or "Get API Key" button**
3. **A popup or modal window will appear**
4. **If you see a dropdown asking "Create API key in new project" or "Select a project":**
   - **Option A:** If you have existing Google Cloud projects, click the dropdown and select one
   - **Option B:** If you don't have projects or want a new one, click **"Create API key in new project"**
5. **Wait for the API key to be generated** (usually takes 1-2 seconds)

### 1.4 Copy Your API Key

1. **You'll see a long string of text** that starts with `AIza...` (for example: `AIzaSyD1234567890abcdefghijklmnopqrstuvwxyz`)
2. **Click inside the text box** containing the API key
3. **Select all the text:**
   - Press `Ctrl + A` (Windows) or `Cmd + A` (Mac) to select all
   - OR click and drag your mouse across all the text
4. **Copy the selected text:**
   - Press `Ctrl + C` (Windows) or `Cmd + C` (Mac)
   - OR right-click and select **"Copy"**
5. **IMPORTANT:** Paste it somewhere safe immediately:
   - Open Notepad (Windows) or TextEdit (Mac)
   - Press `Ctrl + V` (Windows) or `Cmd + V` (Mac) to paste
   - Save the file with a name like "gemini_api_key.txt"
   - **You won't be able to see this key again!**

### 1.5 Close the API Key Window

1. **Click the "X" button** in the top-right corner of the popup
2. **OR click "Done" or "Close"** button if available

---

## Step 2: Create the Serverless Function File

### 2.1 Open Your Project Folder

1. **Open File Explorer** (Windows) or **Finder** (Mac)
2. **Navigate to your TUPConnect project folder:**
   - It should be at: `Documents\3rd Year - College\Project Management\TUPConnect`
   - OR wherever you saved your project
3. **Double-click the folder** to open it

### 2.2 Create the `api` Folder

**Option A: Using File Explorer/Finder (Windows/Mac)**
1. **Right-click** on an empty area inside the TUPConnect folder
2. **Move your mouse** over **"New"** (Windows) or **"New Folder"** (Mac)
3. **Click** on **"Folder"** (Windows) or **"New Folder"** (Mac)
4. **Type:** `api` (all lowercase, no spaces)
5. **Press Enter** to confirm

**Option B: Using VS Code or Your Code Editor**
1. **Open your project** in VS Code (or your code editor)
2. **In the left sidebar** (Explorer), **right-click** on the root folder (TUPConnect)
3. **Click** **"New Folder"** from the menu
4. **Type:** `api`
5. **Press Enter**

### 2.3 Create the `gemini-match.js` File

**Option A: Using File Explorer/Finder**
1. **Double-click** the `api` folder you just created to open it
2. **Right-click** on an empty area inside the `api` folder
3. **Move your mouse** over **"New"** (Windows) or click **"New Document"** (Mac)
4. **Click** **"Text Document"** (Windows) or **"Text Document"** (Mac)
5. **Type the filename:** `gemini-match.js` (exactly as shown, with the `.js` extension)
6. **Press Enter**
7. **If Windows warns** about changing the extension, click **"Yes"**

**Option B: Using VS Code**
1. **In the left sidebar**, **click** on the `api` folder you created (it should be visible)
2. **Right-click** on the `api` folder
3. **Click** **"New File"** from the menu
4. **Type:** `gemini-match.js`
5. **Press Enter**

### 2.4 Add the Code to the File

1. **Open the `gemini-match.js` file** you just created
2. **Delete any existing content** in the file (if there is any)
3. **Copy the entire code block below** (starting from `import { GoogleGenerativeAI }` and ending with the last `}`)
4. **Paste it** into the `gemini-match.js` file
5. **Save the file:**
   - Press `Ctrl + S` (Windows) or `Cmd + S` (Mac)
   - OR click **File** → **Save** from the menu

**The code to paste:**

```javascript
// Install this package first: npm install @google/generative-ai
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from environment variables
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.error('GEMINI_API_KEY is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Validate request body
  const { student_interest } = req.body;
  if (!student_interest || typeof student_interest !== 'string' || student_interest.trim().length === 0) {
    return res.status(400).json({ error: 'student_interest is required and must be a non-empty string' });
  }

  try {
    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // System instruction for Gemini
    const systemInstruction = `You are TUPConnect's organization matching AI. Your task is to analyze the user's provided text (interests, hobbies, course) and identify which of the following 10 categories are most relevant. Only return categories from this list. Return the result as a simple JSON array of strings, ONLY listing the relevant categories. Do not include any other text or explanation.

The 10 categories are:
1. Academic/Research
2. Technology/IT/Gaming
3. Engineering/Built Env.
4. Arts/Design/Media
5. Leadership/Governance
6. Service/Welfare/Outreach
7. Entrepreneurship/Finance
8. Industrial/Applied Skills
9. Social Justice/Advocacy
10. Culture/Religion`;

    const prompt = `${systemInstruction}\n\nUser input: ${student_interest.trim()}\n\nReturn ONLY a JSON array like: ["Category 1", "Category 2"]`;

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let aiResponse = response.text().trim();

    // Clean up response - remove markdown code blocks if present
    aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse JSON response
    let matchedCategories;
    try {
      matchedCategories = JSON.parse(aiResponse);
    } catch (parseError) {
      // If parsing fails, try to extract array from text
      const arrayMatch = aiResponse.match(/\[(.*?)\]/);
      if (arrayMatch) {
        try {
          matchedCategories = JSON.parse(arrayMatch[0]);
        } catch (e) {
          throw new Error('Failed to parse AI response as JSON');
        }
      } else {
        throw new Error('AI response does not contain a valid JSON array');
      }
    }

    // Validate that result is an array
    if (!Array.isArray(matchedCategories)) {
      throw new Error('AI response is not an array');
    }

    // Validate categories against the 10 allowed categories
    const validCategories = [
      'Academic/Research',
      'Technology/IT/Gaming',
      'Engineering/Built Env.',
      'Arts/Design/Media',
      'Leadership/Governance',
      'Service/Welfare/Outreach',
      'Entrepreneurship/Finance',
      'Industrial/Applied Skills',
      'Social Justice/Advocacy',
      'Culture/Religion'
    ];

    const filteredCategories = matchedCategories.filter(cat => 
      validCategories.includes(cat)
    );

    // Return matched categories
    return res.status(200).json({
      matched_categories: filteredCategories
    });

  } catch (error) {
    console.error('Gemini API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process request with AI. Please try again later.' 
    });
  }
}
```

---

## Step 3: Install the Required Package

### 3.1 Open Terminal/Command Prompt

**Option A: Using VS Code (Easiest)**
1. **Open VS Code** (or your code editor)
2. **Make sure** your TUPConnect project folder is open
3. **Look at the top menu bar**, click **"Terminal"**
4. **Click** **"New Terminal"** from the dropdown menu
5. **A terminal window will appear** at the bottom of VS Code

**Option B: Using Windows Command Prompt**
1. **Open File Explorer**
2. **Navigate to your TUPConnect folder**
3. **Click in the address bar** at the top (where it shows the folder path)
4. **Type:** `cmd` and press Enter
5. **Command Prompt will open** in that folder

**Option C: Using Windows PowerShell**
1. **Right-click** on your TUPConnect folder in File Explorer
2. **Click** **"Open in Terminal"** or **"Open PowerShell window here"**

**Option D: Using Mac Terminal**
1. **Open Finder**
2. **Navigate to your TUPConnect folder**
3. **Right-click** on the folder
4. **Click** **"New Terminal at Folder"**

### 3.2 Check if Node.js is Installed

1. **In the terminal window**, type: `node --version`
2. **Press Enter**
3. **You should see something like:** `v18.17.0` or `v20.10.0`
   - **If you see a version number:** ✅ You're good! Go to Step 3.3
   - **If you see an error:** ❌ You need to install Node.js first
     - Download from: https://nodejs.org/
     - Install it, then restart your terminal and try again

### 3.3 Install the Package

1. **Make sure you're in the TUPConnect folder:**
   - Your terminal should show the path ending with `TUPConnect`
   - If not, type: `cd "path\to\your\TUPConnect\folder"` and press Enter
2. **Type this exact command:**
   ```bash
   npm install @google/generative-ai
   ```
3. **Press Enter**
4. **Wait for it to finish** (you'll see messages scrolling, then it will stop)
5. **You should see:** `added 1 package` or similar success message

### 3.4 Verify Installation

1. **Look for a file called `package.json`** in your TUPConnect folder
2. **Open it** (double-click in File Explorer, or click in VS Code)
3. **Look for a section called `"dependencies"`**
4. **You should see:** `"@google/generative-ai": "^0.2.1"` or similar
5. **If you see it:** ✅ Success! Move to Step 4

---

## Step 4: Add Environment Variable to Vercel

### 4.1 Open Vercel Dashboard

1. **Open your web browser**
2. **Go to:** https://vercel.com/dashboard
3. **Press Enter**
4. **Sign in if prompted:**
   - Click **"Sign In"** button (top-right corner)
   - Use your GitHub, GitLab, or email to sign in

### 4.2 Find Your TUPConnect Project

1. **Look at the main dashboard page**
2. **You'll see a list of your projects** (or "Create Project" if you have none)
3. **Find your TUPConnect project** in the list
4. **Click on the project name** (click anywhere on the project card/tile)

### 4.3 Navigate to Settings

1. **Look at the top of the page** - you'll see tabs like: **"Overview"**, **"Deployments"**, **"Settings"**, etc.
2. **Click on the "Settings" tab** (it's usually the rightmost tab or near the end)
3. **Wait for the Settings page to load**

### 4.4 Go to Environment Variables

1. **Look at the left sidebar** on the Settings page
2. **You'll see a menu** with options like:
   - General
   - Environment Variables
   - Git
   - Functions
   - etc.
3. **Click on "Environment Variables"** in that left sidebar menu
4. **The page will update** to show the Environment Variables section

### 4.5 Add the New Environment Variable

1. **Look for a section** that says "Environment Variables" or has a table/list
2. **Find and click the button** that says **"Add New"** or **"Add Environment Variable"** or **"+ New"**
   - It might be at the top-right, or below the existing variables list
3. **A form or popup will appear** with input fields

### 4.6 Fill in the Form

1. **In the "Key" or "Name" field:**
   - Click inside the text box
   - Type exactly: `GEMINI_API_KEY` (all caps, with underscores)
   
2. **In the "Value" field:**
   - Click inside the text box
   - **Paste your API key** that you saved from Step 1
   - You can paste by pressing `Ctrl + V` (Windows) or `Cmd + V` (Mac)
   - OR right-click and select "Paste"

3. **For "Environment" or "Environments" section:**
   - You'll see checkboxes for: **Production**, **Preview**, **Development**
   - **Click all three checkboxes** to select them:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
   - This ensures the variable works in all environments

### 4.7 Save the Variable

1. **Look for a button** that says **"Save"** or **"Add"** or **"Create"**
2. **Click that button**
3. **Wait a moment** - you should see a success message or the variable appearing in the list

### 4.8 Verify It Was Added

1. **Look at the Environment Variables list/table**
2. **You should see a new row** with:
   - Key: `GEMINI_API_KEY`
   - Value: (hidden/shown as dots for security)
   - Environments: Production, Preview, Development
3. **If you see it:** ✅ Success! Move to Step 5

---

## Step 5: Update package.json (if needed)

Make sure your `package.json` includes the dependency:

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.2.1"
  }
}
```

If you ran `npm install` in Step 3, this should already be there.

---

## Step 6: Test Locally (Optional but Recommended)

1. **Create a `.env.local` file in your project root:**
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

2. **Test the endpoint locally:**
   - If using Vercel CLI: `vercel dev`
   - Visit: `http://localhost:3000/api/gemini-match`
   - Use a tool like Postman or curl to test:

   ```bash
   curl -X POST http://localhost:3000/api/gemini-match \
     -H "Content-Type: application/json" \
     -d '{"student_interest": "I love programming and video games. I study Computer Science."}'
   ```

3. **Expected response:**
   ```json
   {
     "matched_categories": [
       "Technology/IT/Gaming",
       "Academic/Research"
     ]
   }
   ```

---

## Step 7: Deploy to Vercel

### 7.1 Open Terminal Again

1. **Go back to your terminal** (same as Step 3)
2. **Make sure you're in the TUPConnect folder** (type `cd` followed by your folder path if needed)

### 7.2 Check Git Status

1. **Type:** `git status`
2. **Press Enter**
3. **You should see** files like `api/gemini-match.js` and `package.json` listed as new/modified

### 7.3 Add Files to Git

1. **Type this exact command:**
   ```bash
   git add api/gemini-match.js package.json package-lock.json
   ```
2. **Press Enter**
3. **No output is normal** - that means it worked!

### 7.4 Commit Changes

1. **Type this exact command:**
   ```bash
   git commit -m "Add Gemini AI integration for match finding"
   ```
2. **Press Enter**
3. **You should see a message** like "3 files changed" or similar

### 7.5 Push to GitHub

1. **Type:** `git push`
2. **Press Enter**
3. **If prompted for credentials:**
   - Enter your GitHub username
   - Enter your GitHub password (or Personal Access Token)
4. **Wait for it to finish** - you'll see messages about uploading files

### 7.6 Wait for Auto-Deployment (If Connected to Vercel)

1. **Go back to your Vercel dashboard** in your browser
2. **Click on your TUPConnect project**
3. **Click on the "Deployments" tab** (at the top)
4. **You should see a new deployment** starting automatically
5. **Wait 1-2 minutes** for it to finish
6. **The status should change** from "Building" to "Ready" with a green checkmark ✅

### 7.7 Manual Deployment (If Auto-Deploy Doesn't Work)

1. **If your project isn't connected to GitHub**, you can deploy manually:
2. **Install Vercel CLI** (if not already installed):
   - Type: `npm install -g vercel`
   - Press Enter
   - Wait for installation
3. **Deploy:**
   - Type: `vercel --prod`
   - Press Enter
   - Follow the prompts (login if needed)
   - Select your project when asked
4. **Wait for deployment to finish**

3. **Verify deployment:**
   - Check Vercel dashboard for successful deployment
   - Check that the function appears in the Functions tab

---

## Step 8: Test the Live Endpoint

### 8.1 Open Terminal/Command Prompt

1. **Open terminal** (same as before)

### 8.2 Test with curl (Command Line Method)

**On Windows:**
1. **curl might not be installed by default**
2. **Try typing:** `curl --version`
3. **If you see a version number:** Use the curl command below
4. **If you get an error:** Use the browser method (Step 8.3)

**The curl command:**
```bash
curl -X POST https://tupconnect.vercel.app/api/gemini-match -H "Content-Type: application/json" -d "{\"student_interest\": \"I love programming, video games, and building software. I study Computer Science.\"}"
```

**On Mac/Linux:**
```bash
curl -X POST https://tupconnect.vercel.app/api/gemini-match \
  -H "Content-Type: application/json" \
  -d '{"student_interest": "I love programming, video games, and building software. I study Computer Science."}'
```

**What to expect:**
- You should see a JSON response like:
  ```json
  {"matched_categories":["Technology/IT/Gaming","Academic/Research"]}
  ```

### 8.3 Test with Browser/Online Tool (Easier Method)

**Option A: Using Postman (Recommended)**
1. **Go to:** https://www.postman.com/downloads/
2. **Download and install Postman** (or use the web version)
3. **Open Postman**
4. **Click** **"New"** button (top-left)
5. **Select** **"HTTP Request"**
6. **Set the method:**
   - Click the dropdown that says "GET"
   - Select **"POST"** from the dropdown
7. **Enter the URL:**
   - In the URL field, type: `https://tupconnect.vercel.app/api/gemini-match`
8. **Set headers:**
   - Click the **"Headers"** tab (below the URL)
   - Under "Key", type: `Content-Type`
   - Under "Value", type: `application/json`
   - Click **"Add"** or press Enter
9. **Set body:**
   - Click the **"Body"** tab
   - Click the radio button for **"raw"**
   - In the dropdown next to "raw", select **"JSON"**
   - In the text area, paste:
     ```json
     {
       "student_interest": "I love programming, video games, and building software. I study Computer Science."
     }
     ```
10. **Send the request:**
    - Click the blue **"Send"** button (top-right)
11. **Check the response:**
    - Below, you should see a response with status `200 OK`
    - The body should show:
      ```json
      {
        "matched_categories": [
          "Technology/IT/Gaming",
          "Academic/Research"
        ]
      }
      ```

**Option B: Using Online Tool (curlbin.com)**
1. **Go to:** https://reqbin.com/curl
2. **Select POST** from the method dropdown
3. **Enter URL:** `https://tupconnect.vercel.app/api/gemini-match`
4. **Under Headers, add:**
   - Header: `Content-Type`
   - Value: `application/json`
5. **Under Body, select "JSON"** and paste:
   ```json
   {
     "student_interest": "I love programming and video games"
   }
   ```
6. **Click "Send"**
7. **Check the response** - should show matched categories

### 8.4 If You Get an Error

1. **Check Vercel Dashboard:**
   - Go to: https://vercel.com/dashboard
   - Click your TUPConnect project
   - Click **"Functions"** tab (in left sidebar)
   - Click on **"gemini-match"** function
   - Click **"Logs"** tab
   - Look for error messages

2. **Common errors and fixes:**
   - **"Server configuration error"** → Go back to Step 4, make sure `GEMINI_API_KEY` is set correctly
   - **"Function not found"** → Make sure you deployed (Step 7) and the file is at `api/gemini-match.js`
   - **"Failed to parse"** → This is usually temporary, try again in a few seconds

---

## Step 9: Verify Frontend Integration

The frontend code in `components/findmatch.html` is already updated to use the new endpoint. Let's verify it works:

### 9.1 Open Your Live Site

1. **Open your web browser**
2. **Go to:** `https://tupconnect.vercel.app/components/findmatch.html`
3. **Press Enter** and wait for the page to load

### 9.2 Test the Chat Feature

1. **Look at the chat interface** - you should see a greeting message from the bot
2. **Click inside the text input box** at the bottom (where it says "Type your interests...")
3. **Type a test message**, for example:
   - `I love programming and video games. I study Computer Science.`
4. **Click the send button** (the paper airplane icon on the right) OR press **Enter**
5. **Wait a moment** - you should see:
   - Your message appears in the chat
   - A bot response appears below it
6. **Type another interest** (optional, but recommended):
   - Click the input box again
   - Type: `I also like building websites and mobile apps`
   - Press Enter or click send

### 9.3 Click "Find My Matches" Button

1. **Look below the chat** - you should see a button that says **"Find My Matches"**
2. **Click the "Find My Matches" button**
3. **The button text should change** to "Finding Matches..." (loading state)
4. **Wait 5-10 seconds** for the AI to process

### 9.4 Check the Results

1. **After waiting, you should see:**
   - A new section appears below with heading **"Your Matches"**
   - Organization cards displayed in a grid
   - Each card shows:
     - Organization name
     - Logo
     - Match percentage badge (bottom-right, like "85% Match")
     - Category badges (bottom-left)
2. **If you see organizations listed:** ✅ Success! The integration is working!
3. **If you see "No matches found":**
   - This might be normal if your test input doesn't match any categories
   - Try typing more specific interests like: `programming, computer science, technology`
   - Click "Find My Matches" again

### 9.5 Check for Errors (If Something Doesn't Work)

1. **Open Browser Developer Tools:**
   - **On Windows/Linux:** Press `F12` key
   - **On Mac:** Press `Cmd + Option + I`
   - **OR right-click** anywhere on the page and select **"Inspect"** or **"Inspect Element"**

2. **Check the Console Tab:**
   - **Click the "Console" tab** at the top of the Developer Tools window
   - **Look for any red error messages**
   - **Common errors:**
     - `Failed to fetch` → API endpoint might not be deployed correctly
     - `404 Not Found` → Check that the endpoint URL is correct
     - `500 Internal Server Error` → Check Vercel function logs

3. **Check the Network Tab:**
   - **Click the "Network" tab** at the top
   - **Clear the network log** (click the 🚫 icon or right-click → Clear)
   - **Click "Find My Matches" button** again
   - **Look for a request** to `gemini-match`
   - **Click on that request** to see details
   - **Check the response:**
     - Status should be `200` (success)
     - Response should show `matched_categories` array

### 9.6 Test with Different Inputs

1. **Try different interests** to see if matching works correctly:
   - `I'm interested in art, design, and photography` → Should match Arts/Design/Media
   - `I want to help the community and volunteer` → Should match Service/Welfare/Outreach
   - `I study engineering and love building things` → Should match Engineering/Built Env.

2. **Check that match percentages make sense:**
   - Higher percentages = more category matches
   - Organizations should be sorted from highest to lowest match

---

## Troubleshooting

### Problem: "Server configuration error"
- **Solution:** Make sure `GEMINI_API_KEY` is set in Vercel environment variables
- Redeploy after adding the variable

### Problem: "Failed to parse AI response as JSON"
- **Solution:** This is usually temporary. The function has fallback logic, but you can improve the prompt if it persists

### Problem: Function not found (404)
- **Solution:** 
  - Ensure the file is at `api/gemini-match.js` (not `api/gemini-match/index.js`)
  - Redeploy to Vercel
  - Check Vercel Functions tab to see if the function is listed

### Problem: CORS errors
- **Solution:** Vercel handles CORS automatically for serverless functions. If you see CORS errors, check that you're calling the correct URL.

### Problem: Rate limiting
- **Solution:** Gemini API has rate limits. If you hit them, wait a few minutes or upgrade your Google Cloud plan.

---

## Quick Checklist

- [ ] Got Gemini API key from Google AI Studio
- [ ] Created `api/gemini-match.js` file
- [ ] Installed `@google/generative-ai` package
- [ ] Added `GEMINI_API_KEY` to Vercel environment variables
- [ ] Committed and pushed changes
- [ ] Deployed to Vercel
- [ ] Tested the endpoint with curl
- [ ] Tested the frontend feature
- [ ] Verified matches are being calculated correctly

---

## Need Help?

- Check Vercel Function Logs in your dashboard
- Check browser console for frontend errors
- Review the full specification in `GEMINI_AI_INTEGRATION_SPEC.md`
- Google Gemini API Docs: https://ai.google.dev/docs

