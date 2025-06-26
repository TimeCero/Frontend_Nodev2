require('dotenv').config();
const jwt = require('jsonwebtoken');

async function testMyApplicationsEndpoint() {
  try {
    // Crear un token JWT para el usuario d061ec59-2102-4653-87f8-5e14bf9ca0a9
    const userId = 'd061ec59-2102-4653-87f8-5e14bf9ca0a9';
    const token = jwt.sign(
      { 
        id: userId,
        email: null,
        full_name: 'aCA SOLO PROGRAMADORES TOPS MUNDIALES',
        userType: 'freelancer'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log('Testing /my-applications endpoint...');
    console.log('User ID:', userId);
    console.log('Token generated successfully');
    
    // Hacer la petición al endpoint
    const response = await fetch('http://localhost:3001/api/my-applications', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Applications found:', data.length);
      data.forEach((app, index) => {
        console.log(`Application ${index + 1}:`);
        console.log(`  - ID: ${app.id}`);
        console.log(`  - Project: ${app.projects?.title || 'N/A'}`);
        console.log(`  - Status: ${app.status}`);
        console.log(`  - Proposed Rate: $${app.proposed_rate}`);
        console.log(`  - Created: ${app.created_at}`);
        console.log('---');
      });
    } else {
      const errorText = await response.text();
      console.error('Error response:', errorText);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testMyApplicationsEndpoint();