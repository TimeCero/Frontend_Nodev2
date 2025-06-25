const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testMessagesLocal() {
  console.log('🔐 Probando endpoint /api/messages con datos locales...');
  
  try {
    // Usar los IDs de usuarios que sabemos que existen según las pruebas anteriores
    const clientId = '0c78a7ac-15be-4fd5-8f54-3ae75c39c3fc'; // Cliente EEUU
    const freelancerId = 'cea48378-22a0-4166-a9b1-a67c5964ba26'; // Freelancer EEUU
    
    console.log(`👤 Cliente ID: ${clientId}`);
    console.log(`💼 Freelancer ID: ${freelancerId}`);
    
    // Generar token JWT para el cliente
    const jwtSecret = process.env.JWT_SECRET || 'alejo123';
    
    const tokenPayload = {
      id: clientId,
      email: 'adriano.eeuu00@gmail.com',
      userType: 'client',
      name: 'EEUU',
      provider: 'local'
    };
    
    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '1h' });
    console.log('🔑 Token JWT generado para el cliente');
    console.log(`🔑 Token: ${token.substring(0, 50)}...`);
    
    // Verificar que el token es válido
    try {
      const decoded = jwt.verify(token, jwtSecret);
      console.log('✅ Token verificado exitosamente');
      console.log(`   Usuario: ${decoded.name} (${decoded.id})`);
    } catch (tokenError) {
      console.log('❌ Error verificando token:', tokenError.message);
      return;
    }
    
    // Probar el endpoint /api/messages
    const messageData = {
      recipient_id: freelancerId,
      content: 'Hola, estoy interesado en tu perfil para un proyecto de desarrollo web.'
    };
    
    console.log('📤 Enviando mensaje...');
    console.log(`   De: ${clientId}`);
    console.log(`   Para: ${freelancerId}`);
    console.log(`   Contenido: ${messageData.content}`);
    
    const response = await fetch('http://localhost:3001/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(messageData)
    });
    
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      responseData = responseText;
    }
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Response:`, responseData);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ ¡Mensaje enviado exitosamente!');
      console.log('✅ El endpoint /api/messages está funcionando correctamente');
    } else if (response.status === 401) {
      console.log('🔐 Error de autenticación - verificando token...');
    } else if (response.status === 404) {
      console.log('❌ Error 404 - El endpoint no existe o hay un problema con la ruta');
    } else if (response.status === 500) {
      console.log('⚠️ Error interno del servidor');
    } else {
      console.log(`⚠️ Status inesperado: ${response.status}`);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ No se pudo conectar al servidor en http://localhost:3001');
      console.log('   Asegúrate de que el servidor backend esté ejecutándose');
    } else {
      console.error('❌ Error en la prueba:', error.message);
    }
  }
}

// Función adicional para probar otros endpoints
async function testOtherEndpoints() {
  console.log('\n🧪 Probando otros endpoints...');
  
  try {
    // Probar /api/freelancers
    console.log('📋 Probando /api/freelancers...');
    const freelancersResponse = await fetch('http://localhost:3001/api/freelancers');
    const freelancersData = await freelancersResponse.text();
    console.log(`   Status: ${freelancersResponse.status}`);
    
    if (freelancersResponse.status === 200) {
      const freelancers = JSON.parse(freelancersData);
      console.log(`   ✅ Freelancers encontrados: ${freelancers.length}`);
    }
    
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
}

async function runAllTests() {
  await testMessagesLocal();
  await testOtherEndpoints();
}

runAllTests();