const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

// Importar el Map de usuarios de passport
const { getAllUsers, users } = require('./config/passport');

async function syncUsersToPassport() {
  try {
    console.log('=== SINCRONIZANDO USUARIOS DE SUPABASE A PASSPORT ===');
    
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
    
    console.log('\n1. Obteniendo usuarios de Supabase...');
    
    const { data: supabaseUsers, error } = await supabase
      .from('user_profiles')
      .select('*');
    
    if (error) {
      console.error('Error obteniendo usuarios de Supabase:', error);
      return;
    }
    
    console.log(`   Usuarios encontrados en Supabase: ${supabaseUsers.length}`);
    
    // Obtener usuarios actuales de passport
    const passportUsers = getAllUsers();
    console.log(`   Usuarios actuales en Passport: ${passportUsers.length}`);
    
    console.log('\n2. Sincronizando usuarios...');
    
    // Acceder directamente al Map de usuarios
    const usersMap = users;
    
    for (const supabaseUser of supabaseUsers) {
      // Verificar si el usuario ya existe en passport
      const existsInPassport = passportUsers.find(u => u.id === supabaseUser.user_id);
      
      if (!existsInPassport) {
        // Crear usuario compatible con passport
        const passportUser = {
          id: supabaseUser.user_id,
          email: supabaseUser.email || `${supabaseUser.full_name.toLowerCase().replace(/\s+/g, '')}@test.com`,
          name: supabaseUser.full_name,
          avatar: supabaseUser.avatar_url || null,
          provider: 'supabase',
          userType: supabaseUser.user_type || 'client',
          createdAt: new Date().toISOString(),
          // Campos adicionales de Supabase
          skills: supabaseUser.skills,
          hourly_rate: supabaseUser.hourly_rate,
          bio: supabaseUser.bio,
          company: supabaseUser.company
        };
        
        // Agregar al Map de usuarios
        usersMap.set(supabaseUser.user_id, passportUser);
        
        console.log(`   ✅ Usuario sincronizado: ${supabaseUser.full_name} (${supabaseUser.user_id})`);
      } else {
        console.log(`   ⚠️  Usuario ya existe: ${supabaseUser.full_name}`);
      }
    }
    
    console.log('\n3. Verificando sincronización...');
    
    const updatedPassportUsers = getAllUsers();
    console.log(`   Total usuarios en Passport después de sync: ${updatedPassportUsers.length}`);
    
    // Mostrar todos los usuarios
    updatedPassportUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.userType}) - ${user.id} [${user.provider}]`);
    });
    
    console.log('\n✅ SINCRONIZACIÓN COMPLETADA');
    console.log('\n📝 NOTA: Esta sincronización es temporal y se perderá al reiniciar el servidor.');
    console.log('   Para una solución permanente, considera modificar el middleware de autenticación.');
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

syncUsersToPassport();