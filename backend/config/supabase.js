const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;



// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && 
  supabaseServiceKey && 
  supabaseUrl.includes('supabase.co') &&
  supabaseServiceKey.startsWith('eyJ');

let supabase = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('✅ Supabase client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error.message);
    supabase = null;
  }
} else {
  console.log('⚠️  Supabase not configured. Please set up your environment variables.');
  console.log('   See SUPABASE_SETUP.md for detailed instructions.');
}

module.exports = {
  supabase,
  isSupabaseConfigured
};
