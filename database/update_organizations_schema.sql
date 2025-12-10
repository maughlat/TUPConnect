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

-- Update logo column to TEXT to support longer URLs (if it's currently VARCHAR(100))
DO $$ 
BEGIN
  -- Check if logo column exists and is VARCHAR(100) or smaller
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations' 
    AND column_name = 'logo'
    AND character_maximum_length IS NOT NULL
    AND character_maximum_length <= 100
  ) THEN
    -- Alter the column to TEXT (unlimited length)
    ALTER TABLE public.organizations 
    ALTER COLUMN logo TYPE TEXT;
    
    RAISE NOTICE 'Column logo updated from VARCHAR(100) to TEXT';
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations' 
    AND column_name = 'logo'
  ) THEN
    -- Column doesn't exist, create it as TEXT
    ALTER TABLE public.organizations 
    ADD COLUMN logo TEXT;
    
    RAISE NOTICE 'Column logo added to organizations table as TEXT';
  ELSE
    RAISE NOTICE 'Column logo already exists and is large enough';
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

