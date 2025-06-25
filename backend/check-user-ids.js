const { supabase } = require('./config/supabase');
require('dotenv').config();

async function checkUserIds() {
  console.log('🔍 Verificando IDs de usuarios...');
  
  try {
    if (!supabase) {
      console.log('❌ Supabase no configurado, usando datos de pruebas anteriores');
      console.log('Según las pruebas anteriores:');
      console.log('Cliente: ID=0c78a7ac-15be-4fd5-8f54-3ae75c39c3fc, Nombre=EEUU');
      console.log('Freelancer: ID=cea48378-22a0-4166-a9b1-a67c5964ba26, Nombre=EEUU');
      console.log('');
      console.log('⚠️ El problema es que el endpoint busca por user_id, no por id');
      console.log('Necesitamos verificar si estos usuarios tienen user_id diferente');
      return;
    }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, user_id, full_name, user_type, email, created_at');
    
    if (error) {
      console.log('❌ Error:', error);
      return;
    }
    
    console.log('📊 Usuarios encontrados:');
    data.forEach(user => {
      console.log(`---`);
      console.log(`ID: ${user.id}`);
      console.log(`USER_ID: ${user.user_id}`);
      console.log(`Nombre: ${user.full_name}`);
      console.log(`Tipo: ${user.user_type}`);
      console.log(`Email: ${user.email || 'Sin email'}`);
    });
    
    console.log('');
    console.log('🔍 Análisis:');
    console.log('- El endpoint /api/messages busca por user_id');
    console.log('- Necesitamos usar el user_id correcto, no el id');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUserIds();