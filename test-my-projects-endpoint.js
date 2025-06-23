// Usando fetch nativo de Node.js (disponible desde Node 18+)

async function testMyProjectsEndpoint() {
  try {
    console.log('🧪 Probando el endpoint /api/projects/my...');
    
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZHJpYW5vLmFxcDAwQGdtYWlsLmNvbSIsImlhdCI6MTczNTY1OTg2MzkyLCJleHAiOjE3MzU2NjM0NjM5Mn0.main-app.js';
    
    const response = await fetch('http://localhost:3001/api/projects/my', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const data = await response.text();
    console.log('Response:', data);
    
    if (!response.ok) {
      console.error('❌ Error en la respuesta');
    } else {
      console.log('✅ Respuesta exitosa');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testMyProjectsEndpoint();
