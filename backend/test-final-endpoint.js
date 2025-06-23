const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFinalEndpoint() {
  try {
    console.log('🧪 Probando el endpoint /api/projects/my corregido...');
    
    // Obtener usuarios de la base de datos
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, email, user_type');
    
    console.log('👤 Usuarios disponibles:', profiles);
    
    // Para cada usuario, simular la consulta corregida del endpoint
    for (const profile of profiles) {
      console.log(`\n🔍 Probando para usuario: ${profile.email} (ID: ${profile.user_id})`);
      
      // Esta es la consulta CORREGIDA del endpoint /api/projects/my
      const { data: userProjects, error } = await supabase
        .from('projects')
        .select(`
          *,
          user_profiles!projects_client_id_fkey(
            user_id,
            email,
            full_name,
            company_name,
            avatar_url,
            location,
            bio,
            industry,
            user_type
          )
        `)
        .eq('client_id', profile.user_id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error(`❌ Error para ${profile.email}:`, error);
      } else {
        console.log(`📋 Proyectos encontrados para ${profile.email}: ${userProjects?.length || 0}`);
        if (userProjects && userProjects.length > 0) {
          userProjects.forEach(project => {
            console.log(`  - "${project.title}" (ID: ${project.id})`);
            console.log(`    Cliente: ${project.user_profiles?.email || 'N/A'}`);
          });
        } else {
          console.log('  (Sin proyectos)');
        }
      }
    }
    
    console.log('\n✅ Prueba completada. El endpoint debería funcionar correctamente ahora.');
    console.log('\n📝 Pasos siguientes:');
    console.log('1. Reinicia el servidor backend si no se ha reiniciado automáticamente');
    console.log('2. Prueba el endpoint desde el frontend');
    console.log('3. Verifica que "My Projects" muestre los proyectos correctamente');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testFinalEndpoint();