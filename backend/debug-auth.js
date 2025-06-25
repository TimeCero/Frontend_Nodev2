const jwt = require('jsonwebtoken');
const { supabase } = require('./config/supabase');

async function debugAuth() {
  console.log('=== DEBUG DE AUTENTICACIÓN ===');
  
  // Verificar JWT Secret
  const jwtSecret = process.env.JWT_SECRET || 'tu_jwt_secret_aqui';
  console.log('JWT Secret configurado:', jwtSecret ? 'Sí' : 'No');
  
  // Crear un token de prueba
  const testUser = {
    id: 'e5a7d2e8-58e0-4baf-b31e-bf1002668b10',
    email: 'test@example.com'
  };
  
  const testToken = jwt.sign(testUser, jwtSecret, { expiresIn: '24h' });
  console.log('Token de prueba generado:', testToken);
  
  // Verificar el token
  try {
    const decoded = jwt.verify(testToken, jwtSecret);
    console.log('Token verificado exitosamente:', decoded);
  } catch (error) {
    console.log('Error verificando token:', error.message);
  }
  
  // Verificar proyecto en Supabase
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select('id, client_id, title')
      .eq('id', 'e5a7d2e8-58e0-4baf-b31e-bf1002668b10')
      .single();
      
    if (error) {
      console.log('Error obteniendo proyecto:', error);
    } else {
      console.log('Proyecto encontrado:', project);
      console.log('¿Usuario es dueño?', project.client_id === testUser.id);
    }
  } catch (error) {
    console.log('Error conectando a Supabase:', error.message);
  }
  
  // Verificar aplicaciones
  try {
    const { data: applications, error } = await supabase
      .from('project_applications')
      .select('*')
      .eq('project_id', 'e5a7d2e8-58e0-4baf-b31e-bf1002668b10');
      
    if (error) {
      console.log('Error obteniendo aplicaciones:', error);
    } else {
      console.log('Aplicaciones encontradas:', applications.length);
      console.log('Aplicaciones:', applications);
    }
  } catch (error) {
    console.log('Error obteniendo aplicaciones:', error.message);
  }
}

debugAuth().catch(console.error);