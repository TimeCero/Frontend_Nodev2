require('dotenv').config();
const jwt = require('jsonwebtoken');

// Generar un token JWT válido para pruebas
const testUser = {
  userId: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  userType: 'freelancer'
};

const token = jwt.sign(testUser, process.env.JWT_SECRET, { expiresIn: '1h' });

console.log('Token JWT generado:', token);
console.log('\nPuedes usar este token para probar el endpoint:');
console.log('curl -X POST http://localhost:3001/api/applications \\');
console.log('  -H "Content-Type: application/json" \\');
console.log(`  -H "Authorization: Bearer ${token}" \\`);
console.log('  -d "{\"project_id\":\"1\",\"proposal\":\"Test proposal\",\"cover_letter\":\"Test cover letter\"}"');

// También verificar el token
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('\nToken verificado correctamente:', decoded);
} catch (error) {
  console.error('Error verificando token:', error.message);
}