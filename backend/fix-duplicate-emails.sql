-- Script para identificar y resolver emails duplicados en user_profiles

-- 1. Identificar registros duplicados por email
SELECT email, COUNT(*) as count
FROM public.user_profiles 
WHERE email IS NOT NULL
GROUP BY email 
HAVING COUNT(*) > 1;

-- 2. Ver detalles de los registros duplicados
SELECT up1.id, up1.user_id, up1.email, up1.created_at, up1.user_type
FROM public.user_profiles up1
WHERE up1.email IN (
  SELECT email 
  FROM public.user_profiles 
  WHERE email IS NOT NULL
  GROUP BY email 
  HAVING COUNT(*) > 1
)
ORDER BY up1.email, up1.created_at;

-- 3. Eliminar duplicados manteniendo el registro más antiguo
-- CUIDADO: Ejecutar solo después de revisar los datos
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC) as rn
  FROM public.user_profiles
  WHERE email IS NOT NULL
)
DELETE FROM public.user_profiles
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 4. Verificar que no quedan duplicados
SELECT email, COUNT(*) as count
FROM public.user_profiles 
WHERE email IS NOT NULL
GROUP BY email 
HAVING COUNT(*) > 1;

-- 5. Opcional: Si necesitas recrear la restricción única
-- ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_email_unique;
-- ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_email_unique UNIQUE (email);