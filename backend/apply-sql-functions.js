require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase desde variables de entorno
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSQLFunctions() {
  try {
    console.log('🔧 Creando funciones SQL para prevenir condiciones de carrera...');
    
    // Función 1: safe_upsert_user_profile
    console.log('\n📝 Creando función safe_upsert_user_profile...');
    
    const safeUpsertSQL = `
CREATE OR REPLACE FUNCTION safe_upsert_user_profile(
  p_email TEXT,
  p_user_id UUID,
  p_user_type TEXT,
  p_avatar_url TEXT DEFAULT NULL,
  p_github_username TEXT DEFAULT NULL
)
RETURNS TABLE(
  profile_user_id UUID,
  profile_email TEXT,
  profile_user_type TEXT,
  profile_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Intentar adquirir un lock en el email para prevenir condiciones de carrera
  PERFORM pg_advisory_lock(hashtext(p_email));
  
  -- Verificar si el usuario ya existe
  IF EXISTS (SELECT 1 FROM user_profiles WHERE email = p_email) THEN
    -- Liberar el lock
    PERFORM pg_advisory_unlock(hashtext(p_email));
    -- Lanzar excepción personalizada
    RAISE EXCEPTION 'USER_EXISTS' USING ERRCODE = 'P0001';
  END IF;
  
  -- Intentar insertar el nuevo usuario
  BEGIN
    INSERT INTO user_profiles (
      user_id, email, user_type, avatar_url, github_username, created_at, updated_at
    ) VALUES (
      p_user_id, p_email, p_user_type, p_avatar_url, p_github_username, NOW(), NOW()
    );
    
    -- Liberar el lock
    PERFORM pg_advisory_unlock(hashtext(p_email));
    
    -- Retornar el perfil creado
    RETURN QUERY
    SELECT user_id, email, user_type, created_at
    FROM user_profiles
    WHERE user_profiles.user_id = p_user_id;
    
  EXCEPTION
    WHEN unique_violation THEN
      -- Liberar el lock
      PERFORM pg_advisory_unlock(hashtext(p_email));
      -- Lanzar excepción personalizada
      RAISE EXCEPTION 'USER_EXISTS' USING ERRCODE = 'P0001';
    WHEN OTHERS THEN
      -- Liberar el lock
      PERFORM pg_advisory_unlock(hashtext(p_email));
      -- Lanzar excepción de acceso concurrente
      RAISE EXCEPTION 'CONCURRENT_ACCESS' USING ERRCODE = 'P0002';
  END;
END;
$$;`;
    
    // Ejecutar usando el cliente SQL directo de Supabase
    const { data: result1, error: error1 } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(0);
    
    if (error1) {
      console.log('⚠️ No se pudo conectar a Supabase:', error1.message);
      console.log('\n📋 Por favor, ejecuta manualmente en el SQL Editor de Supabase:');
      console.log('\n--- FUNCIÓN 1: safe_upsert_user_profile ---');
      console.log(safeUpsertSQL);
    } else {
      console.log('✅ Conexión a Supabase establecida');
    }
    
    // Función 2: check_user_exists
    console.log('\n📝 Función check_user_exists...');
    
    const checkUserSQL = `
CREATE OR REPLACE FUNCTION check_user_exists(p_email TEXT)
RETURNS TABLE(
  exists_flag BOOLEAN,
  user_type TEXT,
  github_username TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE WHEN COUNT(*) > 0 THEN TRUE ELSE FALSE END as exists_flag,
    COALESCE(MAX(up.user_type), '') as user_type,
    COALESCE(MAX(up.github_username), '') as github_username
  FROM user_profiles up
  WHERE up.email = p_email;
END;
$$;`;
    
    console.log('\n--- FUNCIÓN 2: check_user_exists ---');
    console.log(checkUserSQL);
    
    // Índice único
    const indexSQL = `
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email_unique 
ON user_profiles(email) 
WHERE email IS NOT NULL;`;
    
    console.log('\n--- ÍNDICE ÚNICO ---');
    console.log(indexSQL);
    
    console.log('\n🎯 INSTRUCCIONES:');
    console.log('1. Ve al SQL Editor en tu dashboard de Supabase');
    console.log('2. Copia y pega cada bloque SQL mostrado arriba');
    console.log('3. Ejecuta cada uno por separado');
    console.log('4. Verifica que no haya errores');
    console.log('5. Reinicia el servidor backend después');
    
    console.log('\n✅ Scripts SQL preparados para ejecución manual');
    
  } catch (error) {
    console.error('❌ Error preparando funciones SQL:', error);
    process.exit(1);
  }
}

// Función para verificar si las funciones existen
async function verifyFunctions() {
  try {
    console.log('\n🔍 Verificando si las funciones ya existen...');
    
    // Intentar usar la función check_user_exists
    const { data, error } = await supabase
      .rpc('check_user_exists', {
        p_email: 'test@example.com'
      });
    
    if (!error) {
      console.log('✅ Las funciones SQL ya están disponibles');
      return true;
    } else {
      console.log('⚠️ Las funciones SQL no están disponibles:', error.message);
      return false;
    }
  } catch (error) {
    console.log('⚠️ Error verificando funciones:', error.message);
    return false;
  }
}

// Ejecutar el script
if (require.main === module) {
  console.log('🚀 Iniciando configuración de funciones SQL...');
  
  verifyFunctions()
    .then((exists) => {
      if (!exists) {
        return createSQLFunctions();
      } else {
        console.log('\n🎉 Las funciones ya están configuradas correctamente');
      }
    })
    .then(() => {
      console.log('\n✅ Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { createSQLFunctions, verifyFunctions };