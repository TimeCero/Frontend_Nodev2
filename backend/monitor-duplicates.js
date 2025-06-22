require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function monitorDuplicates() {
  console.log('🔍 Monitoreando duplicados en la base de datos...');
  
  try {
    // 1. Verificar duplicados por email
    console.log('\n=== DUPLICADOS POR EMAIL ===');
    const { data: emailDuplicates, error: emailError } = await supabase
      .rpc('check_email_duplicates');
    
    if (emailError) {
      // Si la función no existe, usar query manual
      const { data: manualEmailCheck, error: manualError } = await supabase
        .from('user_profiles')
        .select('email, user_id, full_name, created_at')
        .not('email', 'is', null)
        .order('email', { ascending: true });
      
      if (manualError) {
        console.error('❌ Error verificando duplicados por email:', manualError);
        return;
      }
      
      // Agrupar por email manualmente
      const emailGroups = {};
      manualEmailCheck.forEach(profile => {
        if (!emailGroups[profile.email]) {
          emailGroups[profile.email] = [];
        }
        emailGroups[profile.email].push(profile);
      });
      
      const duplicateEmails = Object.entries(emailGroups).filter(([email, profiles]) => profiles.length > 1);
      
      if (duplicateEmails.length === 0) {
        console.log('✅ No se encontraron duplicados por email');
      } else {
        console.log(`🚨 Se encontraron ${duplicateEmails.length} emails duplicados:`);
        duplicateEmails.forEach(([email, profiles]) => {
          console.log(`\n📧 Email: ${email} (${profiles.length} perfiles)`);
          profiles.forEach((profile, index) => {
            console.log(`  ${index + 1}. user_id: ${profile.user_id}`);
            console.log(`     nombre: ${profile.full_name || 'Sin nombre'}`);
            console.log(`     creado: ${profile.created_at}`);
          });
        });
      }
    }
    
    // 2. Verificar duplicados por user_id
    console.log('\n=== DUPLICADOS POR USER_ID ===');
    const { data: userIdCheck, error: userIdError } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name, created_at')
      .order('user_id', { ascending: true });
    
    if (userIdError) {
      console.error('❌ Error verificando duplicados por user_id:', userIdError);
      return;
    }
    
    // Agrupar por user_id
    const userIdGroups = {};
    userIdCheck.forEach(profile => {
      if (!userIdGroups[profile.user_id]) {
        userIdGroups[profile.user_id] = [];
      }
      userIdGroups[profile.user_id].push(profile);
    });
    
    const duplicateUserIds = Object.entries(userIdGroups).filter(([userId, profiles]) => profiles.length > 1);
    
    if (duplicateUserIds.length === 0) {
      console.log('✅ No se encontraron duplicados por user_id');
    } else {
      console.log(`🚨 Se encontraron ${duplicateUserIds.length} user_ids duplicados:`);
      duplicateUserIds.forEach(([userId, profiles]) => {
        console.log(`\n🆔 User ID: ${userId} (${profiles.length} perfiles)`);
        profiles.forEach((profile, index) => {
          console.log(`  ${index + 1}. email: ${profile.email || 'Sin email'}`);
          console.log(`     nombre: ${profile.full_name || 'Sin nombre'}`);
          console.log(`     creado: ${profile.created_at}`);
        });
      });
    }
    
    // 3. Estadísticas generales
    console.log('\n=== ESTADÍSTICAS GENERALES ===');
    const { data: stats, error: statsError } = await supabase
      .from('user_profiles')
      .select('user_type, email, user_id');
    
    if (statsError) {
      console.error('❌ Error obteniendo estadísticas:', statsError);
      return;
    }
    
    const totalProfiles = stats.length;
    const uniqueEmails = new Set(stats.filter(p => p.email).map(p => p.email)).size;
    const uniqueUserIds = new Set(stats.map(p => p.user_id)).size;
    const profilesWithEmail = stats.filter(p => p.email).length;
    const profilesWithoutEmail = stats.filter(p => !p.email).length;
    
    console.log(`📊 Total de perfiles: ${totalProfiles}`);
    console.log(`📧 Perfiles con email: ${profilesWithEmail}`);
    console.log(`🚫 Perfiles sin email: ${profilesWithoutEmail}`);
    console.log(`🔑 Emails únicos: ${uniqueEmails}`);
    console.log(`🆔 User IDs únicos: ${uniqueUserIds}`);
    
    // Verificar integridad
    if (totalProfiles === uniqueUserIds && profilesWithEmail === uniqueEmails) {
      console.log('\n✅ INTEGRIDAD CORRECTA: No hay duplicados detectados');
    } else {
      console.log('\n🚨 PROBLEMA DE INTEGRIDAD DETECTADO:');
      if (totalProfiles !== uniqueUserIds) {
        console.log(`   - Duplicados por user_id: ${totalProfiles - uniqueUserIds}`);
      }
      if (profilesWithEmail !== uniqueEmails) {
        console.log(`   - Duplicados por email: ${profilesWithEmail - uniqueEmails}`);
      }
    }
    
    // 4. Perfiles por tipo de usuario
    console.log('\n=== DISTRIBUCIÓN POR TIPO ===');
    const userTypes = {};
    stats.forEach(profile => {
      userTypes[profile.user_type] = (userTypes[profile.user_type] || 0) + 1;
    });
    
    Object.entries(userTypes).forEach(([type, count]) => {
      console.log(`${type}: ${count} perfiles`);
    });
    
  } catch (error) {
    console.error('❌ Error durante el monitoreo:', error);
  }
}

// Ejecutar monitoreo
monitorDuplicates();