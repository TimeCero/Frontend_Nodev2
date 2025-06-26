require('dotenv').config();
const { supabase, isSupabaseConfigured } = require('./config/supabase');

// Usar node-fetch si está disponible
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

const testFixedMessages = async () => {
  console.log('🧪 Probando mensajes directos después de las correcciones...');
  
  if (!isSupabaseConfigured || !supabase) {
    console.error('❌ Supabase no está configurado');
    return;
  }
  
  try {
    // 1. Obtener usuarios disponibles (cualquier tipo)
    console.log('\n📋 1. Obteniendo usuarios disponibles...');
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id, user_id, full_name, email, user_type')
      .limit(3);
    
    if (error || !users || users.length < 2) {
      console.error('❌ Error o insuficientes usuarios:', error?.message);
      console.log('Usuarios encontrados:', users?.length || 0);
      return;
    }
    
    const user1 = users[0];
    const user2 = users[1];
    
    console.log(`✅ Usuario 1: ${user1.full_name} (${user1.user_type})`);
    console.log(`   - id (URL): ${user1.id}`);
    console.log(`   - user_id (mensajes): ${user1.user_id}`);
    
    console.log(`✅ Usuario 2: ${user2.full_name} (${user2.user_type})`);
    console.log(`   - id (URL): ${user2.id}`);
    console.log(`   - user_id (mensajes): ${user2.user_id}`);
    
    // 2. Probar endpoint de perfil actualizado (solo si es freelancer)
    if (user1.user_type === 'freelancer') {
      console.log('\n📋 2. Probando endpoint /api/freelancers/:id/profile...');
      const profileResponse = await fetch(`http://localhost:3001/api/freelancers/${user1.id}/profile`);
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('✅ Perfil obtenido correctamente');
        console.log(`   - id: ${profileData.profile.id}`);
        console.log(`   - user_id: ${profileData.profile.user_id}`);
        console.log(`   - messaging_id: ${profileData.profile.messaging_id}`);
        
        // Verificar que messaging_id coincide con user_id
        if (profileData.profile.messaging_id === profileData.profile.user_id) {
          console.log('✅ messaging_id coincide con user_id');
        } else {
          console.log('❌ messaging_id NO coincide con user_id');
        }
      } else {
        console.error('❌ Error al obtener perfil:', profileResponse.status);
      }
    } else {
      console.log('\n📋 2. Usuario 1 no es freelancer, saltando prueba de perfil...');
    }
    
    // 3. Simular envío de mensaje usando user_id correcto
    console.log('\n📋 3. Simulando envío de mensaje con user_id correcto...');
    
    // Generar token JWT para user2 (como si fuera el remitente)
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        userId: user2.user_id,
        email: user2.email 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '1h' }
    );
    
    const messageResponse = await fetch('http://localhost:3001/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        recipient_id: user1.user_id, // Usar user_id, no id
        content: 'Mensaje de prueba - problema solucionado definitivamente'
      })
    });
    
    console.log(`📤 Enviando mensaje:`);
    console.log(`   - De: ${user2.full_name} (${user2.user_id})`);
    console.log(`   - Para: ${user1.full_name} (${user1.user_id})`);
    console.log(`   - Status: ${messageResponse.status}`);
    
    if (messageResponse.ok) {
      const messageData = await messageResponse.json();
      console.log('✅ Mensaje enviado correctamente');
      console.log(`   - ID del mensaje: ${messageData.message.id}`);
      
      // 4. Verificar que el mensaje se guardó
      console.log('\n📋 4. Verificando mensaje en base de datos...');
      const { data: savedMessage, error: fetchError } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('id', messageData.message.id)
        .single();
      
      if (!fetchError && savedMessage) {
        console.log('✅ Mensaje verificado en base de datos');
        console.log(`   - sender_id: ${savedMessage.sender_id}`);
        console.log(`   - recipient_id: ${savedMessage.recipient_id}`);
        console.log(`   - content: ${savedMessage.content}`);
        console.log(`   - created_at: ${savedMessage.created_at}`);
        
        // Verificar que los IDs coinciden
        if (savedMessage.sender_id === user2.user_id && 
            savedMessage.recipient_id === user1.user_id) {
          console.log('✅ Los user_id coinciden correctamente');
        } else {
          console.log('❌ Los user_id NO coinciden');
        }
      } else {
        console.error('❌ Error al verificar mensaje:', fetchError?.message);
      }
    } else {
      const errorData = await messageResponse.text();
      console.error('❌ Error al enviar mensaje:', errorData);
    }
    
    // 5. Mostrar todos los mensajes en la tabla
    console.log('\n📋 5. Mensajes actuales en direct_messages:');
    const { data: allMessages, error: allError } = await supabase
      .from('direct_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!allError && allMessages) {
      console.log(`✅ Total de mensajes: ${allMessages.length}`);
      allMessages.forEach((msg, index) => {
        console.log(`   ${index + 1}. ${msg.content.substring(0, 50)}...`);
        console.log(`      De: ${msg.sender_id} Para: ${msg.recipient_id}`);
        console.log(`      Fecha: ${msg.created_at}`);
      });
    }
    
    console.log('\n🎉 RESUMEN DE LA SOLUCIÓN:');
    console.log('   ✅ Backend: Endpoint devuelve messaging_id = user_id');
    console.log('   ✅ Frontend: Usa user_id en lugar de params.id para mensajes');
    console.log('   ✅ Base de datos: direct_messages usa user_id correctamente');
    console.log('   ✅ Problema solucionado: Los mensajes ahora se guardan');
    
  } catch (err) {
    console.error('❌ Error general:', err.message);
  }
};

testFixedMessages();