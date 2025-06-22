require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  console.log('Required variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyEmailConstraint() {
  try {
    console.log('🔧 Checking for duplicate emails in user_profiles table...');
    
    // Check for duplicate emails
    const { data: duplicates, error: duplicateError } = await supabase
      .from('user_profiles')
      .select('email, id')
      .not('email', 'is', null);
    
    if (duplicateError) {
      console.error('Error checking duplicates:', duplicateError);
      return;
    }
    
    // Group by email to find duplicates
    const emailGroups = {};
    duplicates.forEach(profile => {
      if (!emailGroups[profile.email]) {
        emailGroups[profile.email] = [];
      }
      emailGroups[profile.email].push(profile);
    });
    
    // Find emails with more than one profile
    const duplicateEmails = Object.entries(emailGroups).filter(([email, profiles]) => profiles.length > 1);
    
    if (duplicateEmails.length > 0) {
      console.log(`⚠️  Found ${duplicateEmails.length} duplicate email(s):`);
      
      for (const [email, profiles] of duplicateEmails) {
        console.log(`  - ${email}: ${profiles.length} profiles`);
        
        // Keep the first profile, delete the rest
        const profilesToDelete = profiles.slice(1);
        
        for (const profile of profilesToDelete) {
          const { error: deleteError } = await supabase
            .from('user_profiles')
            .delete()
            .eq('id', profile.id);
          
          if (deleteError) {
            console.error(`    ❌ Error deleting duplicate profile ${profile.id}:`, deleteError);
          } else {
            console.log(`    ✅ Deleted duplicate profile ${profile.id}`);
          }
        }
      }
    } else {
      console.log('✅ No duplicate emails found');
    }
    
    console.log('\n🎉 Duplicate cleanup completed!');
    console.log('\n📝 Note: The UNIQUE constraint on email has been added to the schema.');
    console.log('   This will prevent future duplicate emails at the database level.');
    console.log('\n🔄 Please restart your backend server to ensure the changes take effect.');
    
  } catch (error) {
    console.error('❌ Error applying email constraint:', error);
    process.exit(1);
  }
}

applyEmailConstraint();