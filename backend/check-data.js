require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  try {
    console.log('Checking projects...');
    const { data: projects, error: pError } = await supabase
      .from('projects')
      .select('id, title, client_id')
      .limit(5);
    
    console.log('Projects found:', projects?.length || 0);
    if (pError) console.log('Projects error:', pError);
    projects?.forEach(p => console.log(`- ${p.id}: ${p.title}`));
    
    console.log('\nChecking applications...');
    const { data: apps, error: aError } = await supabase
      .from('project_applications')
      .select('*')
      .limit(10);
    
    console.log('Applications found:', apps?.length || 0);
    if (aError) console.log('Applications error:', aError);
    apps?.forEach(a => console.log(`- Project: ${a.project_id}, Freelancer: ${a.freelancer_id}, Status: ${a.status}`));
    
    console.log('\nChecking user profiles...');
    const { data: users, error: uError } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name')
      .limit(5);
    
    console.log('User profiles found:', users?.length || 0);
    if (uError) console.log('Users error:', uError);
    users?.forEach(u => console.log(`- ${u.user_id}: ${u.email} (${u.full_name})`));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();