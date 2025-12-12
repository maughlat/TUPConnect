-- ============================================================================
-- TUPConnect Database Schema
-- Supabase PostgreSQL Schema for Organization Account Activation
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CUSTOM TYPES & ENUMS
-- ============================================================================

-- Account status enum for organizations
CREATE TYPE account_status_type AS ENUM (
  'No Account',
  'Pending Activation',
  'Account Activated'
);

-- Application status enum
CREATE TYPE application_status_type AS ENUM (
  'Pending',
  'Approved',
  'Rejected'
);

-- User role type (stored in JWT claims)
CREATE TYPE user_role_type AS ENUM (
  'admin',
  'org_officer'
);

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- Organizations table
-- Stores basic organization information
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  abbreviation VARCHAR(50),
  description TEXT,
  affiliation VARCHAR(50) NOT NULL, -- COS, CAFA, CLA, CIE, COE, CIT, or Non-College Based
  categories TEXT[], -- Array of category strings
  email VARCHAR(255),
  url VARCHAR(500),
  logo VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  account_status account_status_type DEFAULT 'No Account',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization Profiles table
-- Extended profile information for organizations
CREATE TABLE IF NOT EXISTS org_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  mission TEXT,
  vision TEXT,
  objectives TEXT[],
  contact_info JSONB, -- Flexible JSON structure for contact details
  social_links JSONB, -- JSON object for social media links
  meeting_schedule TEXT,
  membership_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Roles table
-- Links authenticated users (from auth.users) to organizations and roles
-- This table connects Supabase auth.users to our custom role system
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role user_role_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure org_officer must have an organization_id, admin does not
  CONSTRAINT check_org_officer_has_org CHECK (
    (role = 'org_officer' AND organization_id IS NOT NULL) OR
    (role = 'admin' AND organization_id IS NULL)
  )
);

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

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_organizations_affiliation ON organizations(affiliation);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_organizations_account_status ON organizations(account_status);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_organization_id ON user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_organization_id ON applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_date_submitted ON applications(date_submitted);
CREATE INDEX IF NOT EXISTS idx_applications_tup_student_number ON applications(tup_student_number);

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_profiles_updated_at
  BEFORE UPDATE ON org_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. SECURITY FUNCTION: get_user_role()
-- ============================================================================
-- Extracts the custom role ('admin' or 'org_officer') from the user's JWT token
-- The role is stored in JWT claims as 'user_role' and 'organization_id'
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role_type AS $$
DECLARE
  user_role_claim TEXT;
  current_user_id UUID;
BEGIN
  -- Get current authenticated user ID
  current_user_id := auth.uid();
  
  -- If no authenticated user, return NULL (handled by return type)
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Try to get role from JWT claims first (if set in token)
  user_role_claim := (auth.jwt() ->> 'user_role')::TEXT;
  
  -- If not in JWT, fall back to checking user_roles table
  IF user_role_claim IS NULL THEN
    SELECT role INTO user_role_claim
    FROM user_roles
    WHERE user_id = current_user_id;
  END IF;
  
  -- Return the role as enum type
  RETURN user_role_claim::user_role_type;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE;

-- ============================================================================
-- 6. HELPER FUNCTION: get_user_organization_id()
-- ============================================================================
-- Gets the organization_id for the current org_officer user
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
DECLARE
  current_user_id UUID;
  org_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Try JWT claim first
  org_id := (auth.jwt() ->> 'organization_id')::UUID;
  
  -- Fall back to user_roles table
  IF org_id IS NULL THEN
    SELECT organization_id INTO org_id
    FROM user_roles
    WHERE user_id = current_user_id AND role = 'org_officer';
  END IF;
  
  RETURN org_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. RLS POLICIES: ORGANIZATIONS
-- ============================================================================
-- Requirement: ALL users (anon included) can SELECT
--              Only 'org_officer' can UPDATE their linked org
-- ============================================================================

-- Policy: Anyone can SELECT organizations
CREATE POLICY "Anyone can view organizations"
  ON organizations
  FOR SELECT
  TO public
  USING (true);

-- Policy: Org officers can UPDATE their own organization
CREATE POLICY "Org officers can update their organization"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    get_user_role() = 'org_officer' AND
    id = get_user_organization_id()
  )
  WITH CHECK (
    get_user_role() = 'org_officer' AND
    id = get_user_organization_id()
  );

-- Policy: Admins can UPDATE any organization
CREATE POLICY "Admins can update any organization"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Policy: Admins can INSERT organizations
-- Using IS NOT DISTINCT FROM to handle NULL cases properly
CREATE POLICY "Admins can insert organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Admins can DELETE organizations
CREATE POLICY "Admins can delete organizations"
  ON organizations
  FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================================
-- 9. RLS POLICIES: ORG_PROFILES
-- ============================================================================

-- Policy: Anyone can SELECT org profiles
CREATE POLICY "Anyone can view org profiles"
  ON org_profiles
  FOR SELECT
  TO public
  USING (true);

-- Policy: Org officers can UPDATE their organization's profile
CREATE POLICY "Org officers can update their org profile"
  ON org_profiles
  FOR UPDATE
  TO authenticated
  USING (
    get_user_role() = 'org_officer' AND
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    get_user_role() = 'org_officer' AND
    organization_id = get_user_organization_id()
  );

-- Policy: Admins can manage org profiles
CREATE POLICY "Admins can manage org profiles"
  ON org_profiles
  FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ============================================================================
-- 10. RLS POLICIES: USER_ROLES
-- ============================================================================

-- Policy: Users can view their own role
CREATE POLICY "Users can view their own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Admins can manage all user roles
CREATE POLICY "Admins can manage user roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ============================================================================
-- 11. RLS POLICIES: APPLICATIONS
-- ============================================================================
-- Requirement: ALL users (anon included) can INSERT
--              Only 'org_officer' can SELECT/UPDATE applications linked to their org
-- ============================================================================

-- Policy: Anyone (including anonymous) can INSERT applications
CREATE POLICY "Anyone can submit applications"
  ON applications
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Org officers can SELECT applications for their organization
CREATE POLICY "Org officers can view their org applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING (
    get_user_role() = 'org_officer' AND
    organization_id = get_user_organization_id()
  );

-- Policy: Org officers can UPDATE applications for their organization
CREATE POLICY "Org officers can update their org applications"
  ON applications
  FOR UPDATE
  TO authenticated
  USING (
    get_user_role() = 'org_officer' AND
    organization_id = get_user_organization_id()
  )
  WITH CHECK (
    get_user_role() = 'org_officer' AND
    organization_id = get_user_organization_id()
  );

-- Policy: Admins can SELECT all applications
CREATE POLICY "Admins can view all applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

-- Policy: Admins can UPDATE all applications
CREATE POLICY "Admins can update all applications"
  ON applications
  FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- Policy: Admins can DELETE applications
CREATE POLICY "Admins can delete applications"
  ON applications
  FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

-- ============================================================================
-- 12. GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated and anon roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON organizations TO anon, authenticated;
GRANT SELECT ON org_profiles TO anon, authenticated;
GRANT INSERT ON applications TO anon, authenticated;
GRANT SELECT, UPDATE ON applications TO authenticated;
GRANT SELECT, UPDATE ON organizations TO authenticated;
GRANT SELECT, UPDATE ON org_profiles TO authenticated;
GRANT SELECT ON user_roles TO authenticated;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

