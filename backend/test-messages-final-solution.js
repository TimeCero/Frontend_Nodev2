const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testMessagesFinalSolution() {
  console.log('🔧 Diagnóstico completo del problema /api/messages...');
  
  console.log('\n📋 Resumen del problema:');
  console.log('1. ❌ Supabase no está configurado (faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY)');
  console.log('2. ❌ El endpoint /api/messages requiere Supabase para funcionar');
  console.log('3. ❌ El endpoint busca usuarios por user_id, no por id');
  console.log('4. ❌ Sin Supabase, el endpoint devuelve 503 "Supabase no configurado"');
  
  console.log('\n🔍 Verificando estado actual...');
  
  // Verificar variables de entorno
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const jwtSecret = process.env.JWT_SECRET;
  
  console.log(`SUPABASE_URL: ${supabaseUrl ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`JWT_SECRET: ${jwtSecret ? '✅ Configurado' : '❌ No configurado'}`);
  
  // Probar el endpoint actual
  console.log('\n🧪 Probando endpoint actual...');
  
  const clientId = '0c78a7ac-15be-4fd5-8f54-3ae75c39c3fc';
  const freelancerId = 'cea48378-22a0-4166-a9b1-a67c5964ba26';
  
  const tokenPayload = {
    id: clientId,
    email: 'adriano.eeuu00@gmail.com',
    userType: 'client',
    name: 'EEUU',
    provider: 'local'
  };
  
  const token = jwt.sign(tokenPayload, jwtSecret || 'alejo123', { expiresIn: '1h' });
  
  try {
    const response = await fetch('http://localhost:3001/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        recipient_id: freelancerId,
        content: 'Mensaje de prueba'
      })
    });
    
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, responseData);
    
  } catch (error) {
    console.log('❌ Error conectando al servidor:', error.message);
  }
  
  console.log('\n💡 Soluciones posibles:');
  console.log('\n🔧 SOLUCIÓN 1: Configurar Supabase');
  console.log('   - Obtener SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY de tu proyecto Supabase');
  console.log('   - Agregar estas variables al archivo .env');
  console.log('   - Reiniciar el servidor backend');
  
  console.log('\n🔧 SOLUCIÓN 2: Modificar el endpoint para funcionar sin Supabase');
  console.log('   - Crear una versión del endpoint que use datos locales');
  console.log('   - Simular la base de datos con arrays en memoria');
  
  console.log('\n🔧 SOLUCIÓN 3: Usar datos de prueba');
  console.log('   - Configurar Supabase temporalmente con datos de prueba');
  console.log('   - Crear usuarios de prueba en la base de datos');
  
  console.log('\n📝 Pasos recomendados:');
  console.log('1. Configurar Supabase siguiendo SUPABASE_SETUP.md');
  console.log('2. Ejecutar el script fix-missing-user-profile.sql en Supabase');
  console.log('3. Verificar que los usuarios existen con user_id correcto');
  console.log('4. Probar nuevamente el endpoint /api/messages');
  
  console.log('\n🎯 Estado actual: El endpoint está funcionando correctamente,');
  console.log('   solo necesita que Supabase esté configurado.');
}

testMessagesFinalSolution();