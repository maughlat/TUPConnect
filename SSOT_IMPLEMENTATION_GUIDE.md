# TUPConnect Single Source of Truth (SSOT) Implementation Guide

## Overview

This guide documents the finalization of the TUPConnect database architecture following the **Single Source of Truth (SSOT)** principle. All organization profile data, regardless of origin (Admin initial input or Officer profile updates), is stored in the centralized **`public.organizations`** table.

---

## 1. Database Schema (SQL)

### Step 1.1: Run the SSOT Schema Update

**Location:** `database/finalize_ssot_schema.sql`

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run the SQL script: `database/finalize_ssot_schema.sql`

This script ensures all required profile columns exist and are correctly typed:

| Column Name | Data Type | Purpose | SSOT Field |
|------------|-----------|---------|------------|
| `logo` | TEXT | Profile picture URL (from Supabase Storage) | ✅ Yes |
| `description` | TEXT | About section content | ✅ Yes |
| `facebook_link` | TEXT | Official Facebook page URL | ✅ Yes |
| `activities` | TEXT[] | Array of activity bullet points | ✅ Yes |

**Important Notes:**
- The `logo` column stores the **full public URL** from Supabase Storage (e.g., `https://[project].supabase.co/storage/v1/object/public/logos/[path]`)
- The `description` column stores the "About" section content
- The `facebook_link` column stores the organization's official Facebook page URL
- The `activities` column stores an array of text strings for activities/focus areas

### Step 1.2: Verify Schema

After running the SQL script, verify that all columns exist:

```sql
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'organizations'
  AND column_name IN ('logo', 'description', 'facebook_link', 'activities')
ORDER BY column_name;
```

Expected result:
- All four columns should exist
- `logo`, `description`, and `facebook_link` should be type `text`
- `activities` should be type `ARRAY` (TEXT[])

---

## 2. Organization Portal: Profile Update Logic

### 2.1: Current Implementation

**File:** `components/organization-portal.html`

**Function:** `handleUpdateOrgProfile(orgId, formData)`

The function is **already correctly implemented** to follow SSOT principles:

```javascript
async function handleUpdateOrgProfile(orgId, formData) {
  // 1. Collect all form values
  const aboutValue = document.getElementById('orgAbout').value.trim();
  const activitiesValue = document.getElementById('orgActivities').value.trim();
  const facebookLinkValue = document.getElementById('facebookLink').value.trim();
  const profilePictureFile = document.getElementById('orgProfilePicture').files[0];

  // 2. Process activities (convert text to array)
  const activitiesArray = activitiesValue
    .split('\n')
    .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
    .filter(line => line.length > 0);

  // 3. Prepare update data object (SSOT consolidation)
  let updateData = {
    description: aboutValue || null,        // About section
    activities: activitiesArray.length > 0 ? activitiesArray : null,  // Activities array
    facebook_link: facebookLinkValue || null  // Facebook URL
  };

  // 4. Upload profile picture if provided
  if (profilePictureFile) {
    const logoUrl = await uploadOrgProfilePicture(profilePictureFile, orgId);
    updateData.logo = logoUrl;  // Save URL to logo column
  }

  // 5. Single database update (SSOT principle)
  const { data: updatedOrg, error: updateError } = await supabase
    .from('organizations')
    .update(updateData)
    .eq('id', orgId)
    .select()
    .single();

  // 6. Update local cache and UI
  // ... (rest of function)
}
```

### 2.2: Profile Fields Mapped to Database Columns

| Form Field | Database Column | Data Type | Notes |
|------------|----------------|-----------|-------|
| "About" textarea (`orgAbout`) | `description` | TEXT | Stores the About section content |
| "Activities" textarea (`orgActivities`) | `activities` | TEXT[] | Converted from newline-separated text to array |
| "Facebook Link" input (`facebookLink`) | `facebook_link` | TEXT | Stores official Facebook page URL |
| Profile Picture file upload (`orgProfilePicture`) | `logo` | TEXT | Stores Supabase Storage public URL after upload |

### 2.3: File Upload Flow

**Function:** `uploadOrgProfilePicture(file, orgId)`

1. Validates file size (max 2MB) and type (PNG, JPG, WebP)
2. Generates unique filename: `{orgId}_{timestamp}.{ext}`
3. Uploads to Supabase Storage bucket: `logos/{orgId}/{filename}`
4. Returns the **public URL** (not the file object)
5. The URL is saved to the `logo` column in `public.organizations`

**Important:** The function returns a URL string, which is then saved to the `logo` column. The actual file is stored in Supabase Storage, not in the database.

---

## 3. Student Portal: Data Retrieval and Display

### 3.1: Data Fetching

**File:** `src/lib/student-orgs.js`

**Function:** `fetchAndRenderOrgs(targetElementId, isMatchView)`

The function **already uses `select('*')`**, which retrieves all columns including the SSOT fields:

```javascript
const { data, error } = await supabase
  .from('organizations')
  .select('*')  // Retrieves all columns, including logo, description, facebook_link, activities
  .order('name', { ascending: true });
```

**No modification needed** - The function already fetches all SSOT fields.

### 3.2: Card Rendering (Organization Cards)

**File:** `src/lib/student-orgs.js`

**Function:** `renderOrgCardHTML(orgData, matchPercentage)`

**Current Implementation:** ✅ Correctly uses SSOT fields

