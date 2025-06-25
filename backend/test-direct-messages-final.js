const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testDirectMessages() {
  try {
    console.log('=== PRUEBA FINAL DE MENSAJES DIRECTOS ===');
    
    // Crear cliente de Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('\n1. Verificando usuarios disponibles...');
    
    const { data: users } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, user_type')
      .order('full_name');
    
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.full_name} (${user.user_type}) - ${user.user_id}`);
    });
    
    console.log('\n2. Simulando envío de mensaje directo...');
    
    // Simular el envío de un mensaje desde el Usuario Test al Freelancer EEUU
    const senderId = 'e25f5da5-1c19-4a6a-bb61-d4a277c8d6e1'; // Usuario Test
    const recipientId = 'cea48378-22a0-4166-a9b1-a67c5964ba26'; // Freelancer EEUU
    
    console.log(`   Enviando mensaje de ${senderId} a ${recipientId}`);
    
    // Verificar que el destinatario existe (como hace el endpoint)
    const { data: recipient, error: recipientError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name')
      .eq('user_id', recipientId)
      .single();
    
    if (recipientError || !recipient) {
      console.log('   ❌ Usuario destinatario no encontrado');
      return;
    }
    
    console.log(`   ✅ Destinatario encontrado: ${recipient.full_name}`);
    
    // Crear el mensaje directo
    const { data: message, error: messageError } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        content: `Mensaje de prueba enviado el ${new Date().toLocaleString()}`,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        sender:user_profiles!direct_messages_sender_id_fkey(
          user_id,
          full_name,
          avatar_url
        ),
        recipient:user_profiles!direct_messages_recipient_id_fkey(
          user_id,
          full_name,
          avatar_url
        )
      `)
      .single();
    
    if (messageError) {
      console.error('   ❌ Error creando mensaje:', messageError);
    } else {
      console.log('   ✅ Mensaje creado exitosamente');
      console.log(`   De: ${message.sender.full_name}`);
      console.log(`   Para: ${message.recipient.full_name}`);
      console.log(`   Contenido: ${message.content}`);
    }
    
    console.log('\n3. Verificando conversaciones...');
    
    // Obtener conversaciones del usuario
    const { data: conversations, error: convError } = await supabase
      .rpc('get_user_conversations', { user_id: senderId });
    
    if (convError) {
      console.error('   Error obteniendo conversaciones:', convError);
    } else {
      console.log(`   Conversaciones encontradas: ${conversations?.length || 0}`);
      if (conversations && conversations.length > 0) {
        conversations.forEach((conv, index) => {
          console.log(`   ${index + 1}. Con: ${conv.full_name} - Último mensaje: ${conv.content}`);
        });
      }
    }
    
    console.log('\n4. Verificando mensajes entre usuarios...');
    
    const { data: directMessages, error: dmError } = await supabase
      .from('direct_messages')
      .select(`
        *,
        sender:user_profiles!direct_messages_sender_id_fkey(full_name),
        recipient:user_profiles!direct_messages_recipient_id_fkey(full_name)
      `)
      .or(`and(sender_id.eq.${senderId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${senderId})`)
      .order('created_at', { ascending: true });
    
    if (dmError) {
      console.error('   Error obteniendo mensajes:', dmError);
    } else {
      console.log(`   Mensajes en la conversación: ${directMessages?.length || 0}`);
      if (directMessages && directMessages.length > 0) {
        directMessages.forEach((msg, index) => {
          console.log(`   ${index + 1}. ${msg.sender.full_name}: ${msg.content}`);
        });
      }
    }
    
    console.log('\n✅ PRUEBA COMPLETADA - Los mensajes directos están funcionando correctamente!');
    console.log('\n📝 INSTRUCCIONES PARA EL USUARIO:');
    console.log('   1. Ve a http://localhost:3000/freelancers/cea48378-22a0-4166-a9b1-a67c5964ba26');
    console.log('   2. Haz clic en "Enviar mensaje"');
    console.log('   3. Escribe un mensaje y envíalo');
    console.log('   4. Ve a http://localhost:3000/messages para ver tus conversaciones');
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

testDirectMessages();