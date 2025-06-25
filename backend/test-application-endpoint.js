// Using native fetch available in Node.js 18+

async function testApplicationEndpoint() {
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIzYzJkMjcwLTQ5NzgtNGI2MS1hNmNkLTc5MzM4MmE3NDk0NiIsImVtYWlsIjpudWxsLCJ1c2VyVHlwZSI6ImZyZWVsYW5jZXIiLCJwcm92aWRlciI6ImdpdGh1YiIsImlhdCI6MTc1MDc4OTI4OCwiZXhwIjoxNzUxMzk0MDg4fQ.ReueTqkUegGtntF3N9M2LXJHosgr9CRARQhvLkIHGxU';
    
    const applicationData = {
      project_id: 'a3702f2f-a4a8-49b5-af7c-66dcb367285d',
      proposal: 'Test proposal with more than 50 characters to meet validation requirements for this field',
      cover_letter: 'Test cover letter with more than 100 characters to meet the validation requirements for this field in the application form submission process',
      estimated_duration: '2 weeks'
    };
    
    console.log('Testing application endpoint...');
    console.log('Data to send:', JSON.stringify(applicationData, null, 2));
    console.log('Token:', token.substring(0, 50) + '...');
    
    const response = await fetch('http://localhost:3001/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(applicationData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const result = await response.text();
    console.log('Response body:', result);
    
    if (!response.ok) {
      console.error('❌ Request failed with status:', response.status);
      try {
        const errorData = JSON.parse(result);
        console.error('Error details:', errorData);
      } catch (e) {
        console.error('Could not parse error response as JSON');
      }
    } else {
      console.log('✅ Request successful!');
      try {
        const successData = JSON.parse(result);
        console.log('Success data:', successData);
      } catch (e) {
        console.error('Could not parse success response as JSON');
      }
    }
    
  } catch (error) {
    console.error('❌ Network or other error:', error.message);
    console.error('Full error:', error);
  }
}

testApplicationEndpoint();