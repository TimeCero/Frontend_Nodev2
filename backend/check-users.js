require('dotenv').config();
const { supabase } = require('./config/supabase');

async function checkUsers() {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('email, user_type, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Usuarios actuales:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkUsers();