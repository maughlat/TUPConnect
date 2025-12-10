# TUPConnect Database Schema

Complete Supabase PostgreSQL schema for the TUPConnect system with role-based access control.

## Overview

This schema implements:
- **Organizations** management with account activation status
- **Organization Profiles** for extended information
- **User Roles** linking authenticated users to organizations
- **Applications** for student organization membership requests
- **Row Level Security (RLS)** policies enforcing secure access
- **Custom security functions** for role-based access control

## Installation

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `schema.sql`
4. Execute the SQL script

## Key Components

### Tables

#### `organizations`
Stores organization information including:
- Basic details (name, abbreviation, description)
- Affiliation (COS, CAFA, CLA, CIE, COE, CIT, or Non-College Based)
- Categories array
- Account status (No Account, Pending Activation, Account Activated)
- Active status

#### `org_profiles`
Extended profile information for organizations:
- Mission, vision, objectives
- Contact information (JSONB)
- Social media links (JSONB)
- Meeting schedules
- Membership information

#### `user_roles`
Links authenticated users (`auth.users`) to organizations and roles:
- `admin`: Full system access, no organization required
- `org_officer`: Organization-specific access, requires `organization_id`

#### `applications`
Student applications to join organizations:
- Student information (name, program/year/section, college, TUP student number)
- Contact information (personal email)
- CV/Resume link
- Application status (Pending, Approved, Rejected)
- Review tracking

### Security Functions

#### `get_user_role()`
Extracts the user's role from JWT claims or `user_roles` table.
- Returns: `'admin'` | `'org_officer'` | `NULL`
- Used in RLS policies to determine access

#### `get_user_organization_id()`
Gets the organization ID for the current `org_officer` user.
- Returns: `UUID` | `NULL`
- Used to filter data by organization

## Row Level Security (RLS) Policies

### Organizations
- ✅ **SELECT**: Anyone (including anonymous users)
- ✅ **UPDATE**: `org_officer` (their own org) | `admin` (any org)
- ✅ **INSERT/DELETE**: `admin` only

### Applications
- ✅ **INSERT**: Anyone (including anonymous users) - allows students to submit
- ✅ **SELECT**: `org_officer` (their org's applications) | `admin` (all)
- ✅ **UPDATE**: `org_officer` (their org's applications) | `admin` (all)
- ✅ **DELETE**: `admin` only

### Org Profiles
- ✅ **SELECT**: Anyone
- ✅ **UPDATE**: `org_officer` (their org) | `admin` (any)

### User Roles
- ✅ **SELECT**: Users can view their own role
- ✅ **ALL**: `admin` only

## Setting Up User Roles

### Creating an Admin User

```sql
-- After user signs up via Supabase Auth, insert into user_roles
INSERT INTO user_roles (user_id, role)
VALUES ('<user-uuid-from-auth-users>', 'admin');
```

### Creating an Org Officer

```sql
-- Link user to an organization
INSERT INTO user_roles (user_id, organization_id, role)
VALUES (
  '<user-uuid-from-auth-users>',
  '<organization-uuid>',
  'org_officer'
);
```

## JWT Claims (Optional)

For better performance, you can set custom claims in JWT tokens:

```javascript
// In Supabase Edge Function or Auth Hook
const { data, error } = await supabase.auth.admin.updateUserById(
  userId,
  {
    user_metadata: {
      user_role: 'org_officer',
      organization_id: 'org-uuid-here'
    }
  }
);
```

The `get_user_role()` function will check JWT claims first, then fall back to the `user_roles` table.

## Example Queries

### Get all organizations (public access)
```sql
SELECT * FROM organizations WHERE is_active = true;
```

### Get applications for an org officer
```sql
-- Automatically filtered by RLS to only show their org's applications
SELECT * FROM applications WHERE status = 'Pending';
```

### Submit an application (anonymous user)
```sql
INSERT INTO applications (
  organization_id,
  student_name,
  year_section,
  college_affiliated,
  tup_student_number,
  personal_email,
  cv_link
) VALUES (
  'org-uuid',
  'Juan Dela Cruz',
  'BS Computer Science, 3rd Year - Section A',
  'COS',
  'TUPM-21-1234',
  'juan@example.com',
  'https://example.com/cv.pdf'
);
```

## Notes

- All tables have `created_at` and `updated_at` timestamps
- `updated_at` is automatically maintained by triggers
- Foreign key constraints ensure data integrity
- Indexes are created for common query patterns
- RLS policies are enabled on all tables

## Security Considerations

1. **Never disable RLS** - It's the primary security mechanism
2. **Use `SECURITY DEFINER` functions carefully** - They run with elevated privileges
3. **Validate JWT claims** - Ensure custom claims are set correctly
4. **Test policies thoroughly** - Verify access patterns match requirements
5. **Monitor access logs** - Review Supabase logs for unauthorized access attempts

