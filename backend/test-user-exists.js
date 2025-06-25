// Script para verificar si el usuario existe en user_profiles después del SQL
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno SUPABASE_URL o SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserExists() {
  try {
    console.log('🔍 Verificando si el usuario existe en user_profiles...');
    
    // Verificar si el usuario específico existe
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', '7f5ad001-cc80-4914-b7b2-7fba5caa4b02')
      .single();
    
    if (userError) {
      console.log('❌ Usuario NO encontrado en user_profiles:', userError.message);
    } else {
      console.log('✅ Usuario encontrado en user_profiles:');
      console.log(JSON.stringify(user, null, 2));
    }
    
    // Mostrar todos los freelancers disponibles
    console.log('\n📋 Todos los freelancers en user_profiles:');
    const { data: freelancers, error: freelancersError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, user_type, email')
      .eq('user_type', 'freelancer');
    
    if (freelancersError) {
      console.error('❌ Error obteniendo freelancers:', freelancersError);
    } else {
      console.log(`Total freelancers: ${freelancers.length}`);
      freelancers.forEach((freelancer, index) => {
        console.log(`${index + 1}. ID: ${freelancer.user_id}, Nombre: ${freelancer.full_name}, Email: ${freelancer.email}`);
      });
    }
    
    // Probar el endpoint /api/messages con un usuario válido
    if (freelancers && freelancers.length > 0) {
      console.log('\n🧪 Probando endpoint /api/messages...');
      const testUserId = freelancers[0].user_id;
      
      const response = await fetch('http://localhost:3001/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3ZjVhZDAwMS1jYzgwLTQ5MTQtYjdiMi03ZmJhNWNhYTRiMDIiLCJpYXQiOjE3MzQ5OTI4NzIsImV4cCI6MTczNTA3OTI3Mn0.Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7E'
        },
        body: JSON.stringify({
          recipient_id: testUserId,
          content: 'Mensaje de prueba después del fix SQL'
        })
      });
      
      console.log(`Status: ${response.status}`);
      const responseData = await response.text();
      console.log('Response:', responseData);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testUserExists();