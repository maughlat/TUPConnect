# Setup Guide: Request to Join System

This guide provides step-by-step instructions for setting up the complete "Request to Join" workflow in TUPConnect.

**🔄 STARTING FRESH?** If you've already tried setting this up and got confused, start from the beginning with this guide. We'll clean up any mistakes first.

---

## Table of Contents

1. [Clean Up Previous Attempts (If Starting Fresh)](#1-clean-up-previous-attempts-if-starting-fresh)
2. [Supabase Storage Bucket Setup](#2-supabase-storage-bucket-setup)
3. [Database Schema Verification](#3-database-schema-verification)
4. [Row Level Security (RLS) Policies](#4-row-level-security-rls-policies)
5. [Email Notifications Setup (Optional)](#5-email-notifications-setup-optional)
6. [Testing the System](#6-testing-the-system)

---

## 1. Clean Up Previous Attempts (If Starting Fresh)

If you've already tried setting this up and want to start over, follow these steps:

### Step 1.1: Check Storage Policies

1. Go to **Storage** (left sidebar) → **Files** → **Buckets** → Click on **`applications`** bucket
2. Click the **"Policies"** tab

**What to DELETE (if found):**
- ❌ Any policy with names like:
  - "Allow anonymous application submissions"
  - "Organization officers can view their applications"
  - "Organization officers can update their applications"
  - "Admins can view all applications"
  
  **Why?** These are database table policies that were mistakenly created in Storage. They won't work here.

**What to KEEP:**
- ✅ Policies for file uploads/downloads:
  - "Allow public access" or "Allow public read" (SELECT command)
  - "Allow public uploads" or "Allow public insert" (INSERT command)
  
  **Why?** These are correct Storage policies needed for CV file uploads.

### Step 1.2: Delete Incorrect Storage Policies

For each incorrect database-like policy in Storage:

1. Click the **ellipsis (⋯)** icon next to the policy
2. Select **"Delete"** or **"Remove"**
3. Confirm deletion

### Step 1.3: Check Database Table Policies

1. Go to **Authentication** → **Policies** (left sidebar)
2. Search for **"applications"** in the search box
3. You should see the `applications` table listed

**What to do:**
- If you see existing policies with errors or want to start fresh, you can delete them:
  1. Click the **ellipsis (⋯)** icon next to each policy
  2. Select **"Delete"**
  3. Confirm deletion
- Or keep them if they're working correctly

### Step 1.4: Verify Clean State

✅ **Storage policies should only have** file-related policies (SELECT for downloads, INSERT for uploads)  
✅ **Database policies** will be created fresh in the next section

---

## 2. Supabase Storage Bucket Setup

### Step 2.1: Access Supabase Dashboard

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your TUPConnect project

### Step 2.2: Navigate to Storage

1. In the left sidebar, click on **"Storage"**
2. You should see a list of existing buckets (if any)

### Step 2.3: Create New Bucket (If Not Exists)

1. Click the **"New bucket"** button (usually at the top right)
2. Fill in the bucket details:
   - **Bucket name**: `applications`
   - **Public bucket**: ✅ **Enable this toggle** (Important: Must be public for file uploads to work)
   - **File size limit**: Set to `5 MB` (or your preferred limit)
   - **Allowed MIME types**: (Optional) You can restrict to:
     ```
     application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
     ```
     Or leave empty to allow all file types
3. Click **"Create bucket"**

### Step 2.4: Configure Storage Bucket Policies

1. Click on the `applications` bucket you just created (or if it already exists)
2. Go to the **"Policies"** tab

**Create Policy 1: Allow Public File Access (Downloads)**

1. Click **"New policy"**
2. Configure:
   - **Policy name**: `Allow public access`
   - **Command**: `SELECT` (or "READ")
   - **Target roles**: `anon`, `authenticated`
   - **Policy definition**: 
     ```sql
     (bucket_id = 'applications'::text)
     ```

**Create Policy 2: Allow Public File Uploads**

1. Click **"New policy"** again
2. Configure:
   - **Policy name**: `Allow public uploads`
   - **Command**: `INSERT` (or "WRITE")
   - **Target roles**: `anon`, `authenticated`
   - **Policy definition**: 
     ```sql
     (bucket_id = 'applications'::text)
     ```

### Step 2.5: Verify Bucket Access

1. Check that the bucket is listed in Storage
2. Confirm the bucket has a **green "Public"** badge
3. Verify you have 2 Storage policies:
   - ✅ Allow public access (SELECT) - for downloading/viewing files
   - ✅ Allow public uploads (INSERT) - for uploading files

---

## 3. Database Schema Verification

### Step 3.1: Verify Applications Table Exists

1. In Supabase Dashboard, go to **"Table Editor"** (left sidebar)
2. Look for a table named **`applications`**
3. If it doesn't exist, run this SQL in the **SQL Editor**:

```sql
-- Applications table
-- Student applications to join organizations
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_name VARCHAR(255) NOT NULL,
  year_section VARCHAR(255) NOT NULL, -- Program, Year & Section
  college_affiliated VARCHAR(50) NOT NULL,
  tup_student_number VARCHAR(20) NOT NULL, -- Format: TUPM-XX-XXXX
  personal_email VARCHAR(255) NOT NULL,
  cv_link TEXT,
  status application_status_type DEFAULT 'Pending',
  date_submitted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 3.2: Verify Application Status Type Exists

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this query to check if the enum type exists:

```sql
SELECT EXISTS (
  SELECT 1 FROM pg_type WHERE typname = 'application_status_type'
);
```

3. If it returns `false`, create the enum type:

```sql
CREATE TYPE application_status_type AS ENUM ('Pending', 'Approved', 'Rejected');
```

### Step 3.3: Verify Column Names Match

Check that your `applications` table has these exact column names:

- ✅ `organization_id` (not `org_id`)
- ✅ `student_name`
- ✅ `personal_email`
- ✅ `tup_student_number`
- ✅ `year_section`
- ✅ `college_affiliated`
- ✅ `cv_link` (or `cv_url` - update code if different)
- ✅ `status`
- ✅ `notes`
- ✅ `date_submitted`
- ✅ `reviewed_at`
- ✅ `reviewed_by`

If any column names differ, update them in the database or update the code in `request-form.html` and `organization-portal.html`.

---

## 4. Row Level Security (RLS) Policies

**⚠️ CRITICAL**: These policies are for the **DATABASE TABLE** (`applications` table), NOT the Storage bucket!

**Location**: **Authentication** → **Policies** → Search for "applications" → Click on `applications` table

### Step 4.1: Navigate to Policies

1. Go to **Authentication** (left sidebar in Supabase Dashboard)
2. Click on **"Policies"** (under CONFIGURATION section)
3. In the search box, type **"applications"**
4. You should see the `applications` table listed
5. Click on the `applications` table to see its policies
6. If RLS is not enabled, you'll see a button to **"Enable RLS"** - click it

### Step 4.2: Create Policy for Anonymous Inserts (Form Submissions)

This allows students to submit applications without being logged in:

1. Click **"Create policy"** button (top right of the applications table policies section)
2. The policy creation form will open. Configure it:

   - **Policy name**: `Allow anonymous application submissions`
   - **Table on clause**: Should already show `public.applications` (if not, select it)
   - **Policy Behavior as clause**: Keep as `Permissive`
   - **Policy Command for clause**: Select **`INSERT`** (radio button)
   - **Target Roles to clause**: Click the dropdown and select **`anon`** (or type it in)
   - **In the code editor (USING expression)**: Replace the placeholder with:
     ```sql
     true
     ```
   - **WITH CHECK expression** (if shown in the editor): Also use:
     ```sql
     true
     ```

3. Click **"Save policy"** button (green button at the bottom)

### Step 4.3: Create Policy for Organization Officers to View Their Applications

This allows organization officers to view only applications for their organization:

1. Click **"Create policy"** button again
2. Configure the policy:

   - **Policy name**: `Organization officers can view their applications`
   - **Table on clause**: Should show `public.applications`
   - **Policy Behavior as clause**: Keep as `Permissive`
   - **Policy Command for clause**: Select **`SELECT`** (radio button)
   - **Target Roles to clause**: Select **`authenticated`** (type or select from dropdown)
   - **In the code editor (USING expression)**: Replace the placeholder with:
     ```sql
     EXISTS (
       SELECT 1
       FROM user_roles
       WHERE user_roles.user_id = auth.uid()
         AND user_roles.organization_id = organization_id
         AND user_roles.role = 'org_officer'
     )
     ```
     
     **Important**: When writing RLS policies, you can reference the table columns directly (like `organization_id`) without the table name prefix in the subquery.

   - **WITH CHECK expression**: For SELECT policies, you can leave this empty or ignore it

3. Click **"Save policy"** button

**Alternative if the above doesn't work**: Use this simpler version:
```sql
(organization_id IN (
  SELECT organization_id 
  FROM user_roles 
  WHERE user_id = auth.uid() 
    AND role = 'org_officer'
))
```

### Step 4.4: Create Policy for Organization Officers to Update Applications

This allows organization officers to approve/reject applications:

1. Click **"Create policy"** button again
2. Configure the policy:

   - **Policy name**: `Organization officers can update their applications`
   - **Table on clause**: Should show `public.applications`
   - **Policy Behavior as clause**: Keep as `Permissive`
   - **Policy Command for clause**: Select **`UPDATE`** (radio button)
   - **Target Roles to clause**: Select **`authenticated`**
   - **In the code editor (USING expression)**: Replace the placeholder with:
     ```sql
     EXISTS (
       SELECT 1
       FROM user_roles
       WHERE user_roles.user_id = auth.uid()
         AND user_roles.organization_id = organization_id
         AND user_roles.role = 'org_officer'
     )
     ```
     
     **Note**: Use `organization_id` directly without the table prefix in the subquery.

   - **WITH CHECK expression**: For UPDATE policies, you can use the same expression:
     ```sql
     EXISTS (
       SELECT 1
       FROM user_roles
       WHERE user_roles.user_id = auth.uid()
         AND user_roles.organization_id = organization_id
         AND user_roles.role = 'org_officer'
     )
     ```

3. Click **"Save policy"** button

**Alternative if the above doesn't work**: Use this simpler version:
```sql
(organization_id IN (
  SELECT organization_id 
  FROM user_roles 
  WHERE user_id = auth.uid() 
    AND role = 'org_officer'
))
```

### Step 4.5: (Optional) Create Policy for Admins

If you want admins to view all applications:

1. Click **"Create policy"** button again
2. Configure the policy:

   - **Policy name**: `Admins can view all applications`
   - **Table on clause**: Should show `public.applications`
   - **Policy Behavior as clause**: Keep as `Permissive`
   - **Policy Command for clause**: Select **`SELECT`** (radio button)
   - **Target Roles to clause**: Select **`authenticated`**
   - **In the code editor (USING expression)**: Replace the placeholder with:
     ```sql
     EXISTS (
       SELECT 1 FROM user_roles
       WHERE user_roles.user_id = auth.uid()
       AND user_roles.role = 'admin'
     )
     ```
   - **WITH CHECK expression**: For SELECT policies, leave this empty or ignore any auto-generated content

3. **Important**: For SELECT policies, you only need the **USING expression**. If the interface auto-generates a `WITH CHECK (0)` clause, delete it or leave it empty - SELECT policies don't need WITH CHECK.

4. Click **"Save policy"** button

**Note**: If you get a syntax error mentioning `WITH CHECK`, make sure you've removed or left empty any WITH CHECK clause for SELECT policies.

### Step 4.6: Verify Policies

**📍 Where to Check**: Go to **Authentication** → **Policies** → Search "applications" → Click on `applications` table

1. Navigate to: **Authentication** → **Policies** → Search "applications" → Click on `applications` table
2. You should see at least 3 policies for the **`applications` TABLE**:
   - ✅ Allow anonymous application submissions (INSERT) - Target: `anon`
   - ✅ Organization officers can view their applications (SELECT) - Target: `authenticated`
   - ✅ Organization officers can update their applications (UPDATE) - Target: `authenticated`
   - ✅ (Optional) Admins can view all applications (SELECT) - Target: `authenticated`

**Important Distinction**:
- **Storage policies** (Step 2): Control file uploads/downloads → Location: **Storage** > Buckets > applications > Policies
- **Database policies** (Step 4): Control database row access → Location: **Authentication** > Policies > applications table

Both are needed, but in DIFFERENT locations!

---

## 5. Email Notifications Setup (Optional)

### Option A: Using Supabase Edge Functions (Recommended)

#### Step 5.1: Install Supabase CLI

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (Find your project ref in Supabase Dashboard → Settings → API)

#### Step 5.2: Create Edge Function

1. Create a new Edge Function:
   ```bash
   supabase functions new send-application-email
   ```

2. Edit `supabase/functions/send-application-email/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    const { to, studentName, orgName, status } = await req.json()

    const emailContent = status === 'Approved' 
      ? {
          subject: `Application Approved: ${orgName}`,
          html: `
            <h2>Congratulations ${studentName}!</h2>
            <p>Your application to join ${orgName} has been approved.</p>
            <p>An interview/screening session will be scheduled soon. You will receive further details via email.</p>
            <p>Best regards,<br>${orgName}</p>
          `
        }
      : {
          subject: `Application Update: ${orgName}`,
          html: `
            <h2>Application Update</h2>
            <p>Dear ${studentName},</p>
            <p>Your application to join ${orgName} has been ${status.toLowerCase()}.</p>
            <p>Thank you for your interest.</p>
            <p>Best regards,<br>${orgName}</p>
          `
        }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'TUPConnect <noreply@tupconnect.com>',
        to: [to],
        ...emailContent
      }),
    })

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

#### Step 5.3: Deploy Edge Function

```bash
supabase functions deploy send-application-email
```

#### Step 5.4: Set Environment Variables

1. In Supabase Dashboard → **Edge Functions** → **Settings**
2. Add secret: `RESEND_API_KEY` (get API key from [resend.com](https://resend.com))

#### Step 5.5: Update Organization Portal Code

In `components/organization-portal.html`, update the `updateApplicationStatus` function to call the Edge Function after approval.

### Option B: Using Database Triggers (Simpler)

Go to **SQL Editor** and run:

```sql
CREATE OR REPLACE FUNCTION send_application_email()
RETURNS TRIGGER AS $$
BEGIN
  -- This will trigger when status changes to 'Approved'
  IF NEW.status = 'Approved' AND (OLD.status IS NULL OR OLD.status != 'Approved') THEN
    -- You can integrate with Supabase Auth email or external service here
    -- For now, this is a placeholder
    RAISE NOTICE 'Application approved for: % - Email would be sent to: %', 
      NEW.student_name, NEW.personal_email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_send_application_email
AFTER UPDATE OF status ON applications
FOR EACH ROW
EXECUTE FUNCTION send_application_email();
```

**Note**: This is a placeholder. For actual email sending, integrate with an email service API.

---

## 6. Testing the System

### Step 6.1: Test Anonymous Form Submission

1. Go to `http://your-domain/components/browse.html` (or your production URL)
2. Click on an organization card to open the modal
3. Click **"Request to Join"** button
4. Fill out the form:
   - Enter student information
   - Upload a test CV file (PDF, DOC, or DOCX)
   - Submit the form
5. Verify:
   - ✅ Form submits successfully
   - ✅ Success message appears
   - ✅ File is uploaded to Storage bucket
   - ✅ Application record appears in database

### Step 6.2: Test Organization Portal View

1. Log in as an organization officer
2. Navigate to **"Application Review"** section
3. Verify:
   - ✅ Applications appear in the table
   - ✅ Only applications for that organization are shown
   - ✅ Student information is displayed correctly
   - ✅ CV links work and open files

### Step 6.3: Test View Application Modal

1. In Application Review section, click the **eye icon** (View) button
2. Verify:
   - ✅ Modal opens with all application details
   - ✅ All fields are displayed correctly
   - ✅ Fields are read-only
   - ✅ CV link works
   - ✅ Modal closes with ESC key or close button

### Step 6.4: Test Approve/Reject Actions

1. Click the **checkmark** (Approve) or **X** (Reject) button on a pending application
2. Verify:
   - ✅ Status updates in database
   - ✅ Success notification appears
   - ✅ For approved applications, email notification message is shown
   - ✅ Table refreshes with updated status
   - ✅ Action buttons disappear after status change

### Step 6.5: Test Storage Access

1. Try accessing a CV file URL directly (from database or Storage)
2. Verify:
   - ✅ File is publicly accessible (if bucket is public)
   - ✅ File downloads or opens in browser
   - ✅ File size and type are correct

---

## Troubleshooting

  ### Issue: "new row violates row-level security policy" error when submitting form

**This is the most common error!** It means the INSERT policy isn't working correctly.

**Solutions (try in order)**:

1. **Verify the policy exists and is correct**:
   - Go to **Authentication** → **Policies** → Search "applications"
   - Find the policy named "Allow anonymous application submissions"
   - Check it has:
     - ✅ Command: `INSERT`
     - ✅ Target roles: `anon` (NOT `authenticated` or `public`)
     - ✅ USING expression: `true`
     - ✅ WITH CHECK expression: `true` (required for INSERT!)

2. **Check the WITH CHECK expression**:
   - INSERT policies **REQUIRE** a WITH CHECK clause
   - Open the policy and verify both USING and WITH CHECK have `true`
   - If WITH CHECK is missing or has an error, fix it:
     ```sql
     WITH CHECK (true)
     ```

3. **Verify RLS is enabled**:
   - In Authentication > Policies > applications table
   - Make sure RLS is enabled (should see "Disable RLS" button, not "Enable RLS")

4. **Recreate the policy if needed**:
   - Delete the existing "Allow anonymous application submissions" policy
   - Create it again following Step 4.2 exactly
   - **Important**: Make sure BOTH USING and WITH CHECK are set to `true`

5. **Check if policy is in wrong location**:
   - Policy MUST be in **Authentication > Policies** (NOT Storage)
   - If you see it in Storage > Buckets > applications > Policies, delete it from there
   - Create it in the correct location: **Authentication > Policies**

6. **Test with SQL Editor** (advanced):
   - Go to SQL Editor and try:
     ```sql
     SET role anon;
     INSERT INTO applications (organization_id, student_name, personal_email, tup_student_number, year_section, college_affiliated, cv_link, notes, status)
     VALUES ('your-org-id', 'Test Student', 'test@example.com', 'TUPM-21-1234', 'BSIT 3-1', 'COS', 'https://example.com/cv.pdf', 'Test reason', 'Pending');
     ```
   - If this fails, the policy is definitely wrong

### Issue: File upload fails

**Solution**: 
- Check bucket name is exactly `applications`
- Verify bucket is set to public
- Check file size is under 5MB
- Verify RLS policies on Storage bucket allow INSERT for `anon` role

### Issue: Applications don't appear in organization portal

**Solution**:
- Verify `organization_id` matches in applications table
- Check RLS policies allow SELECT for authenticated users with `org_officer` role
- Verify user has `user_roles` record with correct `organization_id`
- Check that policies are in **Authentication > Policies** (not Storage)

### Issue: Cannot approve/reject applications

**Solution**:
- Check RLS policy allows UPDATE for `org_officer` role
- Verify user is logged in and has correct role
- Check browser console for error messages
- Verify policies are in **Authentication > Policies** (not Storage)

### Issue: Error "syntax error at or near )" when creating SELECT policy

**Solution**:
- For SELECT policies, only fill in the USING expression
- Delete or leave empty any WITH CHECK clause that auto-generates
- SELECT policies don't need WITH CHECK

### Issue: Email notifications not working

**Solution**:
- If using Edge Functions, verify function is deployed
- Check API keys are set correctly
- Review Edge Function logs in Supabase Dashboard
- Verify email service (Resend/SendGrid) account is active

---

## Security Checklist

Before going to production, verify:

- ✅ Storage bucket has appropriate access policies (for file uploads)
- ✅ Database RLS policies prevent unauthorized access (in Authentication > Policies)
- ✅ Anonymous users can only INSERT applications
- ✅ Organization officers can only view/update their own organization's applications
- ✅ File uploads are validated (size, type)
- ✅ Input sanitization is in place (XSS prevention)
- ✅ CV files are stored securely
- ✅ Email notifications (if implemented) use secure API keys

---

## Summary: Two Types of Policies

**Remember**: There are TWO separate policy systems:

1. **Storage Policies** (for files):
   - Location: **Storage** > Buckets > `applications` > Policies
   - Purpose: Control who can upload/download CV files
   - Commands: SELECT (download), INSERT (upload)

2. **Database RLS Policies** (for data):
   - Location: **Authentication** > Policies > `applications` table
   - Purpose: Control who can INSERT/SELECT/UPDATE database rows
   - Commands: INSERT (submit), SELECT (view), UPDATE (approve/reject)

Both are needed, but they're completely separate and in different locations!

---

**Last Updated**: 2024

**Version**: 2.0 (Clean Start Guide)
