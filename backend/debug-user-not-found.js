const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function debugUserNotFound() {
  try {
    console.log('=== DEBUGGING USUARIO NO ENCONTRADO ===');
    
    // Verificar configuración de Supabase
    console.log('\n1. Verificando configuración de Supabase...');
    console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? 'Configurado' : 'NO CONFIGURADO');
    console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurado' : 'NO CONFIGURADO');
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('\n❌ PROBLEMA ENCONTRADO: Supabase no está configurado');
      console.log('   Esto explica el error "usuario no encontrado"');
      console.log('   El endpoint devuelve 503 cuando Supabase no está configurado');
      return;
    }
    
    // Crear cliente de Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    console.log('\n2. Verificando usuarios en user_profiles...');
    
    // Verificar usuarios existentes
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, email')
      .limit(10);
    
    if (usersError) {
      console.error('   Error al obtener usuarios:', usersError);
      return;
    }
    
    console.log(`   Usuarios encontrados: ${users?.length || 0}`);
    if (users && users.length > 0) {
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.user_id}, Nombre: ${user.full_name}, Email: ${user.email}`);
      });
    } else {
      console.log('   ❌ No hay usuarios en user_profiles');
      console.log('   Esto explica el error "usuario no encontrado"');
    }
    
    // Verificar IDs específicos
    console.log('\n3. Verificando IDs específicos...');
    const testIds = [
      'cea48378-22a0-4166-a9b1-a67c5964ba26',
      '0c78a7ac-15be-4fd5-8f54-3ae75c39c3fc',
      'e25f5da5-1c19-4a6a-bb61-d4a277c8d6e1'
    ];
    
    for (const testId of testIds) {
      const { data: user, error } = await supabase
        .from('user_profiles')
        .select('user_id, full_name')
        .eq('user_id', testId)
        .single();
      
      if (error || !user) {
        console.log(`   ❌ ID ${testId}: NO ENCONTRADO`);
      } else {
        console.log(`   ✅ ID ${testId}: ${user.full_name}`);
      }
    }
    
    // Verificar tabla direct_messages
    console.log('\n4. Verificando tabla direct_messages...');
    const { data: messages, error: messagesError } = await supabase
      .from('direct_messages')
      .select('*')
      .limit(5);
    
    if (messagesError) {
      console.error('   Error al acceder a direct_messages:', messagesError);
    } else {
      console.log(`   Mensajes existentes: ${messages?.length || 0}`);
    }
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

debugUserNotFound();