-- ============================================================================
-- Update Organization Categories to Refined 10-Category System
-- ============================================================================
-- This script updates the 'categories' column for all 24 organizations
-- to use the new refined 10-category system.
--
-- FINAL 10 CATEGORIES:
-- 1. Academic/Research
-- 2. Technology/IT/Gaming
-- 3. Engineering/Built Env.
-- 4. Arts/Design/Media
-- 5. Leadership/Governance
-- 6. Service/Welfare/Outreach
-- 7. Entrepreneurship/Finance
-- 8. Industrial/Applied Skills
-- 9. Social Justice/Advocacy
-- 10. Culture/Religion
-- ============================================================================

-- SQL UPDATE STATEMENTS (24 Organizations)
-- ============================================================================

UPDATE public.organizations SET categories = ARRAY['Academic/Research'] WHERE name = 'Chemical Society';

UPDATE public.organizations SET categories = ARRAY['Leadership/Governance', 'Service/Welfare/Outreach'] WHERE name = 'College of Science Student Council';

UPDATE public.organizations SET categories = ARRAY['Technology/IT/Gaming', 'Academic/Research'] WHERE name = 'Computer Students'' Association';

UPDATE public.organizations SET categories = ARRAY['Engineering/Built Env.', 'Arts/Design/Media', 'Academic/Research'] WHERE name = 'Architectural Students'' Association of the Philippines';

UPDATE public.organizations SET categories = ARRAY['Arts/Design/Media', 'Academic/Research'] WHERE name = 'Threads';

UPDATE public.organizations SET categories = ARRAY['Engineering/Built Env.', 'Arts/Design/Media'] WHERE name = 'United Architects of the Philippines – Student Auxiliary';

UPDATE public.organizations SET categories = ARRAY['Engineering/Built Env.', 'Academic/Research', 'Industrial/Applied Skills'] WHERE name = 'Association of Construction Engineering Technology Students';

UPDATE public.organizations SET categories = ARRAY['Engineering/Built Env.', 'Technology/IT/Gaming'] WHERE name = 'Electrical Engineering Technology Student Unit';

UPDATE public.organizations SET categories = ARRAY['Technology/IT/Gaming', 'Engineering/Built Env.', 'Academic/Research'] WHERE name = 'Institute of Computer Engineering Technologists Student Association';

UPDATE public.organizations SET categories = ARRAY['Industrial/Applied Skills', 'Arts/Design/Media'] WHERE name = 'Association of Students in Industrial Arts';

UPDATE public.organizations SET categories = ARRAY['Entrepreneurship/Finance', 'Industrial/Applied Skills', 'Arts/Design/Media'] WHERE name = 'Food Service, Fashion, Home Economics, Beauty & Wellness Students Association';

UPDATE public.organizations SET categories = ARRAY['Academic/Research', 'Leadership/Governance', 'Social Justice/Advocacy'] WHERE name = 'Professional Education Students Association';

UPDATE public.organizations SET categories = ARRAY['Engineering/Built Env.', 'Academic/Research'] WHERE name = 'Civil Engineering Society';

UPDATE public.organizations SET categories = ARRAY['Engineering/Built Env.', 'Technology/IT/Gaming'] WHERE name = 'Electrical Engineering Society';

UPDATE public.organizations SET categories = ARRAY['Engineering/Built Env.', 'Technology/IT/Gaming'] WHERE name = 'Organization of Electronics Engineering Students';

UPDATE public.organizations SET categories = ARRAY['Entrepreneurship/Finance', 'Technology/IT/Gaming', 'Leadership/Governance'] WHERE name = 'Digital Entrepreneurship and Leadership Transformation Advocates';

UPDATE public.organizations SET categories = ARRAY['Entrepreneurship/Finance', 'Leadership/Governance'] WHERE name = 'Future Managers'' Society';

UPDATE public.organizations SET categories = ARRAY['Entrepreneurship/Finance', 'Service/Welfare/Outreach', 'Leadership/Governance'] WHERE name = 'Student Association of Future Young Hoteliers & Restaurateurs';

UPDATE public.organizations SET categories = ARRAY['Academic/Research'] WHERE name = 'DOST Scholars'' Club';

UPDATE public.organizations SET categories = ARRAY['Social Justice/Advocacy'] WHERE name = 'Dugong Bughaw';

UPDATE public.organizations SET categories = ARRAY['Technology/IT/Gaming', 'Service/Welfare/Outreach', 'Leadership/Governance'] WHERE name = 'Google Developer Groups on Campus - TUP Manila';

UPDATE public.organizations SET categories = ARRAY['Service/Welfare/Outreach'] WHERE name = 'TUP ComPAWnion';

UPDATE public.organizations SET categories = ARRAY['Technology/IT/Gaming'] WHERE name = 'TUP GEAR';

UPDATE public.organizations SET categories = ARRAY['Culture/Religion'] WHERE name = 'Student Association of Shabab Al-Muslimin';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all organizations and their categories
SELECT 
  name,
  categories,
  array_length(categories, 1) as category_count
FROM public.organizations
WHERE categories IS NOT NULL
ORDER BY name;

-- Count organizations by category
SELECT 
  unnest(categories) as category,
  COUNT(*) as organization_count
FROM public.organizations
WHERE categories IS NOT NULL
GROUP BY unnest(categories)
ORDER BY organization_count DESC, category;

-- Verify all 24 organizations have been updated
SELECT 
  COUNT(*) as total_organizations,
  COUNT(categories) as organizations_with_categories,
  COUNT(*) - COUNT(categories) as organizations_without_categories
FROM public.organizations;

-- List any organizations that might have been missed (NULL or empty categories)
SELECT 
  id,
  name,
  email,
  categories
FROM public.organizations
WHERE categories IS NULL OR array_length(categories, 1) IS NULL
ORDER BY name;

