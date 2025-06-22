-- Script para verificar y corregir constraints en la base de datos
-- Ejecutar manualmente en Supabase SQL Editor

-- 1. Verificar el estado actual de la tabla user_profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar constraints existentes
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.user_profiles'::regclass;

-- 3. Verificar duplicados existentes por email
SELECT 
    email, 
    COUNT(*) as count,
    array_agg(user_id) as user_ids,
    array_agg(full_name) as names
FROM public.user_profiles 
WHERE email IS NOT NULL
GROUP BY email 
HAVING COUNT(*) > 1;

-- 4. Verificar duplicados existentes por user_id
SELECT 
    user_id, 
    COUNT(*) as count,
    array_agg(email) as emails
FROM public.user_profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- 5. Si hay duplicados por email, eliminar los más antiguos (mantener el más reciente)
-- CUIDADO: Esto eliminará datos. Hacer backup primero.
/*
DELETE FROM public.user_profiles 
WHERE id IN (
    SELECT id 
    FROM (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY email ORDER BY updated_at DESC, created_at DESC) as rn
        FROM public.user_profiles 
        WHERE email IS NOT NULL
    ) t 
    WHERE rn > 1
);
*/

-- 6. Asegurar que el constraint UNIQUE en email existe
-- (Solo ejecutar si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_profiles_email_key' 
        AND conrelid = 'public.user_profiles'::regclass
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_email_key UNIQUE (email);
        RAISE NOTICE 'Constraint UNIQUE en email agregado';
    ELSE
        RAISE NOTICE 'Constraint UNIQUE en email ya existe';
    END IF;
END $$;

-- 7. Asegurar que el constraint UNIQUE en user_id existe
-- (Solo ejecutar si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_profiles_user_id_key' 
        AND conrelid = 'public.user_profiles'::regclass
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
        RAISE NOTICE 'Constraint UNIQUE en user_id agregado';
    ELSE
        RAISE NOTICE 'Constraint UNIQUE en user_id ya existe';
    END IF;
END $$;

-- 8. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON public.user_profiles(user_type);

-- 9. Verificar el estado final
SELECT 'Verificación final:' as status;

SELECT 
    COUNT(*) as total_profiles,
    COUNT(DISTINCT email) as unique_emails,
    COUNT(DISTINCT user_id) as unique_user_ids
FROM public.user_profiles;

SELECT 
    user_type,
    COUNT(*) as count
FROM public.user_profiles 
GROUP BY user_type;