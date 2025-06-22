-- Add full_name column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Update existing records to set full_name from email (temporary)
-- This can be updated later by users through the profile edit form
UPDATE public.user_profiles 
SET full_name = COALESCE(full_name, SPLIT_PART(email, '@', 1))
WHERE full_name IS NULL AND email IS NOT NULL;

COMMIT;