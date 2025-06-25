const { supabase } = require('./config/supabase');

async function testApplicationSubmission() {
  console.log('Testing application submission...');
  
  // First, let's check if we have any projects to apply to
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'open')
    .limit(1);
    
  if (projectsError) {
    console.error('Error fetching projects:', projectsError);
    return;
  }
  
  if (!projects || projects.length === 0) {
    console.log('No open projects found. Creating a test project first...');
    
    // Create a test project
    const testProject = {
      client_id: '123e4567-e89b-12d3-a456-426614174000', // dummy client ID
      title: 'Test Project for Application',
      description: 'This is a test project for debugging application submission',
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
      return;
    }
    
    console.log('Created test project:', newProject.id);
    projects[0] = newProject;
  }
  
  const projectId = projects[0].id;
  console.log('Using project ID:', projectId);
  
  // Now test application submission
  const testApp = {
    project_id: projectId,
    freelancer_id: '8c008c30-4eae-4261-9535-7638f496e931', // GitHub user ID
    proposal: 'This is a test proposal for debugging purposes. I have extensive experience in web development and can deliver this project on time.',
    cover_letter: 'Dear client, I am interested in your project and believe I can provide excellent value.',
    estimated_duration: '2 weeks',
    proposed_rate: 50.00,
    status: 'pending'
  };
  
  try {
    console.log('Attempting to insert application...');
    const { data, error } = await supabase
      .from('project_applications')
      .insert([testApp])
      .select('*')
      .single();
      
    if (error) {
      console.error('Error inserting application:', error);
    } else {
      console.log('Application created successfully:', data);
      
      // Verify it was saved
      const { data: savedApp, error: fetchError } = await supabase
        .from('project_applications')
        .select('*')
        .eq('id', data.id)
        .single();
        
      if (fetchError) {
        console.error('Error fetching saved application:', fetchError);
      } else {
        console.log('Verified saved application:', savedApp);
      }
    }
  } catch (err) {
    console.error('Exception during application submission:', err);
  }
}

testApplicationSubmission().catch(console.error);