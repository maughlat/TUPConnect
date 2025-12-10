// ============================================================================
// TUPConnect Organization Account Activation Functions
// ============================================================================
// This file contains functions for triggering organization account activation
// 
// IMPORTANT: This file requires the Supabase client to be initialized before use.
// The Supabase client should be available globally as 'supabase' or initialized
// in the page that includes this script.
// ============================================================================

/**
 * Trigger account activation by sending a password reset email to the organization officer
 * 
 * @param {string} orgEmail - The official email address of the organization
 * @param {string} [redirectUrl] - Optional custom redirect URL (defaults to setup_password.html)
 * @param {Object} [supabaseClient] - Optional Supabase client (uses global 'supabase' if not provided)
 * @returns {Promise<Object>} - Returns { success: boolean, error: string|null }
 * 
 * @example
 * const result = await triggerAccountActivation('compass@tup.edu.ph');
 * if (result.success) {
 *   console.log('Activation email sent successfully');
 * } else {
 *   console.error('Error:', result.error);
 * }
 */
async function triggerAccountActivation(orgEmail, redirectUrl = null, supabaseClient = null) {
  // Validate email parameter
  if (!orgEmail || typeof orgEmail !== 'string' || !orgEmail.trim()) {
    const error = 'Valid email address is required';
    console.error('triggerAccountActivation validation error:', error);
    return {
      success: false,
      error: error
    };
  }

  // Get Supabase client (use provided client, or global, or throw error)
  const supabase = supabaseClient || (typeof window !== 'undefined' ? window.supabase : null);
  
  if (!supabase) {
    const error = 'Supabase client is not available. Please ensure Supabase is initialized.';
    console.error('triggerAccountActivation error:', error);
    return {
      success: false,
      error: error
    };
  }

  try {
    // Get the current origin to build the redirect URL
    const origin = window.location.origin;
    
    // Production URL - always use this when on production
    const PRODUCTION_URL = 'https://tupconnect.vercel.app';
    const PRODUCTION_REDIRECT = `${PRODUCTION_URL}/components/setup_password.html`;
    
    // Determine if we're on production
    const isProduction = origin.includes('vercel.app') || origin.includes('tupconnect');
    
    // Build redirect URL:
    // - Use production URL if on production
    // - Otherwise, construct from current location (for localhost testing)
    let defaultRedirectUrl;
    if (isProduction) {
      defaultRedirectUrl = PRODUCTION_REDIRECT;
    } else {
      // For localhost/development: construct path intelligently
      const pathname = window.location.pathname;
      let basePath;
      
      // If we're at root or in a subdirectory, use root as base
      if (pathname === '/' || pathname === '/index.html') {
        basePath = '';
      } else if (pathname.includes('/components/')) {
        // If we're already in components, use root as base
        basePath = '';
      } else {
        // Otherwise, use the directory containing the current file
        basePath = pathname.substring(0, pathname.lastIndexOf('/'));
      }
      
      defaultRedirectUrl = `${origin}${basePath}/components/setup_password.html`;
    }
    
    const finalRedirectUrl = redirectUrl || defaultRedirectUrl;

    console.log('=== ACTIVATION EMAIL DEBUG ===');
    console.log('Sending activation email to:', orgEmail);
    console.log('Redirect URL:', finalRedirectUrl);
    console.log('Supabase client available:', !!supabase);
    console.log('==============================');

    // First, try to send the password reset email
    // Use Supabase's resetPasswordForEmail to send the activation link
    let { data, error } = await supabase.auth.resetPasswordForEmail(orgEmail.trim(), {
      redirectTo: finalRedirectUrl
    });
    
    console.log('Password reset response:', { data, error: error ? error.message : null });

    // If error indicates user doesn't exist, create the user first
    if (error) {
      console.log('Password reset error:', error.message);
      
      // Check if the error is because user doesn't exist
      // Common error messages: "User not found", "Email not confirmed", etc.
      const userNotFoundErrors = [
        'user not found',
        'email not confirmed',
        'invalid email',
        'user does not exist'
      ];
      
      const isUserNotFound = userNotFoundErrors.some(errMsg => 
        error.message.toLowerCase().includes(errMsg)
      );

      if (isUserNotFound) {
        console.log('User does not exist. Creating user account first...');
        
        // Generate a random temporary password (user will set their own via email)
        const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + 'A1!';
        
        // Create the user account using signUp
        // Note: We'll disable email confirmation to avoid sending two emails
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: orgEmail.trim(),
          password: tempPassword,
          options: {
            emailRedirectTo: finalRedirectUrl,
            // Disable email confirmation since we'll send password reset instead
            data: {
              is_org_officer: true
            }
          }
        });

        if (signUpError) {
          console.error('Failed to create user account:', signUpError);
          return {
            success: false,
            error: `Failed to create account: ${signUpError.message || 'User creation failed'}`
          };
        }

        console.log('User account created. Now sending password reset email...');
        
        // Wait a moment for the user to be fully created
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Now try sending the password reset email again
        const resetResult = await supabase.auth.resetPasswordForEmail(orgEmail.trim(), {
          redirectTo: finalRedirectUrl
        });

        if (resetResult.error) {
          console.error('Failed to send password reset after user creation:', resetResult.error);
          return {
            success: false,
            error: `Account created but failed to send activation email: ${resetResult.error.message || 'Please try again'}`
          };
        }

        // Success: user created and email sent
        console.log('triggerAccountActivation success: User created and activation email sent to', orgEmail);
        return {
          success: true,
          error: null
        };
      } else {
        // Different error - return it
        console.error('triggerAccountActivation Supabase error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send activation email'
        };
      }
    }

    // Success: email sent (user already existed)
    console.log('triggerAccountActivation success: Activation email sent to', orgEmail);
    return {
      success: true,
      error: null
    };

  } catch (error) {
    // Handle unexpected errors
    console.error('triggerAccountActivation unexpected error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while sending the activation email'
    };
  }
}

// Export function if using ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { triggerAccountActivation };
}

// Make function globally available for vanilla JS usage
if (typeof window !== 'undefined') {
  window.triggerAccountActivation = triggerAccountActivation;
}

