// Script para diagnosticar el error 404 en el endpoint de mensajes

// Token real del usuario que está experimentando el problema
const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU1ZGEzMWI3LTkzNTgtNDkzOS05ZGVkLWI0MGMyMGM0YWMyYiIsImVtYWlsIjoiYWRyaWFuby5hcXAwMEBnbWFpbC5jb20iLCJ1c2VyVHlwZSI6ImNsaWVudCIsInByb3ZpZGVyIjoiZ29vZ2xlIiwiaWF0IjoxNzUwODQxNjYxLCJleHAiOjE3NTE0NDY0NjF9.H9dGBNATXc6PbniqbwSm0q04mb-74OVxMYLG-UJTIak';

// ID del freelancer al que se intenta enviar el mensaje
const freelancerId = 'c4f51fc7-21a8-4b02-b531-9d80c95e434e';

async function testEndpoints() {
  console.log('🔍 Diagnóstico del error 404 en /api/messages');
  console.log('=' .repeat(60));
  
  // 1. Verificar que el servidor esté ejecutándose
  console.log('\n1. Verificando servidor backend...');
  try {
    const serverCheck = await fetch('http://localhost:3001/api/freelancers');
    console.log(`✅ Servidor responde: ${serverCheck.status}`);
  } catch (error) {
    console.log('❌ Servidor no disponible:', error.message);
    return;
  }
  
  // 2. Probar endpoint de mensajes con método OPTIONS (CORS preflight)
  console.log('\n2. Probando CORS preflight...');
  try {
    const optionsResponse = await fetch('http://localhost:3001/api/messages', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    console.log(`📋 OPTIONS response: ${optionsResponse.status}`);
  } catch (error) {
    console.log('⚠️  OPTIONS error:', error.message);
  }
  
  // 3. Probar endpoint de mensajes con GET (debería dar 404 o Method Not Allowed)
  console.log('\n3. Probando GET en /api/messages...');
  try {
    const getResponse = await fetch('http://localhost:3001/api/messages', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    console.log(`📋 GET response: ${getResponse.status}`);
    const getText = await getResponse.text();
    console.log(`📄 GET response body: ${getText}`);
  } catch (error) {
    console.log('⚠️  GET error:', error.message);
  }
  
  // 4. Probar endpoint de mensajes con POST (el que está fallando)
  console.log('\n4. Probando POST en /api/messages...');
  try {
    const postData = {
      recipient_id: freelancerId,
      content: 'Mensaje de prueba desde diagnóstico'
    };
    
    console.log('📤 Enviando datos:', JSON.stringify(postData, null, 2));
    console.log('🔑 Token (primeros 50 chars):', userToken.substring(0, 50) + '...');
    
    const postResponse = await fetch('http://localhost:3001/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
        'Origin': 'http://localhost:3000'
      },
      body: JSON.stringify(postData)
    });
    
    console.log(`📋 POST response status: ${postResponse.status}`);
    console.log(`📋 POST response statusText: ${postResponse.statusText}`);
    
    const responseText = await postResponse.text();
    console.log(`📄 POST response body: ${responseText}`);
    
    // Mostrar headers de respuesta
    console.log('📋 Response headers:');
    for (const [key, value] of postResponse.headers.entries()) {
      console.log(`   ${key}: ${value}`);
    }
    
  } catch (error) {
    console.log('❌ POST error:', error.message);
    console.log('❌ Error stack:', error.stack);
  }
  
  // 5. Probar otros endpoints relacionados
  console.log('\n5. Probando endpoints relacionados...');
  
  // Probar endpoint de conversaciones
  try {
    const conversationsResponse = await fetch('http://localhost:3001/api/messages/conversations', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    console.log(`📋 /api/messages/conversations: ${conversationsResponse.status}`);
  } catch (error) {
    console.log('⚠️  Conversations error:', error.message);
  }
  
  // Probar endpoint de freelancer específico
  try {
    const freelancerResponse = await fetch(`http://localhost:3001/api/freelancers/${freelancerId}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    console.log(`📋 /api/freelancers/${freelancerId}/profile: ${freelancerResponse.status}`);
  } catch (error) {
    console.log('⚠️  Freelancer profile error:', error.message);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Diagnóstico completado');
}

// Ejecutar diagnóstico
testEndpoints().catch(console.error);