require('dotenv').config();
const { supabase, isSupabaseConfigured } = require('./config/supabase');

const fixDirectMessagesIssue = async () => {
  console.log('🔧 Analizando y solucionando problema de mensajes directos...');
  
  if (!isSupabaseConfigured || !supabase) {
    console.error('❌ Supabase no está configurado');
    return;
  }
  
  try {
    // Mostrar la estructura del problema
    console.log('\n📊 PROBLEMA IDENTIFICADO:');
    console.log('   - user_profiles tiene: id (PK) y user_id (UNIQUE)');
    console.log('   - direct_messages referencia: user_profiles.user_id');
    console.log('   - Frontend usa: params.id (que es user_profiles.id)');
    console.log('   - SOLUCIÓN: Frontend debe usar user_profiles.user_id');
    
    // Obtener datos de ejemplo
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('id, user_id, full_name, email, user_type')
      .eq('user_type', 'freelancer')
      .limit(3);
    
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    
    console.log('\n📋 DATOS DE EJEMPLO:');
    profiles.forEach((profile, index) => {
      console.log(`\n  ${index + 1}. ${profile.full_name}:`);
      console.log(`     id (PK): ${profile.id}`);
      console.log(`     user_id: ${profile.user_id}`);
      console.log(`     ❌ Frontend usa: ${profile.id} (INCORRECTO)`);
      console.log(`     ✅ Debería usar: ${profile.user_id} (CORRECTO)`);
    });
    
    // Probar envío de mensaje con user_id correcto
    if (profiles.length >= 2) {
      console.log('\n🧪 PRUEBA CON user_id CORRECTO:');
      const sender = profiles[0];
      const recipient = profiles[1];
      
      console.log(`   Enviando mensaje de ${sender.full_name} a ${recipient.full_name}`);
      console.log(`   sender_id: ${sender.user_id}`);
      console.log(`   recipient_id: ${recipient.user_id}`);
      
      // Simular inserción en direct_messages
      const { data: message, error: messageError } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: sender.user_id,
          recipient_id: recipient.user_id,
          content: 'Mensaje de prueba - problema solucionado'
        })
        .select()
        .single();
      
      if (messageError) {
        console.error('❌ Error al insertar mensaje:', messageError.message);
      } else {
        console.log('✅ Mensaje insertado correctamente:', message.id);
        
        // Verificar que se guardó
        const { data: savedMessage, error: fetchError } = await supabase
          .from('direct_messages')
          .select('*')
          .eq('id', message.id)
          .single();
        
        if (!fetchError && savedMessage) {
          console.log('✅ Mensaje verificado en base de datos');
          console.log(`   ID: ${savedMessage.id}`);
          console.log(`   Contenido: ${savedMessage.content}`);
          console.log(`   Fecha: ${savedMessage.created_at}`);
        }
      }
    }
    
    console.log('\n🔧 SOLUCIONES NECESARIAS:');
    console.log('   1. Modificar frontend para usar user_id en lugar de id');
    console.log('   2. Actualizar endpoint /api/freelancers/:id/profile si es necesario');
    console.log('   3. Verificar que todas las referencias usen user_id consistentemente');
    
  } catch (err) {
    console.error('❌ Error general:', err.message);
  }
};

fixDirectMessagesIssue();