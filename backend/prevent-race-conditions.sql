-- Función PostgreSQL para prevenir condiciones de carrera en la creación de perfiles
-- Ejecutar en Supabase SQL Editor

-- 1. Crear función para upsert seguro de perfiles de usuario
CREATE OR REPLACE FUNCTION safe_upsert_user_profile(
  p_email TEXT,
  p_user_id TEXT,
  p_user_type TEXT DEFAULT 'freelancer',
  p_avatar_url TEXT DEFAULT NULL,
  p_github_username TEXT DEFAULT NULL
)
RETURNS TABLE(
  profile_id BIGINT, 
  profile_user_id TEXT, 
  profile_email TEXT,
  is_new_user BOOLEAN
) AS $$
DECLARE
  existing_profile RECORD;
  new_profile RECORD;
BEGIN
  -- Intentar obtener perfil existente con LOCK para prevenir condiciones de carrera
  SELECT id, user_id, email INTO existing_profile
  FROM user_profiles 
  WHERE email = p_email 
  FOR UPDATE NOWAIT;
  
  -- Si existe un perfil, retornar error
  IF FOUND THEN
    RAISE EXCEPTION 'USER_EXISTS: Ya existe un usuario registrado con el correo %', p_email
      USING ERRCODE = 'P0001';
  END IF;
  
  -- Si no existe, crear nuevo perfil
  INSERT INTO user_profiles (
    user_id, 
    email, 
    user_type, 
    avatar_url, 
    github_username,
    created_at, 
    updated_at
  )
  VALUES (
    p_user_id, 
    p_email, 
    p_user_type, 
    p_avatar_url, 
    p_github_username,
    NOW(), 
    NOW()
  )
  RETURNING id, user_id, email INTO new_profile;
  
  -- Retornar el nuevo perfil
  RETURN QUERY SELECT 
    new_profile.id,
    new_profile.user_id,
    new_profile.email,
    TRUE as is_new_user;
    
EXCEPTION
  -- Manejar caso donde otro proceso ya creó el perfil
  WHEN unique_violation THEN
    -- Obtener el perfil existente
    SELECT id, user_id, email INTO existing_profile
    FROM user_profiles 
    WHERE email = p_email;
    
    RAISE EXCEPTION 'USER_EXISTS: Ya existe un usuario registrado con el correo %', p_email
      USING ERRCODE = 'P0001';
      
  -- Manejar lock no disponible (otro proceso está modificando)
  WHEN lock_not_available THEN
    RAISE EXCEPTION 'CONCURRENT_ACCESS: Otro proceso está creando un usuario con este correo. Intenta de nuevo.'
      USING ERRCODE = 'P0002';
END;
$$ LANGUAGE plpgsql;

-- 2. Crear función para verificar si un usuario existe
CREATE OR REPLACE FUNCTION check_user_exists(
  p_email TEXT
)
RETURNS TABLE(
  exists_user BOOLEAN,
  user_type TEXT,
  github_username TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE WHEN up.email IS NOT NULL THEN TRUE ELSE FALSE END as exists_user,
    up.user_type,
    up.github_username
  FROM user_profiles up
  WHERE up.email = p_email
  LIMIT 1;
  
  -- Si no se encuentra ningún resultado, retornar FALSE
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear índice único compuesto para mejor performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email_unique 
ON user_profiles(email) 
WHERE email IS NOT NULL;

-- 4. Verificar que las funciones se crearon correctamente
SELECT 
  routine_name, 
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('safe_upsert_user_profile', 'check_user_exists');

-- 5. Ejemplo de uso de las funciones
/*
-- Verificar si un usuario existe
SELECT * FROM check_user_exists('test@example.com');

-- Crear un nuevo usuario (fallará si ya existe)
SELECT * FROM safe_upsert_user_profile(
  'test@example.com',
  'user_123',
  'freelancer',
  'https://avatar.url',
  'github_username'
);
*/