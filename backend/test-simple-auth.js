const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSimpleAuth() {
  try {
    console.log('=== PRUEBA SIMPLE DE AUTENTICACIÓN ===');
    
    // 1. Verificar configuración
    console.log('\n1. Verificando configuración...');
    console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'SÍ' : 'NO'}`);
    console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? 'SÍ' : 'NO'}`);
    
    // 2. Crear cliente Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // 3. Obtener usuario de prueba
    console.log('\n2. Obteniendo usuario de prueba...');
    const testUserId = 'e25f5da5-1c19-4a6a-bb61-d4a277c8d6e1';
    
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', testUserId)
      .single();
    
    if (error || !user) {
      console.log('   ❌ Usuario no encontrado en Supabase');
      return;
    }
    
    console.log(`   ✅ Usuario encontrado: ${user.full_name}`);
    
    // 4. Generar token
    console.log('\n3. Generando token...');
    const token = jwt.sign(
      { 
        id: user.user_id, 
        email: user.email || 'test@example.com' 
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log(`   Token: ${token.substring(0, 50)}...`);
    
    // 5. Verificar token
    console.log('\n4. Verificando token...');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`   ✅ Token válido para usuario: ${decoded.id}`);
      
      // 6. Buscar usuario con el ID del token
      console.log('\n5. Buscando usuario con ID del token...');
      const { data: foundUser, error: findError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', decoded.id)
        .single();
      
      if (findError || !foundUser) {
        console.log('   ❌ Usuario del token no encontrado en Supabase');
      } else {
        console.log(`   ✅ Usuario del token encontrado: ${foundUser.full_name}`);
        console.log('\n🎉 AUTENTICACIÓN FUNCIONARÍA CORRECTAMENTE');
      }
      
    } catch (jwtError) {
      console.log(`   ❌ Error verificando token: ${jwtError.message}`);
    }
    
    console.log('\n=== PRUEBA COMPLETADA ===');
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

testSimpleAuth();