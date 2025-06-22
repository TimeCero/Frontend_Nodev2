require('dotenv').config();
const { supabase } = require('./config/supabase');
const crypto = require('crypto');

async function testCrossProviderDuplicate() {
  try {
    const realEmail = 'test-cross@example.com';
    
    console.log('🧪 Probando duplicado entre proveedores OAuth');
    
    // Limpiar email de prueba
    await supabase
      .from('user_profiles')
      .delete()
      .eq('email', realEmail);
    
    console.log('🧹 Email de prueba limpiado');
    
    // Simular usuario de Google OAuth
    console.log('\n1️⃣ Simulando login con Google...');
    const googleUserId = crypto.randomUUID();
    const { error: googleError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: googleUserId,
        email: realEmail,
        user_type: 'client',
        full_name: 'Usuario Google'
      });
    
    if (googleError) {
      console.log('❌ Error creando usuario Google:', googleError);
      return;
    }
    
    console.log('✅ Usuario Google creado exitosamente');
    
    // Simular usuario de GitHub OAuth con mismo email
    console.log('\n2️⃣ Simulando login con GitHub usando mismo email...');
    const githubUserId = crypto.randomUUID();
    const { error: githubError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: githubUserId,
        email: realEmail, // Mismo email!
        user_type: 'freelancer',
        full_name: 'Usuario GitHub',
        github_username: 'testuser'
      });
    
    if (githubError) {
      console.log('✅ Restricción UNIQUE funcionando - Error esperado:', githubError.message);
      console.log('Código de error:', githubError.code);
    } else {
      console.log('❌ ERROR CRÍTICO: Se creó un usuario duplicado entre proveedores!');
    }
    
    // Verificar cuántos usuarios existen con ese email
    const { data: users, error: countError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', realEmail);
    
    if (!countError) {
      console.log(`\n📊 Usuarios encontrados con email ${realEmail}:`, users.length);
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.user_type} - ${user.full_name} (${user.user_id})`);
      });
    }
    
    // Limpiar
    await supabase
      .from('user_profiles')
      .delete()
      .eq('email', realEmail);
    
    console.log('\n🧹 Limpieza completada');
    
  } catch (err) {
    console.error('Error en test:', err);
  }
}

testCrossProviderDuplicate();