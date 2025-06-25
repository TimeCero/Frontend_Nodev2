const { supabase } = require('./config/supabase');

async function checkSpecificUser() {
  const email = 'adriano.alejo@tecsup.edu.pe';
  
  console.log('🔍 Checking user:', email);
  
  try {
    // Check if user exists in user_profiles
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email);
    
    console.log('\n📊 User profiles found:', profiles?.length || 0);
    if (profiles && profiles.length > 0) {
      console.log('Profile data:', JSON.stringify(profiles[0], null, 2));
    } else {
      console.log('❌ No profile found for this email');
    }
    
    if (profileError) {
      console.error('Profile query error:', profileError);
    }
    
    // Check all users with similar email pattern
    const { data: allUsers, error: allError } = await supabase
      .from('user_profiles')
      .select('email, user_id, user_type, created_at')
      .ilike('email', '%adriano%');
    
    console.log('\n🔍 Users with similar email pattern:', allUsers?.length || 0);
    if (allUsers && allUsers.length > 0) {
      allUsers.forEach(user => {
        console.log(`- ${user.email} (${user.user_type}) - ID: ${user.user_id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking user:', error);
  }
}

checkSpecificUser();