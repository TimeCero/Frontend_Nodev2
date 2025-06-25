// Script para verificar las nuevas cuentas creadas y diagnosticar el error 404
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno SUPABASE_URL o SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNewAccounts() {
  try {
    console.log('🔍 Verificando todas las cuentas en user_profiles...');
    
    // Obtener todos los usuarios en user_profiles
    const { data: allUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
      return;
    }
    
    console.log(`\n📊 Total usuarios en user_profiles: ${allUsers.length}`);
    console.log('\n👥 Lista de todos los usuarios:');
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.user_id}`);
      console.log(`   Tipo: ${user.user_type}`);
      console.log(`   Nombre: ${user.full_name || 'Sin nombre'}`);
      console.log(`   Email: ${user.email || 'Sin email'}`);
      console.log(`   Creado: ${user.created_at}`);
      console.log('   ---');
    });
    
    // Separar por tipo
    const freelancers = allUsers.filter(u => u.user_type === 'freelancer');
    const clients = allUsers.filter(u => u.user_type === 'client');
    
    console.log(`\n📋 Freelancers: ${freelancers.length}`);
    console.log(`📋 Clientes: ${clients.length}`);
    
    // Probar el endpoint /api/freelancers
    console.log('\n🧪 Probando endpoint /api/freelancers...');
    try {
      const freelancersResponse = await fetch('http://localhost:3001/api/freelancers');
      console.log(`Status: ${freelancersResponse.status}`);
      
      if (freelancersResponse.ok) {
        const freelancersData = await freelancersResponse.json();
        console.log(`Freelancers desde API: ${freelancersData.freelancers?.length || 0}`);
        
        if (freelancersData.freelancers && freelancersData.freelancers.length > 0) {
          console.log('\n🎯 Probando endpoint /api/messages con el primer freelancer...');
          const firstFreelancer = freelancersData.freelancers[0];
          console.log(`Usando freelancer: ${firstFreelancer.full_name} (ID: ${firstFreelancer.id})`);
          
          // Probar con un token simple (sin autenticación real)
          const messageResponse = await fetch('http://localhost:3001/api/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              recipient_id: firstFreelancer.id,
              content: 'Mensaje de prueba con nueva cuenta'
            })
          });
          
          console.log(`Status: ${messageResponse.status}`);
          const messageData = await messageResponse.text();
          console.log('Response:', messageData);
          
          if (messageResponse.status === 401) {
            console.log('\n💡 El error es de autenticación, no de usuario no encontrado.');
            console.log('   Esto significa que el usuario SÍ existe en la base de datos.');
          }
        }
      } else {
        const errorData = await freelancersResponse.text();
        console.log('Error:', errorData);
      }
    } catch (fetchError) {
      console.log('❌ Error conectando al servidor:', fetchError.message);
      console.log('   Asegúrate de que el servidor backend esté corriendo en puerto 3001');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testNewAccounts();