// ============================================================================
// TUPConnect Admin Portal Functions
// ============================================================================
// This file contains reusable functions for the Admin Portal
// ============================================================================

/**
 * Handle adding a new organization to the database
 * 
 * @param {Object} orgData - Organization data from the form
 * @param {string} orgData.name - Organization name (required)
 * @param {string} orgData.affiliation - College affiliation (required)
 * @param {string} [orgData.abbreviation] - Organization abbreviation (optional)
 * @param {string|string[]} orgData.category - Single category string or array of categories
 * @param {string} [orgData.official_email] - Official email address (optional)
 * @param {string} [orgData.description] - Organization description (optional)
 * @param {string} [orgData.url] - Organization URL (optional)
 * @param {string} [orgData.logo] - Logo identifier (optional)
 * 
 * @returns {Promise<Object>} - Returns { success: boolean, data: Object|null, error: string|null }
 * 
 * @example
 * const result = await handleAddNewOrg({
 *   name: "Computer Students' Association",
 *   affiliation: "COS",
 *   abbreviation: "COMPASS",
 *   category: "Technology",
 *   official_email: "compass@tup.edu.ph"
 * });
 * 
 * if (result.success) {
 *   console.log('Organization added:', result.data);
 * } else {
 *   console.error('Error:', result.error);
 * }
 */
async function handleAddNewOrg(orgData) {
  // Validate required fields
  if (!orgData || !orgData.name || !orgData.affiliation) {
    const error = 'Missing required fields: name and affiliation are required';
    console.error('handleAddNewOrg validation error:', error);
    return {
      success: false,
      data: null,
      error: error
    };
  }

  try {
    // Normalize category to categories array
    // If category is a string, convert to array
    // If category is already an array, use it as-is
    let categories = [];
    if (orgData.category) {
      if (Array.isArray(orgData.category)) {
        categories = orgData.category;
      } else if (typeof orgData.category === 'string') {
        categories = [orgData.category];
      }
    }

    // If no categories provided, default to 'Academic'
    if (categories.length === 0) {
      categories = ['Academic'];
    }

    // Prepare data for database insertion
    // Map official_email to email (database column name)
    const insertData = {
      name: orgData.name.trim(),
      affiliation: orgData.affiliation.trim(),
      abbreviation: orgData.abbreviation ? orgData.abbreviation.trim() : null,
      categories: categories,
      email: orgData.official_email ? orgData.official_email.trim() : null,
      description: orgData.description ? orgData.description.trim() : null,
      url: orgData.url ? orgData.url.trim() : null,
      logo: orgData.logo ? orgData.logo.trim() : null,
      // Required defaults: explicitly set to ensure consistency
      is_active: false,
      account_status: 'No Account'
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('organizations')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('handleAddNewOrg Supabase error:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to add organization to database'
      };
    }

    // If organization has an email, create a user in Supabase Auth
    const orgEmail = insertData.email;
    if (orgEmail) {
      console.log('handleAddNewOrg: Creating Auth user for organization email:', orgEmail);
      
      // Generate a random temporary password (user will set their own via activation email)
      const tempPassword = Math.random().toString(36).slice(-12) + 
                          Math.random().toString(36).slice(-12) + 
                          Math.random().toString(36).slice(-4).toUpperCase() + '!@#';
      
      try {
        // Create user in Supabase Auth
        // Note: We use signUp to create the user, but they'll set their password via activation email
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: orgEmail.trim(),
          password: tempPassword,
          options: {
            data: {
              is_org_officer: true,
              organization_id: data.id,
              organization_name: data.name
            }
          }
        });

        if (authError) {
          // If user already exists, that's okay - they can still use activation
          if (authError.message && authError.message.toLowerCase().includes('already registered')) {
            console.log('handleAddNewOrg: User already exists in Auth:', orgEmail);
          } else {
            console.warn('handleAddNewOrg: Failed to create Auth user (organization still added):', authError.message);
            // Don't fail the whole operation - org is already added
          }
        } else {
          console.log('handleAddNewOrg: Auth user created successfully for:', orgEmail);
        }
      } catch (authErr) {
        console.warn('handleAddNewOrg: Error creating Auth user (organization still added):', authErr);
        // Don't fail the whole operation - org is already added
      }
    }

    // Success: return the inserted data
    console.log('handleAddNewOrg success: Organization added with ID', data.id);
    return {
      success: true,
      data: data,
      error: null
    };

  } catch (error) {
    // Handle unexpected errors
    console.error('handleAddNewOrg unexpected error:', error);
    return {
      success: false,
      data: null,
      error: error.message || 'An unexpected error occurred while adding the organization'
    };
  }
}

/**
 * Handle deleting an organization from the database
 * 
 * @param {string} orgId - Organization UUID (required)
 * 
 * @returns {Promise<Object>} - Returns { success: boolean, error: string|null }
 * 
 * @example
 * const result = await handleDeleteOrg('123e4567-e89b-12d3-a456-426614174000');
 * 
 * if (result.success) {
 *   console.log('Organization deleted successfully');
 * } else {
 *   console.error('Error:', result.error);
 * }
 */
async function handleDeleteOrg(orgId) {
  // Validate required parameter
  if (!orgId) {
    const error = 'Organization ID is required';
    console.error('handleDeleteOrg validation error:', error);
    return {
      success: false,
      error: error
    };
  }

  try {
    // Delete from Supabase
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', orgId);

    if (error) {
      console.error('handleDeleteOrg Supabase error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete organization from database'
      };
    }

    // Success: organization deleted
    console.log('handleDeleteOrg success: Organization deleted with ID', orgId);
    return {
      success: true,
      error: null
    };

  } catch (error) {
    // Handle unexpected errors
    console.error('handleDeleteOrg unexpected error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while deleting the organization'
    };
  }
}

// ============================================================================
// DATA CONSISTENCY CONFIRMATION
// ============================================================================
// Both the Admin Portal and Student Portal read from the same centralized
// public.organizations table in Supabase. This ensures automatic synchronization:
//
// 1. When handleAddNewOrg() successfully inserts a new organization:
//    - The new organization immediately appears in the database
//    - On the next data fetch, the Student Portal will automatically see
//      the new organization in browse.html and findmatch.html
//
// 2. When handleDeleteOrg() successfully deletes an organization:
//    - The organization is immediately removed from the database
//    - On the next data fetch, the Student Portal will automatically
//      no longer see the deleted organization
//
// No additional synchronization logic is required because both portals
// query the same source of truth (the Supabase database).
// ============================================================================

// Export functions if using ES modules
// If using in a script tag, the functions will be globally available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { handleAddNewOrg, handleDeleteOrg };
}

// Make functions globally available for vanilla JS usage
if (typeof window !== 'undefined') {
  window.handleAddNewOrg = handleAddNewOrg;
  window.handleDeleteOrg = handleDeleteOrg;
}

