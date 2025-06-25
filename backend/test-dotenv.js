require('dotenv').config();

console.log('=== TEST DOTENV ===');
console.log('process.env.JWT_SECRET:', process.env.JWT_SECRET);
console.log('process.env.SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('process.env.SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurado' : 'No configurado');
console.log('process.env.GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);

// Verificar si el archivo .env existe
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
console.log('Archivo .env existe:', fs.existsSync(envPath));
if (fs.existsSync(envPath)) {
  console.log('Contenido del archivo .env:');
  console.log(fs.readFileSync(envPath, 'utf8').substring(0, 200) + '...');
}