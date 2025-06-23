const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usar service role key para operaciones administrativas

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan las variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProjectClientIds() {
  try {
    console.log('🔧 Iniciando corrección de client_id en proyectos...');
    
    // 1. Obtener todos los proyectos
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, client_id, title');
    
    if (projectsError) {
      console.error('❌ Error obteniendo proyectos:', projectsError);
      return;
    }
    
    console.log(`📊 Encontrados ${projects.length} proyectos`);
    
    // 2. Obtener todos los perfiles de usuario
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, email, user_type');
    
    if (profilesError) {
      console.error('❌ Error obteniendo perfiles:', profilesError);
      return;
    }
    
    console.log(`👥 Encontrados ${profiles.length} perfiles de usuario`);
    
    // 3. Crear un mapa de email -> user_id para clientes
    const clientMap = new Map();
    profiles.forEach(profile => {
      if (profile.user_type === 'client' && profile.email) {
        clientMap.set(profile.email, profile.user_id);
      }
    });
    
    console.log(`🎯 Encontrados ${clientMap.size} clientes con email`);
    
    // 4. Para cada proyecto, intentar encontrar el client_id correcto
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const project of projects) {
      // Buscar el perfil que corresponde al client_id actual
      const currentProfile = profiles.find(p => p.user_id === project.client_id);
      
      if (currentProfile && currentProfile.email) {
        // El proyecto ya tiene un client_id válido
        console.log(`✅ Proyecto "${project.title}" ya tiene client_id correcto`);
        skippedCount++;
        continue;
      }
      
      // Si no encontramos un perfil válido, intentar buscar por email
      // Esto es más complejo porque necesitaríamos saber qué email creó el proyecto
      // Por ahora, vamos a reportar los proyectos problemáticos
      console.log(`⚠️  Proyecto "${project.title}" tiene client_id inválido: ${project.client_id}`);
      skippedCount++;
    }
    
    console.log('\n📈 Resumen:');
    console.log(`✅ Proyectos actualizados: ${updatedCount}`);
    console.log(`⏭️  Proyectos omitidos: ${skippedCount}`);
    
    // 5. Mostrar información adicional para debugging
    console.log('\n🔍 Información de debugging:');
    console.log('Clientes disponibles:');
    clientMap.forEach((userId, email) => {
      console.log(`  - ${email} -> ${userId}`);
    });
    
    console.log('\nProyectos con client_id problemáticos:');
    for (const project of projects) {
      const currentProfile = profiles.find(p => p.user_id === project.client_id);
      if (!currentProfile) {
        console.log(`  - "${project.title}" (ID: ${project.id}) -> client_id: ${project.client_id} (no encontrado)`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
  }
}

// Función para actualizar manualmente un proyecto específico
async function updateProjectClientId(projectId, newClientId) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update({ client_id: newClientId })
      .eq('id', projectId)
      .select();
    
    if (error) {
      console.error('❌ Error actualizando proyecto:', error);
      return false;
    }
    
    console.log('✅ Proyecto actualizado:', data[0]);
    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// Ejecutar el script
if (require.main === module) {
  fixProjectClientIds()
    .then(() => {
      console.log('\n🎉 Script completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = {
  fixProjectClientIds,
  updateProjectClientId
};