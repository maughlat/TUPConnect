-- ============================================================================
-- Finalize TUPConnect Database Architecture - Single Source of Truth (SSOT)
-- All organization profile data consolidated in public.organizations table
-- ============================================================================

-- 1. Ensure logo column exists as TEXT (stores profile picture URL from Supabase Storage)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations' 
    AND column_name = 'logo'
  ) THEN
    ALTER TABLE public.organizations 
    ADD COLUMN logo TEXT;
    RAISE NOTICE 'Column logo added to organizations table as TEXT';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations' 
    AND column_name = 'logo'
    AND (character_maximum_length IS NOT NULL AND character_maximum_length < 500)
  ) THEN
    -- If logo exists but is VARCHAR with length constraint, change to TEXT
    ALTER TABLE public.organizations 
    ALTER COLUMN logo TYPE TEXT;
    RAISE NOTICE 'Column logo updated to TEXT (unlimited length)';
  ELSE
    RAISE NOTICE 'Column logo already exists as TEXT';
  END IF;
END $$;

-- 2. Ensure description column exists as TEXT (stores "About" content)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.organizations 
    ADD COLUMN description TEXT;
    RAISE NOTICE 'Column description added to organizations table';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations' 
    AND column_name = 'description'
    AND (character_maximum_length IS NOT NULL AND character_maximum_length < 2000)
  ) THEN
    -- If description exists but has length constraint, change to TEXT
    ALTER TABLE public.organizations 
    ALTER COLUMN description TYPE TEXT;
    RAISE NOTICE 'Column description updated to TEXT (unlimited length)';
  ELSE
    RAISE NOTICE 'Column description already exists as TEXT';
  END IF;
END $$;

-- 3. Ensure facebook_link column exists as TEXT
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations' 
    AND column_name = 'facebook_link'
  ) THEN
    ALTER TABLE public.organizations 
    ADD COLUMN facebook_link TEXT;
    RAISE NOTICE 'Column facebook_link added to organizations table';
  ELSE
    RAISE NOTICE 'Column facebook_link already exists in organizations table';
  END IF;
END $$;

-- 4. Ensure activities column exists as TEXT[] (array of text for bullet points)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations' 
    AND column_name = 'activities'
  ) THEN
    ALTER TABLE public.organizations 
    ADD COLUMN activities TEXT[];
    RAISE NOTICE 'Column activities added to organizations table as TEXT[]';
  ELSE
    RAISE NOTICE 'Column activities already exists in organizations table';
  END IF;
END $$;

-- 5. Verify all SSOT columns exist and are correctly typed
SELECT 
  column_name, 
  data_type, 
  udt_name,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'organizations'
  AND column_name IN (
    'logo',           -- Profile picture URL (from Supabase Storage)
    'description',    -- About section content
    'facebook_link',  -- Official Facebook page URL
    'activities'      -- Array of activity bullet points
  )
ORDER BY 
  CASE column_name
    WHEN 'logo' THEN 1
    WHEN 'description' THEN 2
    WHEN 'facebook_link' THEN 3
    WHEN 'activities' THEN 4
  END;

-- Expected result:
-- logo           | text       | text       | NULL | YES
-- description    | text       | text       | NULL | YES
-- facebook_link  | text       | text       | NULL | YES
-- activities     | ARRAY      | _text      | NULL | YES

