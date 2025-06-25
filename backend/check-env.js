console.log('=== VERIFICACIÓN DE VARIABLES DE ENTORNO ===');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Configurado' : 'No configurado');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurado' : 'No configurado');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Configurado' : 'No configurado');

if (process.env.SUPABASE_URL) {
  console.log('URL de Supabase:', process.env.SUPABASE_URL.substring(0, 30) + '...');
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Service Key empieza con:', process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...');
}