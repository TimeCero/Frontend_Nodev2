require('dotenv').config();
const jwt = require('jsonwebtoken');

const testMessagesWithValidToken = async () => {
  console.log('🧪 Probando endpoint /api/messages con token válido...');
  
  // Crear un token JWT válido
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('❌ JWT_SECRET no está configurado');
    return;
  }
  
  const testUser = {
    id: 'test-user-id-123',
    email: 'test@example.com',
    name: 'Test User',
    userType: 'client',
    provider: 'test'
  };
  
  const token = jwt.sign(testUser, jwtSecret, { expiresIn: '1h' });
  console.log('✅ Token generado:', token.substring(0, 50) + '...');
  
  try {
    const response = await fetch('http://localhost:3001/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        recipient_id: 'recipient-test-id-456',
        content: 'Mensaje de prueba'
      })
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('Response:', responseText);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Usar node-fetch si está disponible, sino usar fetch nativo
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testMessagesWithValidToken();