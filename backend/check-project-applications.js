require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkProjectAccess() {
  try {
    const projectId = '4cae695e-cce4-4bb2-b181-d321378edc38';
    
    console.log('Checking project access for:', projectId);
    
    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (projectError) {
      console.error('Project error:', projectError);
      return;
    }
    
    console.log('Project found:');
    console.log('- ID:', project.id);
    console.log('- Title:', project.title);
    console.log('- Client ID:', project.client_id);
    
    // Check applications
    const { data: applications, error: appError } = await supabase
      .from('project_applications')
      .select('*')
      .eq('project_id', projectId);
    
    if (appError) {
      console.error('Applications error:', appError);
    } else {
      console.log('Applications found:', applications?.length || 0);
      applications?.forEach(app => {
        console.log(`- Freelancer: ${app.freelancer_id}, Status: ${app.status}`);
      });
    }
    
    // Simulate token verification (you'll need to provide a real token)
    console.log('\nTo test access, provide a JWT token in the Authorization header');
    console.log('The user must be either:');
    console.log('1. The project owner (client_id):', project.client_id);
    console.log('2. A freelancer with an accepted application');
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

checkProjectAccess();