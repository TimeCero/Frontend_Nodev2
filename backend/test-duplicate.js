require('dotenv').config();
const { supabase } = require('./config/supabase');
const crypto = require('crypto');

async function testDuplicateEmail() {
  try {
    const testEmail = 'adriano.aqp01@gmail.com'; // Email que ya existe
    
    console.log('🧪 Probando crear usuario duplicado con email:', testEmail);
    
    // Simular el flujo OAuth - verificar si existe
    const { data: existingProfile, error: getProfileError } = await supabase
      .from('user_profiles')
      .select('user_id, email')
      .eq('email', testEmail)
      .single();
    
    console.log('Resultado de búsqueda:', { existingProfile, getProfileError });
    
    if (existingProfile && !getProfileError) {
      console.log('✅ Usuario ya existe, no debería crear duplicado');
      return;
    } else if (getProfileError && getProfileError.code === 'PGRST116') {
      console.log('❌ Error: el código dice que no existe, pero debería existir');
      
      // Intentar crear duplicado
      const tempUserId = crypto.randomUUID();
      
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: tempUserId,
          email: testEmail,
          user_type: 'client',
          full_name: 'Test Duplicate User'
        });
      
      if (profileError) {
        console.log('✅ Error esperado al crear duplicado:', profileError);
        if (profileError.code === '23505') {
          console.log('✅ Restricción UNIQUE funcionando correctamente');
        }
      } else {
        console.log('❌ ERROR: Se creó un usuario duplicado!');
      }
    } else {
      console.log('Error inesperado:', getProfileError);
    }
    
  } catch (err) {
    console.error('Error en test:', err);
  }
}

testDuplicateEmail();