const jwt = require('jsonwebtoken');
const { supabase } = require('./config/supabase');
require('dotenv').config();

async function testMessagesWithAuth() {
  console.log('🔐 Probando endpoint /api/messages con autenticación...');
  
  try {
    // Obtener usuarios existentes
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      return;
    }
    
    if (!users || users.length < 2) {
      console.log('❌ Se necesitan al menos 2 usuarios para probar mensajes');
      return;
    }
    
    console.log(`📊 Usuarios encontrados: ${users.length}`);
    
    // Buscar un cliente y un freelancer
    const client = users.find(u => u.user_type === 'client');
    const freelancer = users.find(u => u.user_type === 'freelancer');
    
    if (!client) {
      console.log('❌ No se encontró ningún cliente');
      return;
    }
    
    if (!freelancer) {
      console.log('❌ No se encontró ningún freelancer');
      return;
    }
    
    console.log(`👤 Cliente: ${client.full_name} (${client.id})`);
    console.log(`💼 Freelancer: ${freelancer.full_name} (${freelancer.id})`);
    
    // Generar token JWT para el cliente
    const jwtSecret = process.env.JWT_SECRET || 'tu_jwt_secret_aqui';
    
    const tokenPayload = {
      id: client.id,
      email: client.email,
      userType: client.user_type,
      name: client.full_name,
      provider: 'local'
    };
    
    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '1h' });
    console.log('🔑 Token JWT generado para el cliente');
    
    // Probar el endpoint /api/messages
    const messageData = {
      recipient_id: freelancer.id,
      content: 'Hola, estoy interesado en tu perfil para un proyecto.'
    };
    
    console.log('📤 Enviando mensaje...');
    
    const response = await fetch('http://localhost:3001/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(messageData)
    });
    
    const responseData = await response.text();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Response: ${responseData}`);
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ ¡Mensaje enviado exitosamente!');
      
      // Verificar que el mensaje se guardó en la base de datos
      const { data: messages, error: msgError } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('sender_id', client.id)
        .eq('recipient_id', freelancer.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (msgError) {
        console.log('⚠️ Error verificando mensaje en BD:', msgError);
      } else if (messages && messages.length > 0) {
        console.log('✅ Mensaje confirmado en la base de datos:');
        console.log(`   ID: ${messages[0].id}`);
        console.log(`   Contenido: ${messages[0].content}`);
        console.log(`   Fecha: ${messages[0].created_at}`);
      } else {
        console.log('⚠️ No se encontró el mensaje en la base de datos');
      }
    } else {
      console.log('❌ Error enviando mensaje');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

testMessagesWithAuth();