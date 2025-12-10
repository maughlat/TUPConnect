-- ============================================================================
-- Update Organizations Table Schema
-- Add new fields for enhanced profile management
-- ============================================================================

-- Add facebook_link column if it doesn't exist
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

-- Add activities column if it doesn't exist
-- Using TEXT[] (array of text) for storing bullet points
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
    
    RAISE NOTICE 'Column activities added to organizations table';
  ELSE
    RAISE NOTICE 'Column activities already exists in organizations table';
  END IF;
END $$;

-- Ensure logo column exists (should already exist, but adding check for safety)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations' 
    AND column_name = 'logo'
  ) THEN
    ALTER TABLE public.organizations 
    ADD COLUMN logo VARCHAR(500);
    
    RAISE NOTICE 'Column logo added to organizations table';
  ELSE
    RAISE NOTICE 'Column logo already exists in organizations table';
  END IF;
END $$;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'organizations'
  AND column_name IN ('facebook_link', 'activities', 'logo')
ORDER BY column_name;

