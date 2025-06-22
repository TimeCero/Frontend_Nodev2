const { getAllUsers } = require('../config/passport');
const supabase = require('../config/supabase');

/**
 * Migration script to move existing users from in-memory storage to Supabase
 * Run this script after setting up Supabase to migrate existing users
 */
async function migrateUsersToSupabase() {
  try {
    console.log('🚀 Starting migration to Supabase...');
    
    // Get all existing users from in-memory storage
    const existingUsers = getAllUsers();
    console.log(`📊 Found ${existingUsers.length} existing users to migrate`);
    
    if (existingUsers.length === 0) {
      console.log('✅ No users to migrate');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of existingUsers) {
      try {
        console.log(`📝 Migrating user: ${user.email}`);
        
        // Create user in Supabase Auth
        const { data: supabaseUser, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          email_confirm: true,
          user_metadata: {
            name: user.name,
            avatar_url: user.avatar,
            provider: user.provider,
            ...(user.username && { username: user.username }),
            ...(user.githubProfile && { github_profile: user.githubProfile })
          },
          app_metadata: {
            provider: user.provider,
            user_type: user.userType,
            migrated_from: 'passport_session',
            original_id: user.id,
            created_at: user.createdAt
          }
        });
        
        if (authError) {
          if (authError.message === 'User already registered') {
            console.log(`⚠️  User ${user.email} already exists in Supabase`);
            
            // Try to get the existing user and update their profile
            const { data: existingUser, error: getUserError } = await supabase.auth.admin.getUserByEmail(user.email);
            
            if (!getUserError && existingUser) {
              // Update user profile in the user_profiles table
              const { error: profileError } = await supabase
                .from('user_profiles')
                .upsert({
                  user_id: existingUser.user.id,
                  email: user.email,
                  user_type: user.userType,
                  github_username: user.username,
                  bio: `Migrated from passport session on ${new Date().toISOString()}`,
                  avatar_url: user.avatar,
                  created_at: user.createdAt || new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'user_id'
                });
              
              if (profileError) {
                console.error(`❌ Error updating profile for ${user.email}:`, profileError);
                errorCount++;
              } else {
                console.log(`✅ Updated profile for existing user: ${user.email}`);
                successCount++;
              }
            }
          } else {
            console.error(`❌ Error creating user ${user.email}:`, authError);
            errorCount++;
          }
        } else {
          console.log(`✅ Successfully created user: ${user.email}`);
          
          // The user profile should be automatically created by the trigger
          // But let's verify and update if needed
          setTimeout(async () => {
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', supabaseUser.user.id)
              .single();
            
            if (profileError || !profile) {
              console.log(`📝 Creating profile for ${user.email}`);
              
              const { error: insertError } = await supabase
                .from('user_profiles')
                .insert({
                  user_id: supabaseUser.user.id,
                  email: user.email,
                  user_type: user.userType,
                  github_username: user.username,
                  bio: `Migrated from passport session on ${new Date().toISOString()}`,
                  avatar_url: user.avatar,
                  created_at: user.createdAt || new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
              
              if (insertError) {
                console.error(`❌ Error creating profile for ${user.email}:`, insertError);
              }
            } else {
              console.log(`✅ Profile already exists for ${user.email}`);
            }
          }, 1000); // Wait 1 second for trigger to execute
          
          successCount++;
        }
        
      } catch (error) {
        console.error(`❌ Unexpected error migrating user ${user.email}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${successCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log(`📝 Total processed: ${successCount + errorCount} users`);
    
    if (successCount > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('💡 You can now start using Supabase for authentication.');
      console.log('💡 Consider updating your frontend to use Supabase client for new authentications.');
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Verify migration by comparing user counts
 */
async function verifyMigration() {
  try {
    console.log('\n🔍 Verifying migration...');
    
    const existingUsers = getAllUsers();
    const { data: supabaseUsers, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error fetching Supabase users:', error);
      return;
    }
    
    console.log(`📊 Original users: ${existingUsers.length}`);
    console.log(`📊 Supabase users: ${supabaseUsers.users.length}`);
    
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*');
    
    if (profileError) {
      console.error('❌ Error fetching user profiles:', profileError);
      return;
    }
    
    console.log(`📊 User profiles: ${profiles.length}`);
    
    // Check for specific users
    for (const user of existingUsers) {
      const supabaseUser = supabaseUsers.users.find(su => su.email === user.email);
      const profile = profiles.find(p => p.email === user.email);
      
      console.log(`👤 ${user.email}: Auth=${!!supabaseUser}, Profile=${!!profile}`);
    }
    
  } catch (error) {
    console.error('💥 Verification failed:', error);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  console.log('🔄 Starting Supabase migration...');
  console.log('⚠️  Make sure you have set up your Supabase environment variables!');
  console.log('⚠️  Make sure you have run the database schema setup!');
  console.log('');
  
  migrateUsersToSupabase()
    .then(() => verifyMigration())
    .then(() => {
      console.log('\n✅ Migration process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = {
  migrateUsersToSupabase,
  verifyMigration
};