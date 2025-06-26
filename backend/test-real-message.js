require('dotenv').config();
const jwt = require('jsonwebtoken');
const { supabase, isSupabaseConfigured } = require('./config/supabase');

const testRealMessage = async () => {
  console.log('🧪 Probando envío de mensaje con usuarios reales...');
  
  // Usar IDs de usuarios reales de la base de datos
  const senderId = '30f99480-ddd1-4a1c-9087-6cc0ae9887d3'; // Javier Mendoza
  const recipientId = '1ac24dd5-cf04-49c6-888e-f0a28444b7b4'; // PEPE
  
  console.log('👤 Sender:', senderId, '(Javier Mendoza)');
  console.log('👤 Recipient:', recipientId, '(PEPE)');
  
  // Crear token JWT válido para el sender
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('❌ JWT_SECRET no está configurado');
    return;
  }
  
  const testUser = {
    id: senderId,
    email: 'adriano.eeuu00@gmail.com',
    name: 'Javier Mendoza',
    userType: 'freelancer',
    provider: 'test'
  };
  
  const token = jwt.sign(testUser, jwtSecret, { expiresIn: '1h' });
  console.log('✅ Token generado para:', testUser.name);
  
  try {
    console.log('\n📤 Enviando mensaje...');
    const response = await fetch('http://localhost:3001/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        recipient_id: recipientId,
        content: 'Hola PEPE! Este es un mensaje de prueba desde Javier Mendoza.'
      })
    });
    
    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('📋 Response:', responseText);
    
    if (response.ok) {
      console.log('\n✅ ¡Mensaje enviado exitosamente!');
      
      // Verificar que el mensaje se guardó en la base de datos
      console.log('\n🔍 Verificando mensaje en la base de datos...');
      const { data: messages, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('sender_id', senderId)
        .eq('recipient_id', recipientId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('❌ Error al verificar mensaje:', error.message);
      } else if (messages && messages.length > 0) {
        console.log('✅ Mensaje encontrado en la base de datos:');
        console.log('   ID:', messages[0].id);
        console.log('   Contenido:', messages[0].content);
        console.log('   Creado:', messages[0].created_at);
      } else {
        console.log('❌ No se encontró el mensaje en la base de datos');
      }
    } else {
      console.log('❌ Error al enviar mensaje');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

// Usar node-fetch si está disponible, sino usar fetch nativo
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testRealMessage();