// Prueba final del endpoint de mensajes con ID correcto

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU1ZGEzMWI3LTkzNTgtNDkzOS05ZGVkLWI0MGMyMGM0YWMyYiIsImVtYWlsIjoiYWRyaWFuby5hcXAwMEBnbWFpbC5jb20iLCJ1c2VyVHlwZSI6ImNsaWVudCIsInByb3ZpZGVyIjoiZ29vZ2xlIiwiaWF0IjoxNzUwODQxNjYxLCJleHAiOjE3NTE0NDY0NjF9.H9dGBNATXc6PbniqbwSm0q04mb-74OVxMYLG-UJTIak';

async function testMessagesFinal() {
  try {
    console.log('🔍 Obteniendo freelancers...');
    
    const freelancersResponse = await fetch('http://localhost:3001/api/freelancers', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const freelancersData = await freelancersResponse.json();
    
    if (freelancersData.freelancers && freelancersData.freelancers.length > 0) {
      const freelancer = freelancersData.freelancers[0];
      console.log(`✅ Freelancer encontrado: ${freelancer.full_name} (ID: ${freelancer.id})`);
      
      console.log('\n📤 Enviando mensaje...');
      
      const messageResponse = await fetch('http://localhost:3001/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipient_id: freelancer.id,
          content: '¡Hola! Este es un mensaje de prueba desde el sistema. Timestamp: ' + new Date().toISOString()
        })
      });
      
      console.log('📋 Status:', messageResponse.status, messageResponse.statusText);
      
      const responseText = await messageResponse.text();
      console.log('📄 Response:', responseText);
      
      if (messageResponse.ok) {
        console.log('\n🎉 ¡ÉXITO! El mensaje se envió correctamente');
        console.log('✅ El endpoint /api/messages está funcionando');
        console.log('✅ Los datos se están guardando en la base de datos');
        
        // Verificar que el mensaje se guardó consultando conversaciones
        console.log('\n🔍 Verificando que el mensaje se guardó...');
        const conversationsResponse = await fetch('http://localhost:3001/api/messages/conversations', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const conversationsData = await conversationsResponse.json();
        console.log('📋 Conversaciones status:', conversationsResponse.status);
        console.log('📄 Conversaciones:', JSON.stringify(conversationsData, null, 2));
        
      } else {
        console.log('❌ Error al enviar mensaje');
        
        // Intentar parsear como JSON para más detalles
        try {
          const errorData = JSON.parse(responseText);
          console.log('📄 Detalles del error:', errorData);
        } catch (e) {
          console.log('📄 Error raw:', responseText);
        }
      }
      
    } else {
      console.log('❌ No se encontraron freelancers');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar la prueba final
testMessagesFinal();