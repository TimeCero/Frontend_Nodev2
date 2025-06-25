// Prueba en tiempo real del endpoint de mensajes

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU1ZGEzMWI3LTkzNTgtNDkzOS05ZGVkLWI0MGMyMGM0YWMyYiIsImVtYWlsIjoiYWRyaWFuby5hcXAwMEBnbWFpbC5jb20iLCJ1c2VyVHlwZSI6ImNsaWVudCIsInByb3ZpZGVyIjoiZ29vZ2xlIiwiaWF0IjoxNzUwODQxNjYxLCJleHAiOjE3NTE0NDY0NjF9.H9dGBNATXc6PbniqbwSm0q04mb-74OVxMYLG-UJTIak';

async function testMessagesEndpoint() {
  console.log('🔍 Probando endpoint /api/messages en tiempo real...');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    const response = await fetch('http://localhost:3001/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        recipient_id: '7f5ad001-cc80-4914-b7b2-7fba5caa4b02',
        content: 'Mensaje de prueba en tiempo real - ' + new Date().toISOString()
      })
    });
    
    console.log('📋 Status:', response.status, response.statusText);
    console.log('📋 Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`   ${key}: ${value}`);
    }
    
    const responseText = await response.text();
    console.log('📄 Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Mensaje enviado exitosamente');
    } else {
      console.log('❌ Error al enviar mensaje');
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

// Ejecutar la prueba
testMessagesEndpoint();