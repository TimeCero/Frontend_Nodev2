const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yxdkitxivnycjzbygpmu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZGtpdHhpdm55Y2p6YnlncG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0ODA3MjAsImV4cCI6MjA2NjA1NjcyMH0.XGcoBhw8Qnoz95O-VJ6M2XEpi6_ddwxNSMCqlpIhSTg'
);

async function checkApplications() {
  console.log('Checking project applications...');
  
  // Verificar todas las aplicaciones
  const { data: allApps, error: allError } = await supabase
    .from('project_applications')
    .select('*')
    .limit(10);
    
  if (allError) {
    console.error('Error fetching applications:', allError);
    return;
  }
  
  console.log('Total applications found:', allApps.length);
  allApps.forEach(app => {
    console.log(`- ID: ${app.id}, Freelancer: ${app.freelancer_id}, Project: ${app.project_id}, Status: ${app.status}`);
  });
  
  // Verificar aplicaciones para el usuario específico de GitHub
  const githubUserId = '8c008c30-4eae-4261-9535-7638f496e931';
  console.log('\nChecking applications for GitHub user:', githubUserId);
  
  const { data: userApps, error: userError } = await supabase
    .from('project_applications')
    .select('*')
    .eq('freelancer_id', githubUserId);
    
  if (userError) {
    console.error('Error fetching user applications:', userError);
  } else {
    console.log('Applications for GitHub user:', userApps.length);
    userApps.forEach(app => {
      console.log(`- ID: ${app.id}, Project: ${app.project_id}, Status: ${app.status}`);
    });
  }
  
  // Verificar si existe el perfil del usuario de GitHub
  console.log('\nChecking user profile for GitHub user...');
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', githubUserId)
    .single();
    
  if (profileError) {
    console.error('Profile not found by user_id, trying with GitHub email...');
    
    const { data: githubProfile, error: githubError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', `github_${githubUserId}@noemail.local`)
      .single();
      
    if (githubError) {
      console.error('GitHub profile not found:', githubError);
    } else {
      console.log('GitHub profile found:', githubProfile);
    }
  } else {
    console.log('User profile found:', profile);
  }
}

checkApplications().catch(console.error);