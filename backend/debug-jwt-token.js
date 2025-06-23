const jwt = require('jsonwebtoken');
require('dotenv').config();

// Función para decodificar un token JWT sin verificar (solo para debugging)
function decodeJWT(token) {
  try {
    const decoded = jwt.decode(token, { complete: true });
    return decoded;
  } catch (error) {
    console.error('Error decodificando JWT:', error);
    return null;
  }
}

// Función para simular el middleware de autenticación
function simulateAuthMiddleware() {
  console.log('🔍 Para debuggear el problema del JWT:');
  console.log('\n1. Abre las herramientas de desarrollador en tu navegador (F12)');
  console.log('2. Ve a la pestaña "Network" o "Red"');
  console.log('3. Haz una petición a /api/projects/my desde el frontend');
  console.log('4. Busca la petición en la lista y copia el valor del header "Authorization"');
  console.log('5. El token debería verse como: "Bearer eyJ..."');
  console.log('\n6. Una vez que tengas el token, ejecuta:');
  console.log('   node debug-jwt-token.js "tu_token_aqui"');
  console.log('\n7. O modifica este archivo y pega el token abajo:');
  console.log('\n// Ejemplo de uso:');
  console.log('// const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";');
  console.log('// const decoded = decodeJWT(token);');
  console.log('// console.log("Token decodificado:", decoded);');
}

// Si se pasa un token como argumento
const token = process.argv[2];
if (token) {
  console.log('🔍 Analizando token JWT...');
  
  // Remover "Bearer " si está presente
  const cleanToken = token.replace(/^Bearer\s+/, '');
  
  const decoded = decodeJWT(cleanToken);
  if (decoded) {
    console.log('\n📋 Token decodificado:');
    console.log('Header:', decoded.header);
    console.log('Payload:', decoded.payload);
    
    if (decoded.payload.id) {
      console.log(`\n🆔 User ID en el token: ${decoded.payload.id}`);
      
      // Verificar si este ID existe en la base de datos
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      (async () => {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('user_id, email')
          .eq('user_id', decoded.payload.id)
          .single();
        
        if (profile) {
          console.log(`✅ Perfil encontrado: ${profile.email}`);
          
          // Verificar proyectos para este usuario
          const { data: projects } = await supabase
            .from('projects')
            .select('id, title')
            .eq('client_id', decoded.payload.id);
          
          console.log(`📋 Proyectos para este usuario: ${projects?.length || 0}`);
          if (projects && projects.length > 0) {
            projects.forEach(p => console.log(`  - ${p.title}`));
          }
        } else {
          console.log('❌ No se encontró perfil para este user_id');
        }
      })();
    } else {
      console.log('❌ No se encontró user_id en el token');
    }
  }
} else {
  simulateAuthMiddleware();
}

module.exports = { decodeJWT };