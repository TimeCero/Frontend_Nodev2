const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yxdkitxivnycjzbygpmu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZGtpdHhpdm55Y2p6YnlncG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0ODA3MjAsImV4cCI6MjA2NjA1NjcyMH0.XGcoBhw8Qnoz95O-VJ6M2XEpi6_ddwxNSMCqlpIhSTg'
);

async function debugApplications() {
  try {
    console.log('=== DEBUGGING APPLICATIONS ===');
    
    // 1. Verificar todas las aplicaciones
    console.log('\n1. Checking all applications...');
    const { data: allApps, error: allError } = await supabase
      .from('project_applications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (allError) {
      console.error('Error fetching applications:', allError);
      return;
    }
    
    console.log(`Found ${allApps.length} applications:`);
    allApps.forEach(app => {
      console.log(`- ID: ${app.id}`);
      console.log(`  Freelancer ID: ${app.freelancer_id}`);
      console.log(`  Project ID: ${app.project_id}`);
      console.log(`  Status: ${app.status}`);
      console.log(`  Created: ${app.created_at}`);
      console.log('---');
    });
    
    // 2. Verificar perfiles de usuario
    console.log('\n2. Checking user profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, email, full_name, user_type')
      .limit(10);
      
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    } else {
      console.log(`Found ${profiles.length} user profiles:`);
      profiles.forEach(profile => {
        console.log(`- User ID: ${profile.user_id}`);
        console.log(`  Email: ${profile.email}`);
        console.log(`  Name: ${profile.full_name}`);
        console.log(`  Type: ${profile.user_type}`);
        console.log('---');
      });
    }
    
    // 3. Verificar aplicaciones por freelancer específico
    if (allApps.length > 0) {
      const freelancerId = allApps[0].freelancer_id;
      console.log(`\n3. Checking applications for freelancer: ${freelancerId}`);
      
      const { data: freelancerApps, error: freelancerError } = await supabase
        .from('project_applications')
        .select(`
          *,
          projects (
            id,
            title,
            status
          )
        `)
        .eq('freelancer_id', freelancerId);
        
      if (freelancerError) {
        console.error('Error fetching freelancer applications:', freelancerError);
      } else {
        console.log(`Found ${freelancerApps.length} applications for this freelancer:`);
        freelancerApps.forEach(app => {
          console.log(`- Application ID: ${app.id}`);
          console.log(`  Project: ${app.projects?.title || 'Unknown'}`);
          console.log(`  Status: ${app.status}`);
          console.log('---');
        });
      }
    }
    
  } catch (error) {
    console.error('Error in debug:', error);
  }
}

debugApplications();