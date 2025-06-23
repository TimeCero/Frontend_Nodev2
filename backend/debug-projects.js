const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debug() {
  try {
    console.log('🔍 Debugging proyectos...');
    
    // Obtener proyectos
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, client_id');
    
    if (projectsError) {
      console.error('Error obteniendo proyectos:', projectsError);
    } else {
      console.log('📋 Proyectos en DB:', projects);
    }
    
    // Obtener perfiles de usuario
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, email, user_type');
    
    if (profilesError) {
      console.error('Error obteniendo perfiles:', profilesError);
    } else {
      console.log('👤 Perfiles en DB:', profiles);
    }
    
    // Comparar IDs
    if (projects && profiles) {
      console.log('\n🔗 Análisis de IDs:');
      projects.forEach(project => {
        const matchingProfile = profiles.find(profile => profile.user_id === project.client_id);
        console.log(`Proyecto "${project.title}" (client_id: ${project.client_id}) -> ${matchingProfile ? '✅ Perfil encontrado' : '❌ Sin perfil coincidente'}`);
      });
    }
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

debug();