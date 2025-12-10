/**
 * AUTHENTICATION INTEGRATION EXAMPLES
 * 
 * This file contains example code showing how to integrate the auth functions
 * into your HTML pages. Copy the relevant sections into your actual HTML files.
 */

// ============================================================================
// EXAMPLE 1: LOGIN PAGE INTEGRATION (login.html)
// ============================================================================

/*
<script type="module">
  import { handleLogin } from '../src/lib/auth.js';

  // Get the login form and role selection
  const loginForm = document.getElementById('loginForm');
  let currentRole = 'admin'; // Default role, update based on your role toggle

  // Update currentRole when role toggle buttons are clicked
  const roleAdminBtn = document.getElementById('roleAdmin');
  const roleOfficerBtn = document.getElementById('roleOfficer');
  
  if (roleAdminBtn) {
    roleAdminBtn.addEventListener('click', () => {
      currentRole = 'admin';
    });
  }
  
  if (roleOfficerBtn) {
    roleOfficerBtn.addEventListener('click', () => {
      currentRole = 'officer'; // UI uses 'officer', auth.js handles conversion
    });
  }

  // Handle form submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      if (!email || !password) {
        alert('Please fill in all fields');
        return;
      }

      // Disable submit button during login
      const submitButton = loginForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Signing in...';

      // Call handleLogin function
      await handleLogin(email, password, currentRole);

      // Re-enable button if login failed (redirect happens on success)
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    });
  }

  // Handle "Login to Existing Account" button for officers
  const officerLoginBtn = document.getElementById('officerLoginBtn');
  if (officerLoginBtn) {
    officerLoginBtn.addEventListener('click', () => {
      // Show standard login form
      loginForm.style.display = 'block';
      currentRole = 'officer';
    });
  }
</script>
*/

// ============================================================================
// EXAMPLE 2: ADMIN DASHBOARD INTEGRATION (admin-dashboard.html)
// ============================================================================

/*
<script type="module">
  import { verifySession, handleLogout } from '../src/lib/auth.js';

  // Verify session on page load - only allow 'admin' role
  document.addEventListener('DOMContentLoaded', async () => {
    const sessionData = await verifySession(['admin']);
    
    if (!sessionData.isAuthenticated) {
      // User will be redirected automatically by verifySession
      return;
    }

    // User is authenticated as admin - initialize dashboard
    console.log('Admin authenticated:', sessionData.user.email);
    console.log('Role:', sessionData.role);
    
    // Initialize your dashboard here
    // loadDashboardData();
  });

  // Handle logout button
  const logoutButton = document.getElementById('logoutBtn');
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      await handleLogout();
    });
  }
</script>
*/

// ============================================================================
// EXAMPLE 3: ORGANIZATION PORTAL INTEGRATION (organization-portal.html)
// ============================================================================

/*
<script type="module">
  import { verifySession, handleLogout, getCurrentUserOrganizationId } from '../src/lib/auth.js';

  // Verify session on page load - only allow 'org_officer' role
  document.addEventListener('DOMContentLoaded', async () => {
    const sessionData = await verifySession(['org_officer']);
    
    if (!sessionData.isAuthenticated) {
      // User will be redirected automatically by verifySession
      return;
    }

    // User is authenticated as org_officer - initialize portal
    console.log('Org Officer authenticated:', sessionData.user.email);
    console.log('Organization ID:', sessionData.organizationId);
    
    // Get organization ID for filtering data
    const orgId = await getCurrentUserOrganizationId();
    
    // Initialize your organization portal here
    // loadOrganizationData(orgId);
  });

  // Handle logout button
  const logoutButton = document.getElementById('logoutBtn');
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      await handleLogout();
    });
  }
</script>
*/

// ============================================================================
// EXAMPLE 4: NAVBAR LOGOUT BUTTON (for any page with logout)
// ============================================================================

/*
<script type="module">
  import { handleLogout } from '../src/lib/auth.js';

  // Find all logout buttons/links
  const logoutButtons = document.querySelectorAll('[data-logout]');
  
  logoutButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      await handleLogout();
    });
  });
</script>
*/

// ============================================================================
// EXAMPLE 5: CHECKING USER ROLE IN ANY PAGE
// ============================================================================

/*
<script type="module">
  import { getCurrentUserRole, verifySession } from '../src/lib/auth.js';

  // Option 1: Quick check (uses cached value from localStorage)
  const role = await getCurrentUserRole();
  console.log('Current user role:', role);

  // Option 2: Full verification (checks database)
  const sessionData = await verifySession([]); // Empty array = any authenticated user
  if (sessionData.isAuthenticated) {
    console.log('User role:', sessionData.role);
    console.log('Organization ID:', sessionData.organizationId);
  }
</script>
*/

