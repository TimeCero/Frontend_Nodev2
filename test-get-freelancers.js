// Script para obtener freelancers y probar mensajes

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU1ZGEzMWI3LTkzNTgtNDkzOS05ZGVkLWI0MGMyMGM0YWMyYiIsImVtYWlsIjoiYWRyaWFuby5hcXAwMEBnbWFpbC5jb20iLCJ1c2VyVHlwZSI6ImNsaWVudCIsInByb3ZpZGVyIjoiZ29vZ2xlIiwiaWF0IjoxNzUwODQxNjYxLCJleHAiOjE3NTE0NDY0NjF9.H9dGBNATXc6PbniqbwSm0q04mb-74OVxMYLG-UJTIak';

async function getFreelancersAndTestMessage() {
  try {
    console.log('🔍 Obteniendo lista de freelancers...');
    
    const freelancersResponse = await fetch('http://localhost:3001/api/freelancers', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const freelancersData = await freelancersResponse.json();
    console.log('📋 Status freelancers:', freelancersResponse.status);
    
    if (freelancersData.freelancers && freelancersData.freelancers.length > 0) {
      console.log('✅ Freelancers disponibles:');
      freelancersData.freelancers.slice(0, 3).forEach((f, i) => {
        console.log(`   ${i+1}. ID: ${f.user_id}, Nombre: ${f.full_name}`);
      });
      
      // Usar el primer freelancer para probar el mensaje
      const firstFreelancer = freelancersData.freelancers[0];
      console.log(`\n📤 Probando envío de mensaje a: ${firstFreelancer.full_name} (${firstFreelancer.user_id})`);
      
      const messageResponse = await fetch('http://localhost:3001/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipient_id: firstFreelancer.user_id,
          content: 'Mensaje de prueba - ' + new Date().toISOString()
        })
      });
      
      console.log('📋 Status mensaje:', messageResponse.status, messageResponse.statusText);
      const messageText = await messageResponse.text();
      console.log('📄 Response mensaje:', messageText);
      
      if (messageResponse.ok) {
        console.log('✅ ¡Mensaje enviado exitosamente!');
      } else {
        console.log('❌ Error al enviar mensaje');
      }
      
    } else {
      console.log('❌ No se encontraron freelancers');
      console.log('Data recibida:', freelancersData);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar la prueba
getFreelancersAndTestMessage();