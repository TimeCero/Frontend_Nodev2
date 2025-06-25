const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function debugFrontendAuth() {
  try {
    console.log('=== DEBUGGING AUTENTICACIÓN DEL FRONTEND ===');
    
    // Simular exactamente lo que hace el frontend
    console.log('\n1. Simulando verificación de usuario del frontend...');
    
    // Crear diferentes tokens para probar
    const testTokens = [
      // Token con usuario existente
      jwt.sign(
        { id: 'fd19a7d1-2850-4f11-a22d-a9f9ca349c5c', email: 'alejo@test.com' },
        process.env.JWT_SECRET || 'fallback-secret'
      ),
      // Token con usuario de prueba
      jwt.sign(
        { id: 'e25f5da5-1c19-4a6a-bb61-d4a277c8d6e1', email: 'test@example.com' },
        process.env.JWT_SECRET || 'fallback-secret'
      ),
      // Token con usuario inexistente
      jwt.sign(
        { id: '00000000-0000-0000-0000-000000000000', email: 'fake@test.com' },
        process.env.JWT_SECRET || 'fallback-secret'
      )
    ];
    
    const userNames = ['alejo (existente)', 'Usuario Test (creado)', 'Usuario Falso'];
    
    for (let i = 0; i < testTokens.length; i++) {
      const token = testTokens[i];
      const userName = userNames[i];
      
      console.log(`\n2.${i+1} Probando con ${userName}...`);
      console.log(`   Token: ${token.substring(0, 50)}...`);
      
      try {
        // Simular verificación de auth (como hace checkUser en el frontend)
        const authResponse = await fetch('http://localhost:3001/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log(`   Auth Status: ${authResponse.status}`);
        
        if (authResponse.ok) {
          const authData = await authResponse.json();
          console.log(`   ✅ Usuario autenticado: ${authData.user?.id}`);
          
          // Ahora probar envío de mensaje (como hace sendDirectMessage)
          console.log(`   Probando envío de mensaje...`);
          
          const messageResponse = await fetch('http://localhost:3001/api/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              recipient_id: 'cea48378-22a0-4166-a9b1-a67c5964ba26', // Freelancer EEUU
              content: `Mensaje de prueba desde ${userName} - ${new Date().toLocaleString()}`
            })
          });
          
          console.log(`   Message Status: ${messageResponse.status}`);
          
          if (messageResponse.ok) {
            const messageData = await messageResponse.json();
            console.log(`   ✅ Mensaje enviado exitosamente`);
            console.log(`   Respuesta:`, JSON.stringify(messageData, null, 2));
          } else {
            const errorData = await messageResponse.json();
            console.log(`   ❌ Error enviando mensaje: ${errorData.message}`);
            console.log(`   Detalles:`, JSON.stringify(errorData, null, 2));
          }
          
        } else {
          const authError = await authResponse.json();
          console.log(`   ❌ Error de autenticación: ${authError.message}`);
        }
        
      } catch (error) {
        console.error(`   ❌ Error de conexión:`, error.message);
      }
    }
    
    console.log('\n3. Verificando configuración del JWT...');
    console.log('   JWT_SECRET configurado:', process.env.JWT_SECRET ? 'SÍ' : 'NO (usando fallback)');
    
    // Verificar si el problema está en el middleware de verificación
    console.log('\n4. Probando decodificación manual del token...');
    
    const testToken = testTokens[1]; // Usuario Test
    try {
      const decoded = jwt.verify(testToken, process.env.JWT_SECRET || 'fallback-secret');
      console.log('   ✅ Token decodificado correctamente:');
      console.log('   User ID:', decoded.id);
      console.log('   Email:', decoded.email);
      
      // Verificar si este usuario existe en Supabase
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      const { data: user, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', decoded.id)
        .single();
      
      if (error || !user) {
        console.log('   ❌ Usuario del token NO existe en user_profiles');
        console.log('   Esto explica el error "usuario no encontrado"');
      } else {
        console.log('   ✅ Usuario del token SÍ existe en user_profiles');
        console.log('   Nombre:', user.full_name);
      }
      
    } catch (error) {
      console.log('   ❌ Error decodificando token:', error.message);
    }
    
    console.log('\n=== DIAGNÓSTICO COMPLETADO ===');
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

// Función auxiliar para fetch (Node.js no tiene fetch nativo)
if (typeof fetch === 'undefined') {
  global.fetch = async (url, options = {}) => {
    const http = require('http');
    const https = require('https');
    const { URL } = require('url');
    
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const req = client.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: options.headers || {}
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(JSON.parse(data)),
            text: () => Promise.resolve(data)
          });
        });
      });
      
      req.on('error', reject);
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  };
}

debugFrontendAuth();