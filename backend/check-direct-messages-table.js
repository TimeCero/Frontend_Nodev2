require('dotenv').config();
const { supabase, isSupabaseConfigured } = require('./config/supabase');

const checkDirectMessagesTable = async () => {
  console.log('🔍 Verificando tabla direct_messages...');
  
  if (!isSupabaseConfigured || !supabase) {
    console.error('❌ Supabase no está configurado');
    return;
  }
  
  try {
    // Verificar si la tabla existe y obtener algunos registros
    console.log('📊 Consultando tabla direct_messages...');
    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Error al consultar direct_messages:', error.message);
      console.error('🔧 Detalles del error:', error);
    } else {
      console.log('✅ Tabla direct_messages existe');
      console.log('📈 Registros encontrados:', data.length);
      if (data.length > 0) {
        console.log('📋 Datos de ejemplo:');
        data.forEach((msg, index) => {
          console.log(`  ${index + 1}. ID: ${msg.id}`);
          console.log(`     Sender: ${msg.sender_id}`);
          console.log(`     Recipient: ${msg.recipient_id}`);
          console.log(`     Content: ${msg.content}`);
          console.log(`     Created: ${msg.created_at}`);
          console.log('     ---');
        });
      } else {
        console.log('📭 No hay mensajes en la tabla');
      }
    }
    
    // Verificar también la tabla user_profiles para ver usuarios disponibles
    console.log('\n👥 Verificando usuarios en user_profiles...');
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, email')
      .limit(10);
    
    if (usersError) {
      console.error('❌ Error al consultar user_profiles:', usersError.message);
    } else {
      console.log('✅ Usuarios encontrados:', users.length);
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.user_id}`);
        console.log(`     Nombre: ${user.full_name || 'Sin nombre'}`);
        console.log(`     Email: ${user.email || 'Sin email'}`);
        console.log('     ---');
      });
    }
    
  } catch (err) {
    console.error('❌ Error general:', err.message);
    console.error('🔧 Stack trace:', err.stack);
  }
};

checkDirectMessagesTable();