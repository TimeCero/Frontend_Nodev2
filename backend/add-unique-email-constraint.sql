-- Add UNIQUE constraint to email column in user_profiles table
-- This prevents duplicate users with the same email address

-- First, remove any duplicate emails if they exist
-- Keep only the oldest record for each email
DELETE FROM public.user_profiles 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM public.user_profiles 
  WHERE email IS NOT NULL 
  GROUP BY email
);

-- Add the UNIQUE constraint to the email column
ALTER TABLE public.user_profiles 
ADD CONSTRAINT unique_email UNIQUE (email);

-- Create a partial index to handle NULL emails properly
-- This allows multiple NULL emails but ensures unique non-NULL emails
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email_unique 
ON public.user_profiles (email) 
WHERE email IS NOT NULL;