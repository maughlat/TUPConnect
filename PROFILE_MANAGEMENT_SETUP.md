# Profile Management System Setup Guide

This guide covers the setup required for the enhanced Organization Profile Management system with Facebook links, activities, and profile picture uploads.

---

## 1. Database Schema Update

### Step 1.1: Run SQL Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run the SQL script: `database/update_organizations_schema.sql`

This will add the following columns to the `organizations` table:
- `facebook_link` (TEXT) - For Facebook page URL
- `activities` (TEXT[]) - Array for storing activity bullet points
- `logo` (VARCHAR(500)) - Already exists, but verified

**Alternative**: Run this SQL directly in Supabase SQL Editor:

```sql
-- Add facebook_link column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations' 
    AND column_name = 'facebook_link'
  ) THEN
    ALTER TABLE public.organizations 
    ADD COLUMN facebook_link TEXT;
  END IF;
END $$;

-- Add activities column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations' 
    AND column_name = 'activities'
  ) THEN
    ALTER TABLE public.organizations 
    ADD COLUMN activities TEXT[];
  END IF;
END $$;
```

---

## 2. Supabase Storage: Create Logos Bucket

### Step 2.1: Create Bucket

1. Go to **Storage** (left sidebar) → **Files** → **Buckets**
2. Click **"New bucket"**
3. Configure:
   - **Bucket name**: `logos`
   - **Public bucket**: ✅ **Enable this toggle** (Must be public)
   - **File size limit**: `2 MB`
   - **Allowed MIME types**: `image/png,image/jpeg,image/jpg,image/webp`

### Step 2.2: Configure Storage Policies

1. Click on the `logos` bucket
2. Go to **"Policies"** tab

**Create Policy 1: Allow Public Read Access**

1. Click **"New policy"**
2. Configure:
   - **Policy name**: `Allow public logo access`
   - **Command**: `SELECT`
   - **Target roles**: `anon`, `authenticated`
   - **Policy definition**: 
     ```sql
     (bucket_id = 'logos'::text)
     ```

**Create Policy 2: Allow Authenticated Uploads**

1. Click **"New policy"** again
2. Configure:
   - **Policy name**: `Allow authenticated logo uploads`
   - **Command**: `INSERT`
   - **Target roles**: `authenticated`
   - **Policy definition**: 
     ```sql
     (bucket_id = 'logos'::text)
     ```

**Note**: Only authenticated organization officers can upload logos, but everyone can view them.

---

## 3. Verify Implementation

### Step 3.1: Test Profile Management

1. Log in as an organization officer
2. Go to **"Profile Management"** section
3. Verify you see:
   - ✅ About Section field
   - ✅ Activities & Focus field (textarea)
   - ✅ Facebook Page Link field
   - ✅ Profile Picture upload field
   - ✅ Image preview (if logo exists)

### Step 3.2: Test Profile Updates

1. Fill in the form:
   - Enter/update About section
   - Enter activities (one per line, or with bullet points)
   - Enter Facebook link
   - Upload a new profile picture
2. Click **"Save Changes"**
3. Verify:
   - ✅ Success message appears
   - ✅ Dashboard completion percentage updates
   - ✅ Form fields retain the saved values
   - ✅ Profile picture preview updates

### Step 3.3: Verify Student Portal Reflection

1. Go to **Browse Clubs** page
2. Click on an organization card
3. Verify in the modal:
   - ✅ Facebook link button shows (if link was provided)
   - ✅ Activities are displayed correctly
   - ✅ Profile picture/logo displays correctly
4. If Facebook link is null, the button should be hidden

---

## 4. Code Implementation Summary

### Files Modified:

1. **`database/update_organizations_schema.sql`** (NEW)
   - SQL to add `facebook_link` and `activities` columns

2. **`components/organization-portal.html`** (MODIFIED)
   - Added Facebook link input field
   - Added profile picture upload field with preview
   - Removed `application_link` field (as per requirements)
   - Added `uploadOrgProfilePicture()` function
   - Added `handleUpdateOrgProfile()` function
   - Updated `loadProfile()` to load new fields
   - Updated dashboard completion calculation

3. **`components/browse.html`** (MODIFIED)
   - Updated modal to use `facebook_link` instead of `url`
   - Added conditional rendering (hide button if no link)
   - Updated activities parsing to handle array format

4. **`components/findmatch.html`** (MODIFIED)
   - Updated modal to use `facebook_link` instead of `url`
   - Added conditional rendering (hide button if no link)
   - Updated activities parsing to handle array format

5. **`src/lib/student-orgs.js`** (MODIFIED)
   - Updated `renderOrgCardHTML()` to display activities on cards

### Functions Added:

1. **`uploadOrgProfilePicture(file, orgId)`**
   - Uploads image to `logos` bucket
   - Validates file size (2MB) and type (PNG/JPG/WebP)
   - Returns public URL

2. **`handleUpdateOrgProfile(orgId, formData)`**
   - Handles form submission
   - Uploads profile picture if provided
   - Updates `organizations` table with all fields
   - Does NOT update `application_link` (removed from form)

---

## 5. Important Notes

### Field Changes:

- ✅ **Added**: `facebook_link` - Stored in `organizations` table
- ✅ **Added**: `activities` - Stored as TEXT[] array in `organizations` table
- ✅ **Added**: Profile picture upload - Stored in `logos` Storage bucket, URL in `logo` column
- ❌ **Removed**: `application_link` - No longer in profile form (as per requirements)

### Data Flow:

1. **Organization Officer** fills form → Clicks "Save Changes"
2. **`handleUpdateOrgProfile()`** is called:
   - Uploads profile picture (if provided) → Gets URL
   - Updates `organizations` table with all fields
3. **Student Portal** fetches organizations → Displays updated data
4. Changes are **instantly reflected** (no cache, direct database queries)

### Activities Format:

- **Input**: Multi-line text (users can type with or without bullet points)
- **Storage**: TEXT[] array (converted from text)
- **Display**: Array items shown in modal/cards

---

## 6. Troubleshooting

### Issue: "Bucket 'logos' not found" error

**Solution**: Create the `logos` bucket in Supabase Storage (Step 2.1)

### Issue: Profile picture upload fails

**Solution**:
- Verify `logos` bucket exists and is public
- Check Storage policies allow INSERT for `authenticated` role
- Verify file size is under 2MB
- Check file type is PNG, JPG, or WebP

### Issue: Changes don't appear in student portal

**Solution**:
- Refresh the student portal page (browser may cache)
- Verify database update succeeded (check `organizations` table)
- Check browser console for errors

### Issue: Facebook link button doesn't show

**Solution**:
- Verify `facebook_link` column exists in database
- Check that the link was saved (not null/empty)
- Verify modal code uses `facebook_link` instead of `url`

---

## 7. Verification Checklist

Before considering this complete:

- ✅ Database columns added (`facebook_link`, `activities`)
- ✅ `logos` Storage bucket created and configured
- ✅ Storage policies allow public read and authenticated upload
- ✅ Organization portal form has all new fields
- ✅ Profile updates save successfully
- ✅ Student portal displays Facebook link correctly
- ✅ Student portal displays activities correctly
- ✅ Profile picture uploads and displays correctly
- ✅ `application_link` field removed from profile form
- ✅ Dashboard completion percentage updates correctly

---

**Last Updated**: 2024

**Version**: 1.0

