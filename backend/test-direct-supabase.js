const { createClient } = require('@supabase/supabase-js');

// Use the same configuration as frontend
const supabaseUrl = 'https://yxdkitxivnycjzbygpmu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZGtpdHhpdm55Y2p6YnlncG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0ODA3MjAsImV4cCI6MjA2NjA1NjcyMH0.XGcoBhw8Qnoz95O-VJ6M2XEpi6_ddwxNSMCqlpIhSTg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDirectSupabase() {
  console.log('Testing direct Supabase connection...');
  
  try {
    // First, check if we have any projects
    console.log('\n1. Checking for existing projects...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(5);
      
    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
    } else {
      console.log(`Found ${projects.length} projects`);
      if (projects.length > 0) {
        console.log('First project:', projects[0]);
      }
    }
    
    // Check for existing applications
    console.log('\n2. Checking for existing applications...');
    const { data: applications, error: appsError } = await supabase
      .from('project_applications')
      .select('*')
      .limit(5);
      
    if (appsError) {
      console.error('Error fetching applications:', appsError);
    } else {
      console.log(`Found ${applications.length} applications`);
      if (applications.length > 0) {
        console.log('First application:', applications[0]);
      }
    }
    
    // Check user profiles
    console.log('\n3. Checking user profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);
      
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    } else {
      console.log(`Found ${profiles.length} user profiles`);
      profiles.forEach(profile => {
        console.log(`- ${profile.user_type}: ${profile.full_name || profile.email} (ID: ${profile.user_id})`);
      });
    }
    
    // Try to create a test project if none exist
    if (projects && projects.length === 0) {
      console.log('\n4. Creating a test project...');
      
      // First, we need a client user
      const clientProfile = profiles.find(p => p.user_type === 'client');
      if (!clientProfile) {
        console.log('No client profile found. Cannot create test project.');
        return;
      }
      
      const testProject = {
        client_id: clientProfile.user_id,
        title: 'Test Project for Application Debugging',
        description: 'This is a test project created to debug application submission issues.',
        category: 'web-development',
        budget_min: 500,
        budget_max: 1000,
        status: 'open',
        skills_required: ['JavaScript', 'React']
      };
      
      const { data: newProject, error: createError } = await supabase
        .from('projects')
        .insert([testProject])
        .select('*')
        .single();
        
      if (createError) {
        console.error('Error creating test project:', createError);
      } else {
        console.log('Created test project:', newProject);
        projects.push(newProject);
      }
    }
    
    // Try to create a test application
    if (projects && projects.length > 0) {
      console.log('\n5. Testing application submission...');
      
      const freelancerProfile = profiles.find(p => p.user_type === 'freelancer');
      if (!freelancerProfile) {
        console.log('No freelancer profile found. Cannot create test application.');
        return;
      }
      
      const projectToApplyTo = projects[0];
      
      // Check if application already exists
      const { data: existingApp } = await supabase
        .from('project_applications')
        .select('*')
        .eq('project_id', projectToApplyTo.id)
        .eq('freelancer_id', freelancerProfile.user_id)
        .single();
        
      if (existingApp) {
        console.log('Application already exists:', existingApp);
        return;
      }
      
      const testApplication = {
        project_id: projectToApplyTo.id,
        freelancer_id: freelancerProfile.user_id,
        proposal: 'This is a test proposal created to debug application submission. I have the required skills and experience to complete this project successfully.',
        cover_letter: 'Dear client, I am very interested in your project and believe I can deliver excellent results.',
        estimated_duration: '2-3 weeks',
        proposed_rate: 45.00,
        status: 'pending'
      };
      
      console.log('Attempting to create application with data:', testApplication);
      
      const { data: newApplication, error: appError } = await supabase
        .from('project_applications')
        .insert([testApplication])
        .select('*')
        .single();
        
      if (appError) {
        console.error('Error creating application:', appError);
      } else {
        console.log('Successfully created application:', newApplication);
        
        // Verify it was saved
        const { data: savedApp, error: fetchError } = await supabase
          .from('project_applications')
          .select(`
            *,
            projects(
              title,
              description,
              user_profiles!projects_client_id_fkey(
                full_name,
                email
              )
            )
          `)
          .eq('id', newApplication.id)
          .single();
          
        if (fetchError) {
          console.error('Error fetching saved application:', fetchError);
        } else {
          console.log('Verified saved application with project details:', savedApp);
        }
      }
    }
    
  } catch (error) {
    console.error('Exception during test:', error);
  }
}

testDirectSupabase().catch(console.error);