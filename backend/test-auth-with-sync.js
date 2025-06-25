const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

// Importar passport primero
const passport = require('passport');
require('./config/passport');

// Importar y sincronizar usuarios
const { getAllUsers, users, generateJWT } = require('./config/passport');

async function testAuthWithSync() {
  try {
    console.log('=== PRUEBA DE AUTENTICACIÓN CON SINCRONIZACIÓN ===');
    
    // 1. Sincronizar usuarios de Supabase a Passport
    console.log('\n1. Sincronizando usuarios...');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: supabaseUsers, error } = await supabase
      .from('user_profiles')
      .select('*');
    
    if (error) {
      console.error('Error obteniendo usuarios de Supabase:', error);
      return;
    }
    
    // Sincronizar usuarios
    for (const supabaseUser of supabaseUsers) {
      const passportUser = {
        id: supabaseUser.user_id,
        email: supabaseUser.email || `${supabaseUser.full_name.toLowerCase().replace(/\s+/g, '')}@test.com`,
        name: supabaseUser.full_name,
        avatar: supabaseUser.avatar_url || null,
        provider: 'supabase',
        userType: supabaseUser.user_type || 'client',
        createdAt: new Date().toISOString()
      };
      
      users.set(supabaseUser.user_id, passportUser);
    }
    
    console.log(`   ✅ ${supabaseUsers.length} usuarios sincronizados`);
    
    // 2. Verificar usuarios en passport
    console.log('\n2. Usuarios en Passport:');
    const passportUsers = getAllUsers();
    passportUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.userType}) - ${user.id}`);
    });
    
    // 3. Probar autenticación con usuario existente
    console.log('\n3. Probando autenticación...');
    
    const testUserId = 'e25f5da5-1c19-4a6a-bb61-d4a277c8d6e1';
    const testToken = generateJWT({ id: testUserId, email: 'test@example.com' });
    
    console.log(`   Token generado: ${testToken.substring(0, 50)}...`);
    
    // Simular verificación del middleware
    try {
      const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
      console.log(`   ✅ Token decodificado: ${decoded.id}`);
      
      // Buscar usuario en passport
      const { getUserById } = require('./config/passport');
      const user = getUserById(decoded.id);
      
      if (user) {
        console.log(`   ✅ Usuario encontrado en Passport: ${user.name}`);
        console.log(`   ✅ AUTENTICACIÓN EXITOSA`);
      } else {
        console.log(`   ❌ Usuario NO encontrado en Passport`);
      }
      
    } catch (jwtError) {
      console.log(`   ❌ Error verificando token: ${jwtError.message}`);
    }
    
    // 4. Probar endpoint de verificación
    console.log('\n4. Probando endpoint /api/auth/verify...');
    
    try {
      const response = await axios.get('http://localhost:3001/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   ✅ Usuario: ${response.data.user.name}`);
      
    } catch (axiosError) {
      console.log(`   ❌ Error en endpoint: ${axiosError.response?.status || axiosError.message}`);
      if (axiosError.response?.data) {
        console.log(`   ❌ Respuesta: ${JSON.stringify(axiosError.response.data)}`);
      }
    }
    
    console.log('\n=== PRUEBA COMPLETADA ===');
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

testAuthWithSync();