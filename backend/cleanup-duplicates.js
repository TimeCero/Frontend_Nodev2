const { supabase } = require('./config/supabase');

async function cleanupDuplicateUsers() {
  try {
    console.log('🔍 Buscando usuarios duplicados...');
    
    // Obtener todos los perfiles
    const { data: allProfiles, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (fetchError) {
      console.error('❌ Error al obtener perfiles:', fetchError);
      return;
    }
    
    console.log(`📊 Total de perfiles encontrados: ${allProfiles.length}`);
    
    // Agrupar por email
    const emailGroups = {};
    allProfiles.forEach(profile => {
      if (profile.email) {
        if (!emailGroups[profile.email]) {
          emailGroups[profile.email] = [];
        }
        emailGroups[profile.email].push(profile);
      }
    });
    
    // Encontrar duplicados
    const duplicateEmails = Object.keys(emailGroups).filter(email => emailGroups[email].length > 1);
    
    console.log(`🔍 Emails duplicados encontrados: ${duplicateEmails.length}`);
    
    for (const email of duplicateEmails) {
      const profiles = emailGroups[email];
      console.log(`\n📧 Procesando email: ${email} (${profiles.length} registros)`);
      
      // Ordenar por fecha de creación (mantener el más antiguo)
      profiles.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      
      const keepProfile = profiles[0]; // Mantener el más antiguo
      const duplicatesToDelete = profiles.slice(1); // Eliminar el resto
      
      console.log(`✅ Manteniendo perfil: ${keepProfile.id} (creado: ${keepProfile.created_at})`);
      
      // Eliminar duplicados
      for (const duplicate of duplicatesToDelete) {
        console.log(`🗑️ Eliminando duplicado: ${duplicate.id} (creado: ${duplicate.created_at})`);
        
        const { error: deleteError } = await supabase
          .from('user_profiles')
          .delete()
          .eq('id', duplicate.id);
        
        if (deleteError) {
          console.error(`❌ Error al eliminar ${duplicate.id}:`, deleteError);
        } else {
          console.log(`✅ Eliminado exitosamente: ${duplicate.id}`);
        }
      }
    }
    
    console.log('\n🎉 Limpieza de duplicados completada');
    
    // Verificar resultado final
    const { data: finalProfiles, error: finalError } = await supabase
      .from('user_profiles')
      .select('email')
      .not('email', 'is', null);
    
    if (!finalError) {
      const finalEmails = finalProfiles.map(p => p.email);
      const uniqueEmails = [...new Set(finalEmails)];
      console.log(`📊 Perfiles finales: ${finalProfiles.length}`);
      console.log(`📊 Emails únicos: ${uniqueEmails.length}`);
      
      if (finalProfiles.length === uniqueEmails.length) {
        console.log('✅ No hay duplicados restantes');
      } else {
        console.log('⚠️ Aún hay duplicados restantes');
      }
    }
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  }
}

// Ejecutar el script
cleanupDuplicateUsers().then(() => {
  console.log('🏁 Script completado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});