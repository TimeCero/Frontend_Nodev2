const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

async function testSupabaseMiddleware() {
  try {
    console.log('=== PRUEBA DEL MIDDLEWARE DE SUPABASE ===');
    
    // 1. Generar token para usuario existente
    console.log('\n1. Generando token para usuario de prueba...');
    const testUserId = 'e25f5da5-1c19-4a6a-bb61-d4a277c8d6e1';
    const token = jwt.sign(
      { 
        id: testUserId, 
        email: 'test@example.com' 
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log(`   Token generado: ${token.substring(0, 50)}...`);
    
    // 2. Probar endpoint /api/auth/verify
    console.log('\n2. Probando endpoint /api/auth/verify...');
    
    try {
      const response = await axios.get('http://localhost:3001/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   ✅ Usuario autenticado: ${response.data.user.name}`);
      console.log(`   ✅ Tipo de usuario: ${response.data.user.userType}`);
      console.log(`   ✅ ID de usuario: ${response.data.user.id}`);
      
      console.log('\n🎉 MIDDLEWARE DE SUPABASE FUNCIONA CORRECTAMENTE');
      
    } catch (axiosError) {
      console.log(`   ❌ Error en endpoint: ${axiosError.response?.status || axiosError.message}`);
      if (axiosError.response?.data) {
        console.log(`   ❌ Respuesta: ${JSON.stringify(axiosError.response.data, null, 2)}`);
      }
    }
    
    // 3. Probar con token inválido
    console.log('\n3. Probando con token inválido...');
    
    try {
      const invalidResponse = await axios.get('http://localhost:3001/api/auth/verify', {
        headers: {
          'Authorization': 'Bearer token_invalido'
        }
      });
      
      console.log(`   ⚠️  Respuesta inesperada: ${invalidResponse.status}`);
      
    } catch (invalidError) {
      console.log(`   ✅ Error esperado: ${invalidError.response?.status} - ${invalidError.response?.data?.error}`);
    }
    
    // 4. Probar sin token
    console.log('\n4. Probando sin token...');
    
    try {
      const noTokenResponse = await axios.get('http://localhost:3001/api/auth/verify');
      console.log(`   ⚠️  Respuesta inesperada: ${noTokenResponse.status}`);
      
    } catch (noTokenError) {
      console.log(`   ✅ Error esperado: ${noTokenError.response?.status} - ${noTokenError.response?.data?.error}`);
    }
    
    console.log('\n=== PRUEBA COMPLETADA ===');
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

testSupabaseMiddleware();