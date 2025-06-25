const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function createTestUsers() {
  try {
    console.log('=== CREANDO USUARIOS DE PRUEBA ===');
    
    // Verificar configuración de Supabase
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('❌ Supabase no está configurado');
      return;
    }
    
    // Crear cliente de Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('\n1. Creando usuarios de prueba...');
    
    // Usuarios de prueba que coinciden con los IDs usados en el frontend
    const testUsers = [
      {
        user_id: 'cea48378-22a0-4166-a9b1-a67c5964ba26',
        full_name: 'Freelancer EEUU',
        email: 'freelancer@test.com',
        user_type: 'freelancer',
        skills: ['JavaScript', 'React', 'Node.js'],
        hourly_rate: 25.00,
        bio: 'Desarrollador full-stack con experiencia en React y Node.js'
      },
      {
        user_id: '0c78a7ac-15be-4fd5-8f54-3ae75c39c3fc',
        full_name: 'Cliente EEUU',
        email: 'cliente@test.com',
        user_type: 'client',
        company: 'Test Company Inc.'
      },
      {
        user_id: 'e25f5da5-1c19-4a6a-bb61-d4a277c8d6e1',
        full_name: 'Usuario Test',
        email: 'test@example.com',
        user_type: 'client'
      }
    ];
    
    for (const user of testUsers) {
      console.log(`\n   Creando usuario: ${user.full_name} (${user.user_id})`);
      
      // Verificar si el usuario ya existe
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', user.user_id)
        .single();
      
      if (existingUser) {
        console.log(`   ⚠️  Usuario ya existe: ${user.full_name}`);
        continue;
      }
      
      // Crear el usuario
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(user)
        .select()
        .single();
      
      if (error) {
        console.error(`   ❌ Error creando ${user.full_name}:`, error.message);
      } else {
        console.log(`   ✅ Usuario creado: ${user.full_name}`);
      }
    }
    
    console.log('\n2. Verificando usuarios creados...');
    
    // Verificar que los usuarios fueron creados
    const { data: allUsers, error: fetchError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, email, user_type')
      .order('full_name');
    
    if (fetchError) {
      console.error('   Error al obtener usuarios:', fetchError);
    } else {
      console.log(`   Total de usuarios: ${allUsers.length}`);
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.full_name} (${user.user_type}) - ${user.user_id}`);
      });
    }
    
    console.log('\n✅ Proceso completado. Ahora puedes probar los mensajes directos.');
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

createTestUsers();