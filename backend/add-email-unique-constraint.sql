-- Script para agregar restricción UNIQUE en la columna email
-- Ejecutar este script en el SQL Editor de Supabase

-- Primero, eliminar duplicados manualmente si existen
-- Mantener solo el registro más antiguo para cada email
WITH duplicates AS (
  SELECT 
    id,
    email,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC) as rn
  FROM public.user_profiles 
  WHERE email IS NOT NULL
)
DELETE FROM public.user_profiles 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Agregar la restricción UNIQUE en la columna email
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_email_unique UNIQUE (email);

-- Verificar que la restricción se agregó correctamente
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'public.user_profiles'::regclass 
  AND conname = 'user_profiles_email_unique';

-- Verificar que no hay duplicados
SELECT 
  email, 
  COUNT(*) as count
FROM public.user_profiles 
WHERE email IS NOT NULL
GROUP BY email 
HAVING COUNT(*) > 1;