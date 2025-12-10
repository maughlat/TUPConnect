/**
 * TUPConnect Authentication Module
 * Handles user authentication, role verification, and session management
 */

import { supabase } from './supabase.js';

/**
 * 1. Handle Login Function
 * Authenticates the user and verifies their role matches the selected login role
 * 
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {string} loginRole - Selected role from login form ('admin' or 'org_officer')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function handleLogin(email, password, loginRole) {
  try {
    // Display loading state
    const errorElement = document.getElementById('loginError');
    if (errorElement) {
      errorElement.style.display = 'none';
    }

    // Step 1: Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (authError) {
      throw new Error(authError.message || 'Invalid email or password');
    }

    if (!authData.user) {
      throw new Error('Authentication failed. Please try again.');
    }

    const userId = authData.user.id;

    // Step 2: Query user_roles table to get the user's actual role
    const { data: userRoleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role, organization_id')
      .eq('user_id', userId)
      .single();

    if (roleError || !userRoleData) {
      // Sign out the user if role lookup fails
      await supabase.auth.signOut();
      throw new Error('User role not found. Please contact an administrator.');
    }

    const actualRole = userRoleData.role;

    // Step 3: Normalize role values for comparison
    // Handle both 'officer' (from UI) and 'org_officer' (from database)
    const normalizedLoginRole = loginRole === 'officer' ? 'org_officer' : loginRole;
    const normalizedActualRole = actualRole;

    // Step 4: Verify role matches
    if (normalizedActualRole !== normalizedLoginRole) {
      // Sign out the user if role doesn't match
      await supabase.auth.signOut();
      throw new Error(`Access denied. This account is registered as ${actualRole === 'org_officer' ? 'Organization Officer' : 'Administrator'}. Please select the correct role.`);
    }

    // Step 5: Role matches - redirect to appropriate dashboard
    await redirectToDashboard(actualRole);

    return { success: true };
  } catch (error) {
    // Display error message on the DOM
    displayLoginError(error.message || 'An error occurred during login. Please try again.');
    return { success: false, error: error.message };
  }
}

/**
 * 2. Redirect to Dashboard Function
 * Redirects the browser based on the verified user role
 * 
 * @param {string} role - User's verified role ('admin' or 'org_officer')
 */
export async function redirectToDashboard(role) {
  try {
    // Normalize role value
    const normalizedRole = role === 'officer' ? 'org_officer' : role;

    switch (normalizedRole) {
      case 'admin':
        window.location.href = 'admin-dashboard.html';
        break;
      
      case 'org_officer':
        window.location.href = 'organization-portal.html';
        break;
      
      default:
        // Unrecognized role - redirect to login with error
        console.error('Unrecognized user role:', role);
        window.location.href = 'login.html?error=invalid_role';
        break;
    }
  } catch (error) {
    console.error('Error during redirect:', error);
    window.location.href = 'login.html?error=redirect_failed';
  }
}

/**
 * 3. Handle Logout Function
 * Terminates the user session and redirects to login page
 * 
 * @returns {Promise<void>}
 */
export async function handleLogout() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
      // Still redirect even if signOut has an error
    }

    // Clear any local storage or session storage
    sessionStorage.clear();
    localStorage.removeItem('tupconnect_user_role');
    localStorage.removeItem('tupconnect_organization_id');

    // Redirect to login page
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Error during logout:', error);
    // Force redirect even on error
    window.location.href = 'login.html';
  }
}

/**
 * 4. Session Verification Function
 * Checks for an active session and redirects to login if no valid session is found
 * This should be called on page load for protected pages (admin_dashboard.html, org_portal.html)
 * 
 * @param {string[]} allowedRoles - Array of roles allowed to access this page (e.g., ['admin'] or ['org_officer'] or ['admin', 'org_officer'])
 * @returns {Promise<{isAuthenticated: boolean, user?: object, role?: string, organizationId?: string}>}
 */
export async function verifySession(allowedRoles = []) {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session || !session.user) {
      // No valid session - redirect to login
      window.location.href = 'login.html?error=session_expired';
      return { isAuthenticated: false };
    }

    const userId = session.user.id;

    // Get user's role from user_roles table
    const { data: userRoleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role, organization_id')
      .eq('user_id', userId)
      .single();

    if (roleError || !userRoleData) {
      // User has no role assigned - sign out and redirect
      await supabase.auth.signOut();
      window.location.href = 'login.html?error=no_role_assigned';
      return { isAuthenticated: false };
    }

    const userRole = userRoleData.role;
    const organizationId = userRoleData.organization_id;

    // Check if user's role is in the allowed roles list
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      // User doesn't have permission for this page - sign out and redirect
      await supabase.auth.signOut();
      window.location.href = 'login.html?error=access_denied';
      return { isAuthenticated: false };
    }

    // Store role and organization ID in localStorage for quick access
    localStorage.setItem('tupconnect_user_role', userRole);
    if (organizationId) {
      localStorage.setItem('tupconnect_organization_id', organizationId);
    }

    // Session is valid and user has correct role
    return {
      isAuthenticated: true,
      user: session.user,
      role: userRole,
      organizationId: organizationId
    };
  } catch (error) {
    console.error('Session verification error:', error);
    window.location.href = 'login.html?error=verification_failed';
    return { isAuthenticated: false };
  }
}

/**
 * Helper Function: Display Login Error
 * Displays error messages on the login form
 * 
 * @param {string} message - Error message to display
 */
function displayLoginError(message) {
  // Try to find existing error element
  let errorElement = document.getElementById('loginError');
  
  if (!errorElement) {
    // Create error element if it doesn't exist
    errorElement = document.createElement('div');
    errorElement.id = 'loginError';
    errorElement.className = 'login-error';
    errorElement.style.cssText = `
      margin-top: 1rem;
      padding: 0.875rem 1rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      color: #dc2626;
      font-size: 0.875rem;
      display: block;
    `;
    
    // Insert before the submit button
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      const submitButton = loginForm.querySelector('button[type="submit"]');
      if (submitButton) {
        loginForm.insertBefore(errorElement, submitButton);
      } else {
        loginForm.appendChild(errorElement);
      }
    }
  }
  
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  
  // Scroll to error element
  errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Helper Function: Get Current User Role
 * Gets the current user's role from localStorage (cached) or from the database
 * 
 * @returns {Promise<string|null>}
 */
export async function getCurrentUserRole() {
  // Try to get from localStorage first (fast)
  const cachedRole = localStorage.getItem('tupconnect_user_role');
  if (cachedRole) {
    return cachedRole;
  }

  // If not in cache, verify session and get role
  const sessionData = await verifySession([]);
  return sessionData.role || null;
}

/**
 * Helper Function: Get Current User Organization ID
 * Gets the current org_officer's organization ID
 * 
 * @returns {Promise<string|null>}
 */
export async function getCurrentUserOrganizationId() {
  // Try to get from localStorage first
  const cachedOrgId = localStorage.getItem('tupconnect_organization_id');
  if (cachedOrgId) {
    return cachedOrgId;
  }

  // If not in cache, verify session and get organization ID
  const sessionData = await verifySession([]);
  return sessionData.organizationId || null;
}

