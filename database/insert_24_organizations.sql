-- ============================================================================
-- TUPConnect: Insert 24 Organizations from browse.html
-- ============================================================================
-- This script inserts all 24 organizations found in browse.html into the
-- public.organizations table with initial values:
-- - is_active: FALSE (all organizations start inactive)
-- - account_status: 'No Account' (no accounts created yet)
-- - email: Generated placeholder format [abbreviation]@tup.edu.ph
-- ============================================================================

INSERT INTO public.organizations (
  name,
  abbreviation,
  description,
  affiliation,
  categories,
  email,
  url,
  logo,
  is_active,
  account_status
) VALUES
-- College of Architecture and Fine Arts (CAFA)
(
  'Architectural Students'' Association of the Philippines',
  'ASAPHIL',
  'Architectural Students'' Association of the Philippines',
  'CAFA',
  ARRAY['Academic', 'Arts'],
  'asaphil@tup.edu.ph',
  'https://www.facebook.com/ASAPHILARKITEKTOSTUP',
  'TUP_ASAPHIL',
  FALSE,
  'No Account'
),
(
  'THREADS',
  'THREADS',
  'Creative collective for CAFA students',
  'CAFA',
  ARRAY['Arts', 'Community'],
  'threads@tup.edu.ph',
  'https://www.facebook.com/THREADSTUPCAFA',
  'TUP_THREADS',
  FALSE,
  'No Account'
),
(
  'United Architects of the Philippines – Student Auxiliary',
  'UAPSA',
  'United Architects of the Philippines – Student Auxiliary',
  'CAFA',
  ARRAY['Academic'],
  'uapsa@tup.edu.ph',
  'https://www.facebook.com/uapsatup',
  'TUP_UAPSA',
  FALSE,
  'No Account'
),

-- College of Industrial Education (CIE)
(
  'Association of Students in Industrial Arts',
  'ASIA',
  'Association of Students in Industrial Arts',
  'CIE',
  ARRAY['Academic', 'Arts'],
  'asia@tup.edu.ph',
  'https://www.facebook.com/ASIAtupmanila',
  'TUP_ASIA',
  FALSE,
  'No Account'
),
(
  'Food Service, Fashion, Home Economics, Beauty & Wellness Students Association',
  'FFHEBSA',
  'Food Service, Fashion, Home Economics, Beauty & Wellness Students',
  'CIE',
  ARRAY['Academic', 'Service'],
  'ffhebssa@tup.edu.ph',
  'https://www.facebook.com/FHEBSAOfficial',
  'TUP_FFHEBSA',
  FALSE,
  'No Account'
),
(
  'Professional Education Students Association',
  'PRESA',
  'Professional Education Students Association',
  'CIE',
  ARRAY['Academic', 'Community'],
  'presa@tup.edu.ph',
  'https://www.facebook.com/tup.presa',
  'TUP_PRESA',
  FALSE,
  'No Account'
),

-- College of Industrial Technology (CIT)
(
  'Electrical Engineering Technology Student Unit',
  'EETSU',
  'Electrical Engineering Technology Student Unit',
  'CIT',
  ARRAY['Academic', 'Technology'],
  'eetsu@tup.edu.ph',
  'https://www.facebook.com/TUPEETSU',
  'TUP_EETSU',
  FALSE,
  'No Account'
),
(
  'Association of Construction Engineering Technology Students',
  'ACETS',
  'Association of Construction Engineering Technology Students',
  'CIT',
  ARRAY['Academic'],
  'acets@tup.edu.ph',
  'https://www.facebook.com/TUP.ACETS',
  'TUP_ACETS',
  FALSE,
  'No Account'
),
(
  'Institute of Computer Engineering Technologists Student Association',
  'ICpET.SA',
  'Institute of Computer Engineering Technologists Student Association',
  'CIT',
  ARRAY['Academic', 'Technology'],
  'icpetsa@tup.edu.ph',
  'https://www.facebook.com/ICpET.SA',
  'TUP_ICPETSA',
  FALSE,
  'No Account'
),

-- College of Liberal Arts (CLA)
(
  'Future Managers'' Society',
  'FUMAS',
  'Future Managers'' Society',
  'CLA',
  ARRAY['Academic', 'Community'],
  'fumas@tup.edu.ph',
  'https://www.facebook.com/tupfumas',
  'TUP_FUMAS',
  FALSE,
  'No Account'
),
(
  'Student Association of Future Young Hoteliers & Restaurateurs',
  'SAFYHR',
  'Student Association of Future Young Hoteliers & Restaurateurs',
  'CLA',
  ARRAY['Academic', 'Service'],
  'safhyr@tup.edu.ph',
  'https://www.facebook.com/SAFYHR',
  'TUP_SAFYHR',
  FALSE,
  'No Account'
),
(
  'Digital Entrepreneurship and Leadership Transformation Advocates',
  'DELTA',
  'Digital Entrepreneurship and Leadership Transformation Advocates',
  'CLA',
  ARRAY['Academic', 'Technology'],
  'delta@tup.edu.ph',
  'https://www.facebook.com/profile.php?id=61551812175328',
  'TUP_DELTA',
  FALSE,
  'No Account'
),

