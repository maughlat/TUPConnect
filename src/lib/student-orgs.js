// ============================================================================
// TUPConnect Student Portal - Organization Data Module
// ============================================================================
// This module provides functions for fetching organizations from Supabase
// and rendering them as unified HTML cards for both Browse Clubs and
// Find Your Match views.
// ============================================================================

/**
 * Fetch organizations from Supabase and render them in the target container
 * 
 * @param {string} targetElementId - The ID of the container element where cards will be rendered
 * @param {boolean} isMatchView - If true, adds simulated match_percentage to each organization
 * @returns {Promise<Object>} - Returns { success: boolean, count: number, error: string|null }
 * 
 * @example
 * // For Browse Clubs view
 * await fetchAndRenderOrgs('clubSections', false);
 * 
 * // For Find Your Match view
 * await fetchAndRenderOrgs('clubSections', true);
 */
async function fetchAndRenderOrgs(targetElementId, isMatchView = false) {
  const container = document.getElementById(targetElementId);
  
  if (!container) {
    const error = `Container element with ID "${targetElementId}" not found`;
    console.error('fetchAndRenderOrgs error:', error);
    return {
      success: false,
      count: 0,
      error: error
    };
  }

  try {
    // Fetch all organizations from Supabase
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('fetchAndRenderOrgs Supabase error:', error);
      container.innerHTML = '<p style="text-align: center; color: #dc2626; padding: 2rem;">Failed to load organizations. Please refresh the page.</p>';
      return {
        success: false,
        count: 0,
        error: error.message || 'Failed to fetch organizations from database'
      };
    }

    if (!data || data.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No organizations found.</p>';
      return {
        success: true,
        count: 0,
        error: null
      };
    }

    // Process organizations
    let organizations = data;

    // If this is the match view, add simulated match_percentage to each organization
    if (isMatchView) {
      organizations = organizations.map(org => ({
        ...org,
        match_percentage: Math.floor(Math.random() * (99 - 70 + 1)) + 70 // Random between 70-99
      }));
      
      // Sort by match percentage (highest first) for match view
      organizations.sort((a, b) => b.match_percentage - a.match_percentage);
    }

    // Group organizations by affiliation for better organization
    const groupedOrgs = groupOrganizationsByAffiliation(organizations);

    // Generate HTML for all cards
    let htmlContent = '';

    // If match view, render all cards in a single section
    if (isMatchView) {
      htmlContent = '<section class="category"><h2>Your Matches</h2><div class="cards">';
      organizations.forEach(org => {
        htmlContent += renderOrgCardHTML(org, org.match_percentage);
      });
      htmlContent += '</div></section>';
    } else {
      // For browse view, group by affiliation
      Object.keys(groupedOrgs).forEach(affiliation => {
        const orgs = groupedOrgs[affiliation];
        const affiliationTitle = getAffiliationTitle(affiliation);
        
        htmlContent += `<section class="category" id="${affiliation.toLowerCase().replace('_', '-')}">`;
        htmlContent += `<h2>${affiliationTitle}</h2>`;
        htmlContent += '<div class="cards">';
        
        orgs.forEach(org => {
          htmlContent += renderOrgCardHTML(org, null);
        });
        
        htmlContent += '</div></section>';
      });
    }

    // Inject HTML into container
    container.innerHTML = htmlContent;

    // Re-attach click event listeners to cards for modal opening
    attachCardClickListeners(container, organizations);

    console.log(`fetchAndRenderOrgs success: Rendered ${organizations.length} organizations`);
    return {
      success: true,
      count: organizations.length,
      error: null
    };

  } catch (error) {
    console.error('fetchAndRenderOrgs unexpected error:', error);
    container.innerHTML = '<p style="text-align: center; color: #dc2626; padding: 2rem;">An error occurred while loading organizations. Please refresh the page.</p>';
    return {
      success: false,
      count: 0,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

/**
 * Generate HTML string for a single organization card
 * 
 * @param {Object} orgData - Organization data from Supabase
 * @param {number|null} matchPercentage - Match percentage (70-99) to display, or null
 * @returns {string} - HTML string for the organization card
 * 
 * @example
 * const html = renderOrgCardHTML({
 *   id: 'uuid',
 *   name: "Computer Students' Association",
 *   affiliation: "COS",
 *   categories: ["Academic", "Technology"],
 *   description: "Description here",
 *   logo: "TUP_COMPASS"
 * }, 85);
 */
function renderOrgCardHTML(orgData, matchPercentage = null) {
  // Build logo path - support both Supabase Storage URLs and local file paths
  let logoPrimary, logoFallback;
  
  if (orgData.logo && (orgData.logo.startsWith('http://') || orgData.logo.startsWith('https://'))) {
    // Full URL from Supabase Storage - use directly
    logoPrimary = orgData.logo;
    logoFallback = orgData.logo; // Same URL for fallback
  } else {
    // Legacy local file path format
    // Map organization names to their logo file names (handles naming mismatches)
    const logoMapping = {
      'Institute of Computer Engineering Technologists Student Association': 'TUP_ICpETSA',
      'Dugong Bughaw': 'TUP_DUGONGBUGHAW',
      'TUP ComPAWnion': 'tup_compawnion'
    };
    
    // Try mapped name first, then use orgData.logo, then try org name, finally default
    let logoFileName = logoMapping[orgData.name] || orgData.logo;
    
    // If still no logo, try to derive from organization name
    if (!logoFileName && orgData.name) {
      // Try common patterns
      const name = orgData.name.toUpperCase();
      if (name.includes('COMPUTER ENGINEERING TECHNOLOGISTS')) {
        logoFileName = 'TUP_ICpETSA';
      } else if (name.includes('DUGONG') && name.includes('BUGHAW')) {
        logoFileName = 'TUP_DUGONGBUGHAW';
      } else if (name.includes('COMPAWNION')) {
        logoFileName = 'tup_compawnion';
      }
    }
    
    // Fallback to default if still no logo found
    const logoBase = `../assets/${logoFileName || 'TUP_COMPASS'}`;
    logoPrimary = `${logoBase}.png`;
    logoFallback = `${logoBase}.jpg`;
  }

  // Format categories - display all categories, not just the first one
  let categoriesDisplay = '';
  if (orgData.categories && Array.isArray(orgData.categories) && orgData.categories.length > 0) {
    categoriesDisplay = orgData.categories.join(' • ');
  } else {
    categoriesDisplay = 'Academic/Research'; // Default fallback
  }

  // Get primary category for badge (first category)
  const primaryCategory = (orgData.categories && orgData.categories.length > 0) 
    ? orgData.categories[0] 
    : 'Academic/Research';

  // Format affiliation (handle both string and array)
  const affiliation = Array.isArray(orgData.affiliation) 
    ? orgData.affiliation.join(' · ') 
    : orgData.affiliation || 'N/A';

  // Build HTML
  let html = '<article class="club-card" style="cursor: pointer; position: relative;" data-club-id="' + escapeHtml(orgData.id) + '">';
  
  // Match percentage badge (if provided) with hover popover
  if (matchPercentage !== null && matchPercentage !== undefined) {
    // Get matched categories for popover (if available)
    const matchedCategories = orgData.matchedCategories || [];
    const popoverContent = matchedCategories.length > 0 
      ? `Matched: ${matchedCategories.join(', ')}`
      : `${matchPercentage}% match based on your interests`;
    
    html += `<div class="match-percentage-badge-container">`;
    html += `<div class="match-percentage-badge">${matchPercentage}% Match</div>`;
    html += `<div class="match-percentage-popover">${escapeHtml(popoverContent)}</div>`;
    html += `</div>`;
  }

  // Card header with logo and name
  html += '<div class="club-header">';
  html += '<div class="club-logo">';
  html += `<img src="${logoPrimary}" alt="${escapeHtml(orgData.name)} logo" onerror="this.onerror=null;this.src='${logoFallback}';" />`;
  html += '</div>';
  html += '<div class="club-heading">';
  html += `<h3>${escapeHtml(orgData.name)}</h3>`;
  html += `<p class="club-meta">${escapeHtml(affiliation)}</p>`;
  html += '</div>';
  html += '</div>';

  // Category badges - display primary category and counter for remaining
  html += '<div class="club-categories-wrapper">';
  if (orgData.categories && Array.isArray(orgData.categories) && orgData.categories.length > 0) {
    const primaryCategory = orgData.categories[0];
    const remainingCategoriesCount = orgData.categories.length - 1;
    
    // Display primary category badge with popover
    html += `<div class="club-category-badge-container">`;
    html += `<div class="club-category-badge">${escapeHtml(primaryCategory)}</div>`;
    html += `<div class="category-popover">${escapeHtml(primaryCategory)}</div>`;
    html += `</div>`;
    
    // Display counter badge if there are remaining categories
    if (remainingCategoriesCount > 0) {
      const remainingCategories = orgData.categories.slice(1);
      html += `<div class="category-counter-badge-container">`;
      html += `<div class="category-counter-badge">+${remainingCategoriesCount}</div>`;
      html += '<div class="category-popover">';
      html += remainingCategories.map(cat => escapeHtml(cat)).join(', ');
      html += '</div>';
      html += '</div>';
    }
  } else {
    // Fallback to primaryCategory if no categories array
    html += `<div class="club-category-badge-container">`;
    html += `<div class="club-category-badge">${escapeHtml(primaryCategory)}</div>`;
    html += `<div class="category-popover">${escapeHtml(primaryCategory)}</div>`;
    html += `</div>`;
  }
  html += '</div>';

  // Description (About section only)
  const description = orgData.description || 'No description available.';
  html += `<p class="club-description">${escapeHtml(description)}</p>`;

  html += '</article>';

  return html;
}

/**
 * Helper function to escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Group organizations by affiliation
 * @param {Array} organizations - Array of organization objects
 * @returns {Object} - Object with affiliation as keys and arrays of organizations as values
 */
function groupOrganizationsByAffiliation(organizations) {
  const grouped = {};

  organizations.forEach(org => {
    const affiliation = org.affiliation || 'NON_COLLEGE';
    if (!grouped[affiliation]) {
      grouped[affiliation] = [];
    }
    grouped[affiliation].push(org);
  });

  return grouped;
}

/**
 * Get human-readable title for affiliation
 * @param {string} affiliation - Affiliation code
 * @returns {string} - Human-readable title
 */
function getAffiliationTitle(affiliation) {
  const titles = {
    'CAFA': 'College of Architecture and Fine Arts',
    'CIE': 'College of Industrial Education',
    'CIT': 'College of Industrial Technology',
    'CLA': 'College of Liberal Arts',
    'COE': 'College of Engineering',
    'COS': 'College of Science',
    'NON_COLLEGE': 'Non-College Based',
    'RELIGIOUS': 'Religious Organizations'
  };

  return titles[affiliation] || affiliation;
}

/**
 * Attach click event listeners to organization cards for modal opening
 * @param {HTMLElement} container - Container element containing the cards
 * @param {Array} organizations - Array of organization data for modal content
 */
function attachCardClickListeners(container, organizations) {
  const cards = container.querySelectorAll('.club-card');
  
  cards.forEach(card => {
    const orgId = card.getAttribute('data-club-id');
    const org = organizations.find(o => o.id === orgId);
    
    if (org) {
      card.addEventListener('click', () => {
        // Trigger custom event for modal opening
        // The modal opening logic should be handled by the page's existing modal handler
        const event = new CustomEvent('orgCardClick', {
          detail: { organization: org }
        });
        document.dispatchEvent(event);
      });
    }
  });
}

// Export functions if using ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fetchAndRenderOrgs, renderOrgCardHTML };
}

// Make functions globally available for vanilla JS usage
if (typeof window !== 'undefined') {
  window.fetchAndRenderOrgs = fetchAndRenderOrgs;
  window.renderOrgCardHTML = renderOrgCardHTML;
}

