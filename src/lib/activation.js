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
    // Production URL - ALWAYS use production URL for activation emails
    // This ensures emails always point to the live site, even if triggered from localhost
    const PRODUCTION_URL = 'https://tupconnect.vercel.app';
    const PRODUCTION_REDIRECT = `${PRODUCTION_URL}/components/setup_password.html`;
    
    // Always use production URL for activation emails
    // The redirectUrl parameter can override this if needed for testing
    const finalRedirectUrl = redirectUrl || PRODUCTION_REDIRECT;

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
        
        // IMPORTANT: To prevent the "invitation" email from being sent, we need to:
        // 1. Disable email confirmation in Supabase project settings (Authentication → Providers → Email → Disable "Enable email confirmations")
        // 2. Use autoConfirm to skip email confirmation
        // The signUp will still create the user, but won't send confirmation email if settings are correct
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: orgEmail.trim(),
          password: tempPassword,
          options: {
            // Don't set emailRedirectTo here - it triggers the invitation email
            // We'll only send the password reset email below
            data: {
              is_org_officer: true,
              auto_confirm: true  // Try to auto-confirm (depends on project settings)
            }
          }
        });

        if (signUpError) {
          console.error('Failed to create user account:', signUpError);
          
          // If error is about email confirmation, that's okay - user might already exist
          // or we'll handle it differently
          if (signUpError.message && signUpError.message.toLowerCase().includes('already registered')) {
            console.log('User might already exist. Proceeding with password reset...');
            // Continue to password reset flow below
          } else {
          return {
            success: false,
              error: `Failed to create account: ${signUpError.message || 'User creation failed'}. Note: Make sure email confirmation is disabled in Supabase settings to prevent invitation emails.`
          };
          }
        } else {
          console.log('User account created successfully.');
        }

        console.log('Sending password reset email (activation link)...');
        
        // Wait a moment for the user to be fully created in Supabase
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Send the password reset email (this is the activation email we want)
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

        // Success: user created and activation email sent
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

