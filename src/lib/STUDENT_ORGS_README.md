# Student Portal Organization Module - Integration Guide

This module provides unified functions for fetching and rendering organizations from Supabase for both the "Browse Clubs" and "Find Your Match" views in the TUPConnect Student Portal.

## Table of Contents

1. [Overview](#overview)
2. [Functions](#functions)
3. [Integration](#integration)
4. [Examples](#examples)

---

## Overview

The `student-orgs.js` module replaces hardcoded organization data with dynamic Supabase queries, ensuring that both student portal views always display the latest organization data from the centralized database.

### Key Features

- ✅ **Unified Data Source**: Both views fetch from the same `public.organizations` table
- ✅ **Automatic Synchronization**: Changes in Admin Portal immediately reflect in Student Portal
- ✅ **Match Percentage Simulation**: Find Your Match view includes simulated match percentages (70-99%)
- ✅ **HTML String Generation**: Generates clean HTML strings for easy integration
- ✅ **Event-Driven Modal**: Uses custom events for modal opening

---

## Functions

### `fetchAndRenderOrgs(targetElementId, isMatchView = false)`

Fetches organizations from Supabase and renders them in the specified container.

#### Parameters

- `targetElementId` (string, required) - The ID of the container element where cards will be rendered
- `isMatchView` (boolean, optional) - If `true`, adds simulated `match_percentage` (70-99) to each organization and sorts by match percentage

#### Returns

```javascript
{
  success: boolean,    // true if operation succeeded
  count: number,      // number of organizations rendered
  error: string|null  // error message if failed
}
```

#### Behavior

- **Browse View** (`isMatchView = false`):
  - Groups organizations by affiliation
  - Renders in category sections (e.g., "College of Science", "Non-College Based")
  - No match percentage displayed

- **Match View** (`isMatchView = true`):
  - Adds random match percentage (70-99%) to each organization
  - Sorts by match percentage (highest first)
  - Renders all in a single "Your Matches" section
  - Displays match percentage badge on each card

---

### `renderOrgCardHTML(orgData, matchPercentage = null)`

Generates the HTML string for a single organization card.

#### Parameters

- `orgData` (Object, required) - Organization data from Supabase with fields:
  - `id` - Organization UUID
  - `name` - Organization name
  - `affiliation` - College affiliation (string)
  - `categories` - Array of category strings
  - `description` - Organization description
  - `logo` - Logo identifier (e.g., "TUP_COMPASS")
  - `match_percentage` - (optional) Match percentage for match view

- `matchPercentage` (number|null, optional) - Match percentage to display (70-99), or `null` to hide

#### Returns

- `string` - Complete HTML string for the organization card

#### Card Structure

The generated HTML includes:
- Match percentage badge (if `matchPercentage` provided)
- Organization logo (with PNG/JPG fallback)
- Organization name and affiliation
- Primary category badge
- Description

---

## Integration

### Step 1: Include the Module

Add the script to your HTML file before your main script:

```html
<!-- In browse.html or findmatch.html -->
<script src="../src/lib/student-orgs.js"></script>
```

Or if using ES modules:

```html
<script type="module">
  import { fetchAndRenderOrgs } from '../src/lib/student-orgs.js';
  // Use fetchAndRenderOrgs in your code
</script>
```

### Step 2: Ensure Supabase is Available

The module requires the global `supabase` client. Make sure it's initialized:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  const supabaseUrl = 'https://your-project.supabase.co';
  const supabaseAnonKey = 'your-anon-key';
  const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
</script>
```

### Step 3: Replace Hardcoded Data

#### For Browse Clubs (`browse.html`)

Replace the hardcoded `categories` array and rendering logic:

```javascript
// Remove the hardcoded categories array
// const categories = [ ... ]; // DELETE THIS

// Replace renderCategories() call with:
document.addEventListener('DOMContentLoaded', async () => {
  const result = await fetchAndRenderOrgs('clubSections', false);
  
  if (result.success) {
    console.log(`Loaded ${result.count} organizations`);
    // Initialize filters and search (your existing code)
  } else {
    console.error('Failed to load organizations:', result.error);
  }
});
```

#### For Find Your Match (`findmatch.html`)

```javascript
document.addEventListener('DOMContentLoaded', async () => {
  const result = await fetchAndRenderOrgs('clubSections', true);
  
  if (result.success) {
    console.log(`Loaded ${result.count} organizations with match percentages`);
  } else {
    console.error('Failed to load organizations:', result.error);
  }
});
```

### Step 4: Handle Modal Opening

The module dispatches a custom `orgCardClick` event. Listen for it to open your modal:

```javascript
document.addEventListener('orgCardClick', (event) => {
  const org = event.detail.organization;
  openModal(org); // Your existing openModal function
});
```

---

## Examples

### Basic Usage - Browse Clubs

```javascript
// Fetch and render organizations for browse view
const result = await fetchAndRenderOrgs('clubSections', false);

if (result.success) {
  console.log(`Successfully rendered ${result.count} organizations`);
} else {
  console.error('Error:', result.error);
}
```

### Basic Usage - Find Your Match

```javascript
// Fetch and render organizations with match percentages
const result = await fetchAndRenderOrgs('clubSections', true);

if (result.success) {
  console.log(`Successfully rendered ${result.count} organizations with match percentages`);
} else {
  console.error('Error:', result.error);
}
```

### Manual Card Rendering

```javascript
// Generate HTML for a single card
const orgData = {
  id: 'uuid-here',
  name: "Computer Students' Association",
  affiliation: "COS",
  categories: ["Academic", "Technology"],
  description: "Description here",
  logo: "TUP_COMPASS"
};

// Without match percentage
const html = renderOrgCardHTML(orgData, null);

// With match percentage
const htmlWithMatch = renderOrgCardHTML(orgData, 85);

// Insert into DOM
document.getElementById('container').innerHTML = html;
```

### Complete Integration Example

```javascript
// In browse.html or findmatch.html
document.addEventListener('DOMContentLoaded', async () => {
  // Determine if this is the match view
  const isMatchView = window.location.pathname.includes('findmatch');
  
  // Fetch and render organizations
  const result = await fetchAndRenderOrgs('clubSections', isMatchView);
  
  if (result.success) {
    console.log(`Loaded ${result.count} organizations`);
    
    // Initialize your existing filter/search functionality
    initializeFilters();
    initializeSearch();
  } else {
    // Show error message to user
    document.getElementById('clubSections').innerHTML = 
      '<p style="text-align: center; color: #dc2626; padding: 2rem;">' +
      'Failed to load organizations. Please refresh the page.' +
      '</p>';
  }
});

// Handle modal opening
document.addEventListener('orgCardClick', (event) => {
  const org = event.detail.organization;
  openModal(org);
});
```

---

## Data Structure

### Organization Object (from Supabase)

```javascript
{
  id: "uuid",
  name: "Computer Students' Association",
  abbreviation: "COMPASS",
  description: "Organization description",
  affiliation: "COS",  // or "CAFA", "CLA", etc.
  categories: ["Academic", "Technology"],  // Array of strings
  email: "compass@tup.edu.ph",
  url: "https://www.facebook.com/...",
  logo: "TUP_COMPASS",
  is_active: true,
  account_status: "Account Activated",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z"
}
```

### With Match Percentage (Find Your Match view)

```javascript
{
  // ... all fields above, plus:
  match_percentage: 85  // Random number between 70-99
}
```

---

## Notes

- **Logo Paths**: The module expects logos in `../assets/` directory with format `{logo}.png` (fallback to `.jpg`)
- **HTML Escaping**: All user-generated content is automatically escaped to prevent XSS
- **Error Handling**: All errors are logged to console and returned in result objects
- **Performance**: Organizations are sorted and grouped efficiently before rendering
- **Event System**: Uses custom events for modal opening to maintain separation of concerns

---

## Troubleshooting

### Organizations Not Loading

1. Check browser console for Supabase errors
2. Verify `supabase` client is initialized globally
3. Ensure RLS policies allow SELECT on `organizations` table
4. Check network tab for failed API requests

### Match Percentages Not Showing

- Ensure `isMatchView` parameter is set to `true`
- Check that CSS for `.match-percentage-badge` is loaded

### Modal Not Opening

- Ensure you're listening for the `orgCardClick` event
- Check that `openModal()` function is defined and accessible
- Verify organization data is being passed correctly in event detail

---

## Migration Checklist

- [ ] Remove hardcoded `categories` array from `browse.html`
- [ ] Remove hardcoded organization data from `findmatch.html`
- [ ] Replace `renderCategories()` calls with `fetchAndRenderOrgs()`
- [ ] Add event listener for `orgCardClick` event
- [ ] Test both Browse and Find Your Match views
- [ ] Verify filtering and search still work
- [ ] Test modal opening with real data

