const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugMyProjects() {
  try {
    console.log('🔍 Debugging endpoint /api/projects/my...');
    
    // Obtener todos los perfiles para simular diferentes usuarios
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, email');
    
    console.log('👤 Usuarios disponibles:', profiles);
    
    // Para cada usuario, simular la consulta del endpoint
    for (const profile of profiles) {
      console.log(`\n🔍 Simulando consulta para usuario: ${profile.email} (ID: ${profile.user_id})`);
      
      // Esta es exactamente la consulta que hace el endpoint /api/projects/my
      const { data: userProjects, error } = await supabase
        .from('projects')
        .select(`
          *,
          user_profiles!projects_client_id_fkey(
            user_id,
            email,
            full_name,
            avatar_url,
            user_type
          )
        `)
        .eq('client_id', profile.user_id);
      
      if (error) {
        console.error(`❌ Error para ${profile.email}:`, error);
      } else {
        console.log(`📋 Proyectos encontrados para ${profile.email}:`, userProjects?.length || 0);
        if (userProjects && userProjects.length > 0) {
          userProjects.forEach(project => {
            console.log(`  - "${project.title}" (ID: ${project.id})`);
          });
        } else {
          console.log('  (Sin proyectos)');
        }
      }
    }
    
    // También verificar si hay problemas con la foreign key
    console.log('\n🔗 Verificando foreign key constraint...');
    const { data: projectsWithProfiles, error: fkError } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        client_id,
        user_profiles!projects_client_id_fkey(
          user_id,
          email
        )
      `);
    
    if (fkError) {
      console.error('❌ Error con foreign key:', fkError);
    } else {
      console.log('✅ Foreign key funciona correctamente');
      projectsWithProfiles.forEach(project => {
        console.log(`  Proyecto "${project.title}" -> Usuario: ${project.user_profiles?.email || 'NO ENCONTRADO'}`);
      });
    }
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

debugMyProjects();