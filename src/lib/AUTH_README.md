# TUPConnect Authentication Module

Complete authentication workflow for the TUPConnect system using Supabase and vanilla JavaScript.

## Files

- **`auth.js`** - Main authentication module with all functions
- **`auth-integration-examples.js`** - Code examples for integrating into HTML pages
- **`supabase.js`** - Supabase client initialization (must be configured first)

## Functions

### 1. `handleLogin(email, password, loginRole)`

Authenticates the user and verifies their role matches the selected login role.

**Parameters:**
- `email` (string) - User's email address
- `password` (string) - User's password
- `loginRole` (string) - Selected role from login form: `'admin'` or `'officer'` (converted to `'org_officer'` internally)

**Returns:** `Promise<{success: boolean, error?: string}>`

**Usage:**
```javascript
import { handleLogin } from './src/lib/auth.js';

await handleLogin('admin@tup.edu.ph', 'password123', 'admin');
```

**Behavior:**
1. Signs in user with Supabase Auth
2. Queries `user_roles` table to get user's actual role
3. Compares selected role with database role
4. If match: redirects to appropriate dashboard
5. If mismatch: displays error and signs out user

---

### 2. `redirectToDashboard(role)`

Redirects the browser based on the verified user role.

**Parameters:**
- `role` (string) - User's verified role: `'admin'` or `'org_officer'`

**Redirects:**
- `'admin'` → `admin-dashboard.html`
- `'org_officer'` → `organization-portal.html`
- Unknown role → `login.html?error=invalid_role`

**Usage:**
```javascript
import { redirectToDashboard } from './src/lib/auth.js';

await redirectToDashboard('admin');
```

---

### 3. `handleLogout()`

Terminates the user session and redirects to login page.

**Returns:** `Promise<void>`

**Usage:**
```javascript
import { handleLogout } from './src/lib/auth.js';

await handleLogout();
```

**Behavior:**
1. Signs out user from Supabase
2. Clears localStorage and sessionStorage
3. Redirects to `login.html`

---

### 4. `verifySession(allowedRoles)`

Checks for an active session and verifies user has required role. Should be called on page load for protected pages.

**Parameters:**
- `allowedRoles` (string[]) - Array of roles allowed to access the page
  - `['admin']` - Only admins
  - `['org_officer']` - Only org officers
  - `['admin', 'org_officer']` - Both roles
  - `[]` - Any authenticated user

**Returns:** `Promise<{isAuthenticated: boolean, user?: object, role?: string, organizationId?: string}>`

**Usage:**
```javascript
import { verifySession } from './src/lib/auth.js';

// On admin dashboard - only allow admins
const sessionData = await verifySession(['admin']);

// On org portal - only allow org officers
const sessionData = await verifySession(['org_officer']);

// On any protected page - allow any authenticated user
const sessionData = await verifySession([]);
```

**Behavior:**
1. Checks for valid Supabase session
2. Queries `user_roles` table for user's role
3. Verifies role is in `allowedRoles` array
4. If invalid: signs out and redirects to `login.html`
5. If valid: returns user data and caches role in localStorage

---

### Helper Functions

#### `getCurrentUserRole()`

Gets the current user's role from cache or database.

**Returns:** `Promise<string|null>`

```javascript
import { getCurrentUserRole } from './src/lib/auth.js';

const role = await getCurrentUserRole();
console.log(role); // 'admin' or 'org_officer' or null
```

#### `getCurrentUserOrganizationId()`

Gets the current org_officer's organization ID.

**Returns:** `Promise<string|null>`

```javascript
import { getCurrentUserOrganizationId } from './src/lib/auth.js';

const orgId = await getCurrentUserOrganizationId();
console.log(orgId); // UUID string or null
```

## Integration Guide

### Step 1: Update login.html

Add this script to your `login.html`:

```html
<script type="module">
  import { handleLogin } from '../src/lib/auth.js';

  const loginForm = document.getElementById('loginForm');
  let currentRole = 'admin'; // Update based on your role toggle

  // Update role when toggle buttons are clicked
  document.getElementById('roleAdmin')?.addEventListener('click', () => {
    currentRole = 'admin';
  });
  
  document.getElementById('roleOfficer')?.addEventListener('click', () => {
    currentRole = 'officer';
  });

  // Handle form submission
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    await handleLogin(email, password, currentRole);
  });
</script>
```

### Step 2: Protect Admin Dashboard

Add this to `admin-dashboard.html`:

```html
<script type="module">
  import { verifySession, handleLogout } from '../src/lib/auth.js';

  // Verify session on page load
  document.addEventListener('DOMContentLoaded', async () => {
    await verifySession(['admin']);
    // Initialize dashboard here
  });

  // Handle logout
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await handleLogout();
  });
</script>
```

### Step 3: Protect Organization Portal

Add this to `organization-portal.html`:

```html
<script type="module">
  import { verifySession, handleLogout } from '../src/lib/auth.js';

  // Verify session on page load
  document.addEventListener('DOMContentLoaded', async () => {
    const sessionData = await verifySession(['org_officer']);
    if (sessionData.isAuthenticated) {
      // Initialize portal with sessionData.organizationId
    }
  });

  // Handle logout
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await handleLogout();
  });
</script>
```

## Database Requirements

The authentication module requires the following database structure:

### `user_roles` Table

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  role user_role_type NOT NULL, -- 'admin' or 'org_officer'
  ...
);
```

**Important:**
- `admin` users should have `organization_id = NULL`
- `org_officer` users must have a valid `organization_id`

## Error Handling

The module handles various error scenarios:

- **Invalid credentials** → Error message displayed on login form
- **Role mismatch** → Error message, user signed out
- **No role assigned** → User signed out, redirected to login
- **Session expired** → Automatic redirect to login
- **Access denied** → User signed out, redirected to login

Error messages are displayed in a styled error element that appears above the submit button on the login form.

## Security Notes

1. **Role Verification**: Always verify roles server-side. This client-side code is for UX only.
2. **RLS Policies**: Ensure Row Level Security (RLS) is enabled on all tables in Supabase.
3. **JWT Tokens**: Supabase handles JWT token management automatically.
4. **Session Storage**: Roles are cached in localStorage for performance but verified on each page load.

## Troubleshooting

### "User role not found"
- User exists in `auth.users` but not in `user_roles` table
- Solution: Insert user into `user_roles` table

### "Access denied"
- User's role doesn't match the `allowedRoles` for the page
- Solution: Check `verifySession()` call and user's actual role

### Redirect loop
- `verifySession()` is being called on `login.html`
- Solution: Only call `verifySession()` on protected pages

### Role mismatch error
- User selected wrong role on login form
- Solution: User should select the correct role (admin vs officer)

