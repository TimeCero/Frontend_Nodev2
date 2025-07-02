require('dotenv').config();

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU1ZGEzMWI3LTkzNTgtNDkzOS05ZGVkLWI0MGMyMGM0YWMyYiIsImVtYWlsIjoiYWRyaWFuby5hcXAwMEBnbWFpbC5jb20iLCJ1c2VyVHlwZSI6ImNsaWVudCIsInByb3ZpZGVyIjoiZ29vZ2xlIiwiaWF0IjoxNzUwODQxNjYxLCJleHAiOjE3NTE0NDY0NjF9.H9dGBNATXc6PbniqbwSm0q04mb-74OVxMYLG-UJTIak';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

async function checkUserProfiles() {
  try {
    console.log('🔍 Verificando tabla user_profiles...');
    
    const response = await fetch(`${BACKEND_URL}/api/user-profiles`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📋 Status user_profiles:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ User profiles encontrados:', data.length || 0);
      if (data.length > 0) {
        data.forEach(user => {
          console.log(`   - ${user.user_id}: ${user.full_name} (${user.user_type})`);
        });
      }
    } else {
      console.log('❌ No se pudo acceder a user_profiles');
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
    
    const freelancerId = '7f5ad001-cc80-4914-b7b2-7fba5caa4b02';
    console.log(`\n🔍 Verificando si el freelancer ${freelancerId} existe en user_profiles...`);
    
    const userResponse = await fetch(`${BACKEND_URL}/api/user-profiles/${freelancerId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📋 Status verificación freelancer:', userResponse.status);
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✅ Freelancer encontrado en user_profiles:', userData);
    } else {
      console.log('❌ Freelancer NO encontrado en user_profiles');
      const errorText = await userResponse.text();
      console.log('Error:', errorText);
      
      console.log('\n💡 SOLUCIÓN: El freelancer existe en la tabla freelancers pero NO en user_profiles.');
      console.log('   Esto explica por qué el endpoint de mensajes falla.');
      console.log('   Necesitamos crear el registro en user_profiles o modificar el endpoint.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUserProfiles();