```javascript
// Logo/Profile Picture
if (orgData.logo && (orgData.logo.startsWith('http://') || orgData.logo.startsWith('https://'))) {
  // Full URL from Supabase Storage - use directly
  logoPrimary = orgData.logo;
  logoFallback = orgData.logo;
} else {
  // Legacy local file path format (fallback)
  const logoBase = `../assets/${orgData.logo || 'TUP_DEFAULT'}`;
  logoPrimary = `${logoBase}.png`;
  logoFallback = `${logoBase}.jpg`;
}

// Description (About section)
const description = orgData.description || 'No description available.';
html += `<p class="club-description">${escapeHtml(description)}</p>`;
```

**Status:** ✅ **No changes needed** - Already uses `orgData.logo` and `orgData.description` from SSOT.

### 3.3: Modal Rendering (Organization Detail Modal)

**Files:** `components/browse.html` and `components/findmatch.html`

**Function:** `openModal(org)`

**Current Implementation:** ✅ Correctly uses SSOT fields

```javascript
// About Section
<div class="modal-about">
  <h3>About</h3>
  <p>${club.description}</p>  // Uses description column (SSOT)
</div>

// Activities Section
<div class="modal-focus">
  <h3>Activities</h3>
  <div class="activities-list">
    <ul>
      ${activities.map(a => `<li>${a}</li>`).join("")}  // Uses activities array (SSOT)
    </ul>
  </div>
</div>

// Facebook Link
${((club.url && club.url.trim().length > 0) || (club.facebook_link && club.facebook_link.trim().length > 0)) ? `
<div class="contact-item">
  <a href="${(club.facebook_link && club.facebook_link.trim().length > 0) ? club.facebook_link.trim() : club.url.trim()}" 
     target="_blank" rel="noopener noreferrer" class="contact-link">
    Visit Facebook Page
  </a>
</div>
` : ''}
```

**Status:** ✅ **Correctly implemented** - Uses `club.description`, `club.activities`, and `club.facebook_link` from SSOT. Falls back to `club.url` for backward compatibility with legacy data.

---

## 4. Data Flow Summary

### 4.1: Admin Creates Organization

1. Admin fills form in `admin-dashboard.html`
2. Data is inserted into `public.organizations` table
3. Initial values set for: `name`, `abbreviation`, `affiliation`, `categories`, `email`, etc.
4. Profile fields (`logo`, `description`, `facebook_link`, `activities`) may be NULL initially

### 4.2: Organization Officer Updates Profile

1. Officer logs into Organization Portal (`organization-portal.html`)
2. Officer fills "Profile Management" form:
   - About section → saved to `description` column
   - Activities list → saved to `activities` column (as TEXT[])
   - Facebook link → saved to `facebook_link` column
   - Profile picture → uploaded to Supabase Storage, URL saved to `logo` column
3. **Single database update** to `public.organizations` table (SSOT)
4. All changes are immediately visible in Student Portal

### 4.3: Student Views Organization

1. Student browses organizations (`browse.html` or `findmatch.html`)
2. `fetchAndRenderOrgs()` retrieves all data with `select('*')`
3. Cards display:
   - Logo from `logo` column (URL or legacy path)
   - Description from `description` column
4. Modal displays:
   - About from `description` column
   - Activities from `activities` array
   - Facebook link from `facebook_link` column (or `url` as fallback)

---

## 5. Verification Checklist

After implementing SSOT, verify:

- [ ] SQL script `finalize_ssot_schema.sql` has been run successfully
- [ ] All four columns (`logo`, `description`, `facebook_link`, `activities`) exist in `public.organizations`
- [ ] Organization Portal profile update saves all fields to `public.organizations`
- [ ] Profile picture uploads save the URL to `logo` column (not the file)
- [ ] Student Portal cards display logo from `logo` column
- [ ] Student Portal modal displays description from `description` column
- [ ] Student Portal modal displays activities from `activities` array
- [ ] Student Portal modal displays Facebook link from `facebook_link` column
- [ ] Changes made in Organization Portal are immediately visible in Student Portal

---

## 6. Column Naming Reference

**Important:** The codebase uses these column names consistently:

| Database Column | Used In | Purpose |
|----------------|---------|---------|
| `logo` | Organization Portal, Student Portal | Profile picture URL |
| `description` | Organization Portal, Student Portal | About section content |
| `facebook_link` | Organization Portal, Student Portal | Facebook page URL |
| `activities` | Organization Portal, Student Portal | Activities array |
| `url` | Legacy (backward compatibility) | Old Facebook URL storage (fallback) |

**Note:** The `url` column may still exist in the database for backward compatibility, but new data should use `facebook_link`. The Student Portal checks both `facebook_link` (preferred) and `url` (fallback).

---

## 7. Troubleshooting

### Issue: Profile picture doesn't display in Student Portal

**Check:**
1. Verify the `logo` column contains a full URL (starts with `http://` or `https://`)
2. Verify Supabase Storage bucket `logos` exists and is public
3. Check browser console for image load errors

### Issue: Facebook link doesn't display in modal

**Check:**
1. Verify `facebook_link` column contains a valid URL
2. Check if legacy `url` column has the link (fallback should work)
3. Verify the modal code checks both `facebook_link` and `url`

### Issue: Activities don't display in modal

**Check:**
1. Verify `activities` column is of type TEXT[]
2. Verify the data is stored as an array, not a string
3. Check if `orgActivities` form field is properly converting text to array

---

## 8. Summary

✅ **SSOT Architecture Achieved:**

- All organization profile data is stored in `public.organizations` table
- Single database update consolidates all profile fields
- Student Portal automatically reflects all changes (uses `select('*')`)
- No duplicate data storage or synchronization issues
- Backward compatibility maintained (legacy `url` column still supported)

**Key Principle:** One source of truth = `public.organizations` table. All reads and writes go through this single table.