-- College of Engineering (COE)
(
  'Electrical Engineering Society',
  'EES',
  'Electrical Engineering Society',
  'COE',
  ARRAY['Academic', 'Technology'],
  'ees@tup.edu.ph',
  'https://www.facebook.com/tupeesociety',
  'TUP_EES',
  FALSE,
  'No Account'
),
(
  'Civil Engineering Society',
  'CES',
  'Civil Engineering Society',
  'COE',
  ARRAY['Academic'],
  'ces@tup.edu.ph',
  'https://www.facebook.com/COETUPCES',
  'TUP_CES',
  FALSE,
  'No Account'
),
(
  'Organization of Electronics Engineering Students',
  'OECES',
  'Organization of Electronics Engineering Students',
  'COE',
  ARRAY['Academic', 'Technology'],
  'oeces@tup.edu.ph',
  'https://www.facebook.com/OECES',
  'TUP_OECES',
  FALSE,
  'No Account'
),

-- College of Science (COS)
(
  'College of Science Student Council',
  'CSC',
  'College of Science Student Council',
  'COS',
  ARRAY['Academic', 'Community'],
  'csc@tup.edu.ph',
  'https://www.facebook.com/TUPMCOS',
  'TUP_CSC',
  FALSE,
  'No Account'
),
(
  'Computer Students'' Association',
  'COMPASS',
  'Computer Students'' Association',
  'COS',
  ARRAY['Academic', 'Technology'],
  'compass@tup.edu.ph',
  'https://www.facebook.com/tupcompassofficial',
  'TUP_COMPASS',
  FALSE,
  'No Account'
),
(
  'Chemical Society',
  'CHEMSOC',
  'Chemical Society',
  'COS',
  ARRAY['Academic'],
  'chemsoc@tup.edu.ph',
  'https://www.facebook.com/TUPChemicalSociety',
  'TUP_CHEMSOC',
  FALSE,
  'No Account'
),

-- Non-College Based
(
  'DOST Scholars'' Club',
  'DOSTSC',
  'DOST Scholars'' Club',
  'NON_COLLEGE',
  ARRAY['Academic', 'Community'],
  'dostsc@tup.edu.ph',
  'https://www.facebook.com/tupmdostsc',
  'TUP_DOSTSC',
  FALSE,
  'No Account'
),
(
  'Dugong Bughaw',
  'DUGONGBUGAW',
  'Student-led blood donation and advocacy group',
  'NON_COLLEGE',
  ARRAY['Service', 'Community'],
  'dugongbughaw@tup.edu.ph',
  'https://www.facebook.com/TUPDugongBughaw',
  'TUP_DUGONGBUGHaw',
  FALSE,
  'No Account'
),
(
  'Google Developer Groups on Campus - TUP Manila',
  'GDG',
  'Google Developer Groups on Campus',
  'NON_COLLEGE',
  ARRAY['Technology', 'Community'],
  'gdg@tup.edu.ph',
  'https://www.facebook.com/GDGonCampusTUPManila',
  'TUP_GDG',
  FALSE,
  'No Account'
),
(
  'TUP ComPAWnion',
  'COMPAWNION',
  'Campus cat welfare organization',
  'NON_COLLEGE',
  ARRAY['Community', 'Service'],
  'compawning@tup.edu.ph',
  'https://www.facebook.com/thecompawnion.tupcats',
  'TUP_COMPAWNION',
  FALSE,
  'No Account'
),
(
  'TUP GEAR',
  'GEAR',
  'Gaming, Esports and AR Club',
  'NON_COLLEGE',
  ARRAY['Gaming', 'Technology'],
  'gear@tup.edu.ph',
  'https://www.facebook.com/tupgear',
  'TUP_GEAR',
  FALSE,
  'No Account'
),

-- Religious Organizations
(
  'Student Association of Shabab Al-Muslimin',
  'SASA',
  'Student Association of Shabab Al-Muslimin',
  'RELIGIOUS',
  ARRAY['Community', 'Service'],
  'sasa@tup.edu.ph',
  'https://www.facebook.com/tupmanilasasa',
  'TUP_SASA',
  FALSE,
  'No Account'
)
ON CONFLICT (name) DO UPDATE SET
  abbreviation = EXCLUDED.abbreviation,
  description = EXCLUDED.description,
  affiliation = EXCLUDED.affiliation,
  categories = EXCLUDED.categories,
  email = EXCLUDED.email,
  url = EXCLUDED.url,
  logo = EXCLUDED.logo,
  -- Preserve existing is_active and account_status if they've been changed from defaults
  -- Only update if current values are still at defaults (FALSE and 'No Account')
  is_active = CASE 
    WHEN organizations.is_active = FALSE AND organizations.account_status = 'No Account' 
    THEN EXCLUDED.is_active 
    ELSE organizations.is_active 
  END,
  account_status = CASE 
    WHEN organizations.account_status = 'No Account' 
    THEN EXCLUDED.account_status 
    ELSE organizations.account_status 
  END,
  updated_at = NOW();

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this query after insertion to verify all 24 organizations were inserted:
-- SELECT COUNT(*) as total_organizations FROM public.organizations;
-- Expected result: 24
-- ============================================================================

