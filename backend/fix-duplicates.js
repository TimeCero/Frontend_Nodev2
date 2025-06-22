const { supabase } = require('./config/supabase');

async function fixDuplicates() {
  try {
    console.log('🧹 Eliminando duplicados...');
    
    // Obtener todos los perfiles ordenados por email y fecha de creación
    const { data: allProfiles, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('email')
      .order('created_at');
    
    if (fetchError) {
      console.error('Error obteniendo perfiles:', fetchError);
      return;
    }
    
    console.log(`Total perfiles: ${allProfiles.length}`);
    
    // Agrupar por email y eliminar duplicados
    const emailMap = new Map();
    const toDelete = [];
    
    for (const profile of allProfiles) {
      if (profile.email) {
        if (emailMap.has(profile.email)) {
          // Es un duplicado, marcarlo para eliminar
          toDelete.push(profile.id);
          console.log(`🗑️ Marcando para eliminar: ${profile.id} (${profile.email})`);
        } else {
          // Es el primero con este email, mantenerlo
          emailMap.set(profile.email, profile.id);
          console.log(`✅ Manteniendo: ${profile.id} (${profile.email})`);
        }
      }
    }
    
    console.log(`Duplicados a eliminar: ${toDelete.length}`);
    
    // Eliminar duplicados uno por uno
    for (const id of toDelete) {
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        console.error(`Error eliminando ${id}:`, deleteError);
      } else {
        console.log(`✅ Eliminado: ${id}`);
      }
    }
    
    console.log('🎉 Limpieza completada');
    
    // Verificar resultado
    const { data: finalProfiles } = await supabase
      .from('user_profiles')
      .select('email')
      .not('email', 'is', null);
    
    const emails = finalProfiles.map(p => p.email);
    const uniqueEmails = [...new Set(emails)];
    
    console.log(`Perfiles finales: ${finalProfiles.length}`);
    console.log(`Emails únicos: ${uniqueEmails.length}`);
    
    if (finalProfiles.length === uniqueEmails.length) {
      console.log('✅ No hay duplicados');
    } else {
      console.log('⚠️ Aún hay duplicados');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixDuplicates().then(() => {
  console.log('Script completado');
  process.exit(0);
}).catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});