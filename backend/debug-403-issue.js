require('dotenv').config();
const jwt = require('jsonwebtoken');
const { supabase, isSupabaseConfigured } = require('./config/supabase');

async function debugAuthIssue() {
  console.log('=== DEBUG 403 ISSUE ===');
  
  // 1. Verificar configuración
  console.log('Supabase configurado:', isSupabaseConfigured);
  console.log('JWT_SECRET configurado:', !!process.env.JWT_SECRET);
  
  // 2. Crear un token de prueba
  const testUser = {
    id: '22a7c597-c196-4d54-add4-4055c12e648b', // ID del freelancer de la inserción
    email: 'test@example.com',
    userType: 'freelancer'
  };
  
  const token = jwt.sign(testUser, process.env.JWT_SECRET, { expiresIn: '1h' });
  console.log('Token generado para usuario:', testUser.id);
  
  // 3. Verificar token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificado:', decoded);
  } catch (error) {
    console.error('Error verificando token:', error.message);
    return;
  }
  
  // 4. Verificar proyecto en la base de datos
  if (isSupabaseConfigured && supabase) {
    try {
      const projectId = '42e313b8-dd50-4e06-a967-a33cda0c3c7d'; // ID del proyecto de la inserción
      
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, client_id, title, status')
        .eq('id', projectId)
        .single();
      
      if (projectError) {
        console.error('Error obteniendo proyecto:', projectError);
      } else {
        console.log('Proyecto encontrado:');
        console.log('- ID:', project.id);
        console.log('- Client ID:', project.client_id);
        console.log('- Título:', project.title);
        console.log('- Estado:', project.status);
        
        // 5. Comparar IDs
        console.log('\n=== COMPARACIÓN DE IDs ===');
        console.log('Usuario en token:', testUser.id);
        console.log('Propietario del proyecto:', project.client_id);
        console.log('¿Son iguales?', testUser.id === project.client_id);
        
        if (testUser.id !== project.client_id) {
          console.log('\n❌ PROBLEMA: El usuario no es el propietario del proyecto');
          console.log('Por eso se devuelve 403 Forbidden');
        } else {
          console.log('\n✅ El usuario SÍ es el propietario del proyecto');
        }
      }
      
      // 6. Verificar aplicaciones
      const { data: applications, error: appError } = await supabase
        .from('project_applications')
        .select('*')
        .eq('project_id', projectId);
      
      if (appError) {
        console.error('Error obteniendo aplicaciones:', appError);
      } else {
        console.log('\nAplicaciones encontradas:', applications.length);
        applications.forEach((app, index) => {
          console.log(`Aplicación ${index + 1}:`);
          console.log('- ID:', app.id);
          console.log('- Freelancer ID:', app.freelancer_id);
          console.log('- Estado:', app.status);
        });
      }
      
    } catch (error) {
      console.error('Error en consulta Supabase:', error);
    }
  } else {
    console.log('Supabase no configurado');
  }
}

debugAuthIssue().catch(console.error);