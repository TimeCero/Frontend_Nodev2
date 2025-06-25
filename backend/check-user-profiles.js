const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yxdkitxivnycjzbygpmu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZGtpdHhpdm55Y2p6YnlncG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0ODA3MjAsImV4cCI6MjA2NjA1NjcyMH0.XGcoBhw8Qnoz95O-VJ6M2XEpi6_ddwxNSMCqlpIhSTg'
);

async function checkUserProfiles() {
  console.log('Checking user profiles...');
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(10);
    
  if (error) {
    console.error('Error fetching user profiles:', error);
    return;
  }
  
  console.log('User profiles found:', data.length);
  console.log('User profiles:', JSON.stringify(data, null, 2));
  
  // También verificar si hay algún perfil con email específico
  const { data: emailCheck, error: emailError } = await supabase
    .from('user_profiles')
    .select('*')
    .not('email', 'is', null);
    
  if (emailError) {
    console.error('Error checking emails:', emailError);
  } else {
    console.log('Profiles with email:', emailCheck.length);
    emailCheck.forEach(profile => {
      console.log(`- ${profile.email} (user_id: ${profile.user_id})`);
    });
  }
}

checkUserProfiles().catch(console.error);