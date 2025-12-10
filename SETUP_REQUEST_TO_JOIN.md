# Setup Guide: Request to Join System

This guide provides step-by-step instructions for setting up the complete "Request to Join" workflow in TUPConnect.

---

## Table of Contents

1. [Supabase Storage Bucket Setup](#1-supabase-storage-bucket-setup)
2. [Database Schema Verification](#2-database-schema-verification)
3. [Row Level Security (RLS) Policies](#3-row-level-security-rls-policies)
4. [Email Notifications Setup (Optional)](#4-email-notifications-setup-optional)
5. [Testing the System](#5-testing-the-system)

---

## 1. Supabase Storage Bucket Setup

### Step 1.1: Access Supabase Dashboard

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your TUPConnect project

### Step 1.2: Navigate to Storage

1. In the left sidebar, click on **"Storage"**
2. You should see a list of existing buckets (if any)

### Step 1.3: Create New Bucket

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

### Step 1.4: Configure Bucket Policies (If Needed)

If the bucket is not public enough or you need more control:

1. Click on the `applications` bucket you just created
2. Go to the **"Policies"** tab
3. Click **"New policy"**
4. Create a policy for **INSERT** operations:

   - **Policy name**: `Allow public uploads`
   - **Allowed operation**: `INSERT`
   - **Policy definition**: 
     ```sql
     (bucket_id = 'applications'::text)
     ```
   - **Target roles**: `anon`, `authenticated`

5. Create a policy for **SELECT** operations:

   - **Policy name**: `Allow public access`
   - **Allowed operation**: `SELECT`
   - **Policy definition**: 
     ```sql
     (bucket_id = 'applications'::text)
     ```
   - **Target roles**: `anon`, `authenticated`

6. Click **"Save policy"** for each policy

### Step 1.5: Verify Bucket Access

1. Check that the bucket is listed in Storage
2. Confirm the bucket has a **green "Public"** badge
3. Test by trying to upload a file manually (optional)

---

## 2. Database Schema Verification

### Step 2.1: Verify Applications Table Exists

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

### Step 2.2: Verify Application Status Type Exists

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

### Step 2.3: Verify Column Names Match

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

## 3. Row Level Security (RLS) Policies

### Step 3.1: Enable RLS on Applications Table

1. Go to **Table Editor** → **`applications`** table
2. Click on **"Policies"** tab
3. If RLS is not enabled, click **"Enable RLS"** at the top

### Step 3.2: Create Policy for Anonymous Inserts (Form Submissions)

This allows students to submit applications without being logged in:

1. Click **"New policy"**
2. Select **"Create policy from scratch"**
3. Configure the policy:

   - **Policy name**: `Allow anonymous application submissions`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `anon`
   - **Policy definition (USING expression)**: Leave empty or use:
     ```sql
     true
     ```
   - **Policy definition (WITH CHECK expression)**: 
     ```sql
     true
     ```

4. Click **"Review"** then **"Save policy"**

### Step 3.3: Create Policy for Organization Officers to View Their Applications

This allows organization officers to view only applications for their organization:

1. Click **"New policy"** again
2. Select **"Create policy from scratch"**
3. Configure the policy:

   - **Policy name**: `Organization officers can view their applications`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `authenticated`
   - **Policy definition (USING expression)**: 
     ```sql
     EXISTS (
       SELECT 1 FROM user_roles
       WHERE user_roles.user_id = auth.uid()
       AND user_roles.organization_id = applications.organization_id
       AND user_roles.role = 'org_officer'
     )
     ```

4. Click **"Review"** then **"Save policy"**

### Step 3.4: Create Policy for Organization Officers to Update Applications

This allows organization officers to approve/reject applications:

1. Click **"New policy"** again
2. Select **"Create policy from scratch"**
3. Configure the policy:

   - **Policy name**: `Organization officers can update their applications`
   - **Allowed operation**: `UPDATE`
   - **Target roles**: `authenticated`
   - **Policy definition (USING expression)**: 
     ```sql
     EXISTS (
       SELECT 1 FROM user_roles
       WHERE user_roles.user_id = auth.uid()
       AND user_roles.organization_id = applications.organization_id
       AND user_roles.role = 'org_officer'
     )
     ```

4. Click **"Review"** then **"Save policy"**

### Step 3.5: (Optional) Create Policy for Admins

If you want admins to view all applications:

1. Click **"New policy"** again
2. Select **"Create policy from scratch"**
3. Configure the policy:

   - **Policy name**: `Admins can view all applications`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `authenticated`
   - **Policy definition (USING expression)**: 
     ```sql
     EXISTS (
       SELECT 1 FROM user_roles
       WHERE user_roles.user_id = auth.uid()
       AND user_roles.role = 'admin'
     )
     ```

4. Click **"Review"** then **"Save policy"**

### Step 3.6: Verify Policies

1. Go back to the **Policies** tab
2. You should see at least 3 policies:
   - ✅ Allow anonymous application submissions (INSERT)
   - ✅ Organization officers can view their applications (SELECT)
   - ✅ Organization officers can update their applications (UPDATE)

---

## 4. Email Notifications Setup (Optional)

### Option A: Using Supabase Edge Functions (Recommended)

#### Step 4.1: Install Supabase CLI

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

#### Step 4.2: Create Edge Function

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

#### Step 4.3: Deploy Edge Function

```bash
supabase functions deploy send-application-email
```

#### Step 4.4: Set Environment Variables

1. In Supabase Dashboard → **Edge Functions** → **Settings**
2. Add secret: `RESEND_API_KEY` (get API key from [resend.com](https://resend.com))

#### Step 4.5: Update Organization Portal Code

In `organization-portal.html`, update the `updateApplicationStatus` function:

```javascript
// After successful database update, add:
if (newStatus === 'Approved') {
  // Call Edge Function to send email
  const { data, error } = await supabase.functions.invoke('send-application-email', {
    body: {
      to: app.personal_email,
      studentName: app.student_name,
      orgName: currentOrganization?.name || 'Organization',
      status: newStatus
    }
  });
  
  if (error) {
    console.error('Error sending email:', error);
  }
}
```

### Option B: Using Supabase Database Triggers (Simpler)

#### Step 4.1: Create Database Function for Email

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

**Note**: This is a placeholder. For actual email sending, integrate with an email service API or use Supabase's built-in email features.

---

## 5. Testing the System

### Step 5.1: Test Anonymous Form Submission

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

### Step 5.2: Test Organization Portal View

1. Log in as an organization officer
2. Navigate to **"Application Review"** section
3. Verify:
   - ✅ Applications appear in the table
   - ✅ Only applications for that organization are shown
   - ✅ Student information is displayed correctly
   - ✅ CV links work and open files

### Step 5.3: Test View Application Modal

1. In Application Review section, click the **eye icon** (View) button
2. Verify:
   - ✅ Modal opens with all application details
   - ✅ All fields are displayed correctly
   - ✅ Fields are read-only
   - ✅ CV link works
   - ✅ Modal closes with ESC key or close button

### Step 5.4: Test Approve/Reject Actions

1. Click the **checkmark** (Approve) or **X** (Reject) button on a pending application
2. Verify:
   - ✅ Status updates in database
   - ✅ Success notification appears
   - ✅ For approved applications, email notification message is shown
   - ✅ Table refreshes with updated status
   - ✅ Action buttons disappear after status change

### Step 5.5: Test Storage Access

1. Try accessing a CV file URL directly (from database or Storage)
2. Verify:
   - ✅ File is publicly accessible (if bucket is public)
   - ✅ File downloads or opens in browser
   - ✅ File size and type are correct

---

## Troubleshooting

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

### Issue: Cannot approve/reject applications

**Solution**:
- Check RLS policy allows UPDATE for `org_officer` role
- Verify user is logged in and has correct role
- Check browser console for error messages

### Issue: Email notifications not working

**Solution**:
- If using Edge Functions, verify function is deployed
- Check API keys are set correctly
- Review Edge Function logs in Supabase Dashboard
- Verify email service (Resend/SendGrid) account is active

---

## Security Checklist

Before going to production, verify:

- ✅ Storage bucket has appropriate access policies
- ✅ RLS policies prevent unauthorized access
- ✅ Anonymous users can only INSERT applications
- ✅ Organization officers can only view/update their own organization's applications
- ✅ File uploads are validated (size, type)
- ✅ Input sanitization is in place (XSS prevention)
- ✅ CV files are stored securely
- ✅ Email notifications (if implemented) use secure API keys

---

## Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Resend Email API](https://resend.com/docs)

---

**Last Updated**: 2024

**Version**: 1.0

