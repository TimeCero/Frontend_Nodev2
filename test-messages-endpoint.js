// Usando fetch nativo de Node.js (disponible desde v18+)

// Función para probar el endpoint de mensajes
async function testMessagesEndpoint() {
  console.log('🧪 Probando endpoint de mensajes...');
  
  const testData = {
    recipient_id: '1aa1b761-990d-49a1-b23f-4e85b0313fb3',
    content: 'Mensaje de prueba desde script'
  };
  
  const testToken = 'test-token-123';
  
  try {
    console.log('📤 Enviando petición POST a /api/messages');
    console.log('📋 Datos:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3001/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('📄 Response:', responseText);
    
    if (response.status === 401) {
      console.log('⚠️  Error 401: Token no válido o expirado');
    } else if (response.status === 404) {
      console.log('❌ Error 404: Endpoint no encontrado');
    } else if (response.status === 400) {
      console.log('⚠️  Error 400: Datos inválidos');
    } else if (response.status === 200 || response.status === 201) {
      console.log('✅ Mensaje enviado exitosamente');
    }
    
  } catch (error) {
    console.error('❌ Error en la petición:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔌 El servidor backend no está ejecutándose en puerto 3001');
    }
  }
}

// Función para probar el endpoint de conversaciones
async function testConversationsEndpoint() {
  console.log('\n🧪 Probando endpoint de conversaciones...');
  
  const testToken = 'test-token-123';
  
  try {
    console.log('📤 Enviando petición GET a /api/messages/conversations');
    
    const response = await fetch('http://localhost:3001/api/messages/conversations', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('📄 Response:', responseText);
    
  } catch (error) {
    console.error('❌ Error en la petición:', error.message);
  }
}

// Función para verificar si el servidor está ejecutándose
async function checkServerStatus() {
  console.log('🔍 Verificando estado del servidor...');
  
  try {
    const response = await fetch('http://localhost:3001/api/freelancers', {
      method: 'GET'
    });
    
    console.log('✅ Servidor backend está ejecutándose');
    console.log('📊 Status:', response.status);
    return true;
    
  } catch (error) {
    console.error('❌ Servidor backend no está disponible:', error.message);
    return false;
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🚀 Iniciando pruebas del backend...');
  console.log('=' .repeat(50));
  
  const serverRunning = await checkServerStatus();
  
  if (serverRunning) {
    await testMessagesEndpoint();
    await testConversationsEndpoint();
  } else {
    console.log('⚠️  No se pueden ejecutar las pruebas porque el servidor no está disponible');
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Pruebas completadas');
}

// Ejecutar las pruebas
runAllTests().catch(console.error);