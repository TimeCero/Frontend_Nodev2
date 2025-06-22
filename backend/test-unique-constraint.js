require('dotenv').config();
const { supabase } = require('./config/supabase');
const crypto = require('crypto');

async function testUniqueConstraint() {
  try {
    const testEmail = 'test-duplicate@example.com';
    
    console.log('🧪 Probando restricción UNIQUE con email:', testEmail);
    
    // Limpiar email de prueba si existe
    await supabase
      .from('user_profiles')
      .delete()
      .eq('email', testEmail);
    
    console.log('🧹 Email de prueba limpiado');
    
    // Crear primer usuario
    const userId1 = crypto.randomUUID();
    const { error: error1 } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId1,
        email: testEmail,
        user_type: 'client',
        full_name: 'Test User 1'
      });
    
    if (error1) {
      console.log('❌ Error creando primer usuario:', error1);
      return;
    }
    
    console.log('✅ Primer usuario creado exitosamente');
    
    // Intentar crear segundo usuario con mismo email
    const userId2 = crypto.randomUUID();
    const { error: error2 } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId2,
        email: testEmail,
        user_type: 'freelancer',
        full_name: 'Test User 2'
      });
    
    if (error2) {
      console.log('✅ Restricción UNIQUE funcionando - Error esperado:', error2.message);
      console.log('Código de error:', error2.code);
    } else {
      console.log('❌ ERROR CRÍTICO: Se creó un usuario duplicado!');
    }
    
    // Limpiar
    await supabase
      .from('user_profiles')
      .delete()
      .eq('email', testEmail);
    
    console.log('🧹 Limpieza completada');
    
  } catch (err) {
    console.error('Error en test:', err);
  }
}

testUniqueConstraint();