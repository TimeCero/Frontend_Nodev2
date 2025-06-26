require('dotenv').config();

const testMessagesEndpoint = async () => {
  console.log('🧪 Probando endpoint /api/messages...');
  
  try {
    const response = await fetch('http://localhost:3001/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        recipient_id: 'test-id',
        content: 'test message'
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

testMessagesEndpoint();