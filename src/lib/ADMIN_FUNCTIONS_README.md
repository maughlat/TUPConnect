# Admin Functions - Integration Guide

This document describes the vanilla JavaScript functions for managing organizations in the TUPConnect Admin Portal. Both functions interact with the centralized `public.organizations` Supabase table, ensuring automatic synchronization with the Student Portal.

## Table of Contents

1. [Data Consistency Principle](#data-consistency-principle)
2. [handleAddNewOrg(orgData)](#handleaddneworgorgdata-function)
3. [handleDeleteOrg(orgId)](#handledeleteorgorgid-function)

---

## Data Consistency Principle

**Both the Admin Portal and Student Portal read from the same centralized `public.organizations` table in Supabase.**

This architecture ensures automatic two-way synchronization:

### When Adding Organizations (`handleAddNewOrg`)
- ✅ New organization is immediately inserted into the database
- ✅ On the next data fetch, the Student Portal (`browse.html`, `findmatch.html`) automatically sees the new organization
- ✅ No additional synchronization logic required

### When Deleting Organizations (`handleDeleteOrg`)
- ✅ Organization is immediately removed from the database
- ✅ On the next data fetch, the Student Portal automatically no longer displays the deleted organization
- ✅ No additional synchronization logic required

**Key Benefit:** Both portals query the same source of truth (Supabase database), guaranteeing data consistency without manual synchronization.

---

## `handleAddNewOrg(orgData)` Function

A complete, asynchronous JavaScript function for handling the "Add New Organization" form submission in the TUPConnect Admin Portal.

### Prerequisites

- The `supabase` client object must be globally available (already initialized)
- The function is located in `src/lib/admin-functions.js`

### Function Signature

```javascript
async function handleAddNewOrg(orgData)
```

### Parameters

The `orgData` object must contain:

**Required Fields:**
- `name` (string) - Organization name
- `affiliation` (string) - College affiliation (e.g., "COS", "CAFA", "CLA", etc.)

**Optional Fields:**
- `abbreviation` (string) - Organization abbreviation
- `category` (string | string[]) - Single category or array of categories
- `official_email` (string) - Official email address (mapped to `email` in database)
- `description` (string) - Organization description
- `url` (string) - Organization URL
- `logo` (string) - Logo identifier

### Return Value

Returns a Promise that resolves to an object:

```javascript
{
  success: boolean,    // true if insertion succeeded, false otherwise
  data: Object|null,   // The inserted organization data (if successful)
  error: string|null   // Error message (if failed)
}
```

### Default Values (Automatically Set)

- `is_active`: `false` (explicitly set)
- `account_status`: `'No Account'` (explicitly set)

### Usage Example

#### Basic Usage

```javascript
const orgData = {
  name: "Computer Students' Association",
  affiliation: "COS",
  abbreviation: "COMPASS",
  category: "Technology",
  official_email: "compass@tup.edu.ph"
};

const result = await handleAddNewOrg(orgData);

if (result.success) {
  console.log('Organization added successfully:', result.data);
  // Update UI, show success message, etc.
} else {
  console.error('Failed to add organization:', result.error);
  // Show error message to user
}
```

#### With Multiple Categories

```javascript
const orgData = {
  name: "Architectural Students' Association",
  affiliation: "CAFA",
  abbreviation: "ASAPHIL",
  category: ["Academic", "Arts"],  // Array of categories
  official_email: "asaphil@tup.edu.ph",
  description: "Architectural Students' Association of the Philippines"
};

const result = await handleAddNewOrg(orgData);
```

#### Integration in Form Submission Handler

```javascript
// In your form submission handler
addOrgForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Collect form data
  const formData = new FormData(addOrgForm);
  const orgData = {
    name: formData.get('orgName'),
    affiliation: formData.get('orgAffiliation'),
    abbreviation: formData.get('orgAbbreviation') || '',
    category: selectedCategories, // Array from category chips
    official_email: formData.get('orgEmail') || null,
    description: formData.get('orgDescription') || null,
    url: formData.get('orgUrl') || null,
    logo: formData.get('orgLogo') || null
  };

  // Call the function
  const result = await handleAddNewOrg(orgData);

  if (result.success) {
    // Show success message
    addOrgMessage.textContent = `Organization "${orgData.name}" has been added successfully.`;
    addOrgMessage.style.background = 'rgba(34, 197, 94, 0.1)';
    addOrgMessage.style.color = '#16a34a';
    addOrgMessage.classList.add('show');

    // Refresh organizations list
    await fetchOrganizations();
    renderOrganizations();

    // Close modal after delay
    setTimeout(() => {
      closeAddOrgModal();
    }, 2000);
  } else {
    // Show error message
    addOrgMessage.textContent = `Failed to add organization: ${result.error}`;
    addOrgMessage.style.background = 'rgba(239, 68, 68, 0.1)';
    addOrgMessage.style.color = '#dc2626';
    addOrgMessage.classList.add('show');
  }
});
```

### Integration Steps

1. **Include the script in your HTML:**

```html
<!-- In admin-dashboard.html, before your main script -->
<script src="../src/lib/admin-functions.js"></script>
```

Or if using ES modules:

```html
<script type="module">
  import { handleAddNewOrg } from '../src/lib/admin-functions.js';
  // Use handleAddNewOrg in your code
</script>
```

2. **Ensure `supabase` is globally available:**

The function requires the `supabase` client to be initialized and available globally. This should already be set up in your admin dashboard.

3. **Use the function in your form handler:**

Replace your existing inline insertion logic with a call to `handleAddNewOrg()`.

### Error Handling

The function handles:
- Missing required fields (name, affiliation)
- Database insertion errors
- Unexpected errors

All errors are logged to the console and returned in the result object for UI display.

### Notes

- The function automatically converts a single `category` string to an array
- If no categories are provided, it defaults to `['Academic']`
- The `official_email` field is mapped to the `email` column in the database
- All string fields are trimmed before insertion
- The function explicitly sets `is_active = false` and `account_status = 'No Account'` to ensure consistency

---

## `handleDeleteOrg(orgId)` Function

A complete, asynchronous JavaScript function for handling organization deletion in the TUPConnect Admin Portal.

### Function Signature

```javascript
async function handleDeleteOrg(orgId)
```

### Parameters

- `orgId` (string, required) - The UUID of the organization to delete

### Return Value

Returns a Promise that resolves to an object:

```javascript
{
  success: boolean,    // true if deletion succeeded, false otherwise
  error: string|null   // Error message (if failed)
}
```

### Usage Example

```javascript
const orgId = '123e4567-e89b-12d3-a456-426614174000';

const result = await handleDeleteOrg(orgId);

if (result.success) {
  console.log('Organization deleted successfully');
  // Refresh organizations list
  await fetchOrganizations();
  renderOrganizations();
} else {
  console.error('Failed to delete organization:', result.error);
  alert(`Failed to delete organization: ${result.error}`);
}
```

### Error Handling

The function handles:
- Missing organization ID
- Database deletion errors
- Unexpected errors

All errors are logged to the console and returned in the result object for UI display.

---

## Data Consistency Confirmation

**Both the Admin Portal and Student Portal read from the same centralized `public.organizations` table in Supabase.**

This ensures automatic two-way synchronization:

### When Adding Organizations (`handleAddNewOrg`)
- ✅ New organization is immediately inserted into the database
- ✅ On the next data fetch, the Student Portal automatically sees the new organization
- ✅ No additional synchronization logic required

### When Deleting Organizations (`handleDeleteOrg`)
- ✅ Organization is immediately removed from the database
- ✅ On the next data fetch, the Student Portal automatically no longer displays the deleted organization
- ✅ No additional synchronization logic required

**Key Benefit:** Both portals query the same source of truth (Supabase database), guaranteeing data consistency without manual synchronization.

