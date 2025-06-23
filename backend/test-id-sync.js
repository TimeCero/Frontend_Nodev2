const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan las variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testIdSynchronization() {
  try {
    console.log('🧪 Iniciando prueba de sincronización de IDs...');
    
    // 1. Simular un usuario de Passport (como se genera en passport.js)
    const mockPassportUser = {
      id: crypto.randomUUID(), // Este es el ID que genera Passport
      email: `test_${Date.now()}@example.com`,
      name: 'Usuario de Prueba',
      avatar: 'https://example.com/avatar.jpg',
      provider: 'google',
      userType: 'client'
    };
    
    console.log('👤 Usuario simulado de Passport:');
    console.log(`   ID: ${mockPassportUser.id}`);
    console.log(`   Email: ${mockPassportUser.email}`);
    
    // 2. Simular la creación del perfil en Supabase (como en auth.js modificado)
    const { data: profileResult, error: profileError } = await supabase
      .rpc('safe_upsert_user_profile', {
        p_email: mockPassportUser.email,
        p_user_id: mockPassportUser.id, // Usar el ID de Passport
        p_user_type: mockPassportUser.userType,
        p_avatar_url: mockPassportUser.avatar,
        p_github_username: null
      });
    
    if (profileError) {
      console.error('❌ Error creando perfil:', profileError);
      return;
    }
    
    console.log('✅ Perfil creado en Supabase');
    
    // 3. Verificar que el perfil se creó con el ID correcto
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', mockPassportUser.email)
      .single();
    
    if (fetchError) {
      console.error('❌ Error obteniendo perfil:', fetchError);
      return;
    }
    
    console.log('🔍 Perfil obtenido de la base de datos:');
    console.log(`   user_id: ${profile.user_id}`);
    console.log(`   email: ${profile.email}`);
    console.log(`   user_type: ${profile.user_type}`);
    
    // 4. Verificar que los IDs coinciden
    if (profile.user_id === mockPassportUser.id) {
      console.log('✅ ¡ÉXITO! Los IDs coinciden perfectamente');
      console.log(`   Passport ID: ${mockPassportUser.id}`);
      console.log(`   Supabase user_id: ${profile.user_id}`);
    } else {
      console.log('❌ ERROR: Los IDs no coinciden');
      console.log(`   Passport ID: ${mockPassportUser.id}`);
      console.log(`   Supabase user_id: ${profile.user_id}`);
    }
    
    // 5. Simular la creación de un proyecto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        client_id: profile.user_id, // Usar el user_id del perfil
        title: 'Proyecto de Prueba',
        description: 'Este es un proyecto de prueba para verificar la sincronización de IDs',
        category: 'desarrollo-web',
        budget_min: 500,
        budget_max: 1000,
        skills_required: ['javascript', 'react']
      })
      .select()
      .single();
    
    if (projectError) {
      console.error('❌ Error creando proyecto:', projectError);
      return;
    }
    
    console.log('✅ Proyecto creado exitosamente');
    console.log(`   ID del proyecto: ${project.id}`);
    console.log(`   client_id: ${project.client_id}`);
    
    // 6. Simular la consulta de proyectos (como en /api/projects/my)
    const { data: userProjects, error: queryError } = await supabase
      .from('projects')
      .select(`
        *,
        user_profiles!projects_client_id_fkey (
          email,
          full_name,
          user_type
        )
      `)
      .eq('client_id', mockPassportUser.id); // Usar el ID de Passport para la consulta
    
    if (queryError) {
      console.error('❌ Error consultando proyectos:', queryError);
      return;
    }
    
    console.log('🔍 Proyectos encontrados para el usuario:');
    console.log(`   Cantidad: ${userProjects.length}`);
    
    if (userProjects.length > 0) {
      console.log('✅ ¡ÉXITO! El proyecto se encontró correctamente');
      console.log(`   Título: ${userProjects[0].title}`);
      console.log(`   client_id del proyecto: ${userProjects[0].client_id}`);
      console.log(`   ID buscado: ${mockPassportUser.id}`);
    } else {
      console.log('❌ ERROR: No se encontraron proyectos para el usuario');
    }
    
    // 7. Limpiar datos de prueba
    await supabase.from('projects').delete().eq('id', project.id);
    await supabase.from('user_profiles').delete().eq('user_id', profile.user_id);
    console.log('🧹 Datos de prueba eliminados');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

// Ejecutar la prueba
if (require.main === module) {
  testIdSynchronization()
    .then(() => {
      console.log('\n🎉 Prueba completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = {
  testIdSynchronization
};