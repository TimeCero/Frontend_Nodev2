require('dotenv').config();
const { supabase } = require('./config/supabase');
const crypto = require('crypto');

// Simular el objeto req.user que viene de Passport
function createMockGoogleUser(email) {
  return {
    id: 'google_123456',
    email: email,
    name: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
    userType: 'client'
  };
}

function createMockGithubUser(email, username) {
  return {
    id: 'github_789012',
    email: email,
    username: username,
    name: 'Test GitHub User',
    avatar: 'https://example.com/github-avatar.jpg',
    userType: 'freelancer'
  };
}

// Simular el flujo OAuth de Google
async function simulateGoogleOAuth(user) {
  try {
    console.log('🔍 Simulando flujo OAuth de Google...');
    const userEmail = user.email;
    
    // Check if user profile already exists
    const { data: existingProfile, error: getProfileError } = await supabase
      .from('user_profiles')
      .select('user_id, email')
      .eq('email', userEmail)
      .single();
    
    console.log('Resultado búsqueda Google:', { existingProfile, getProfileError });
    
    if (existingProfile && !getProfileError) {
      console.log('✅ User profile already exists:', user.email);
      return { success: true, action: 'updated' };
    } else if (getProfileError && getProfileError.code === 'PGRST116') {
      // User doesn't exist, create new profile
      console.log('📧 New Google user detected:', user.email);
      
      const tempUserId = crypto.randomUUID();
      
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: tempUserId,
          email: userEmail,
          user_type: 'client',
          avatar_url: user.avatar
        });
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
        // If it's a duplicate error, just log it and continue
        if (profileError.code !== '23505') {
          console.log('❌ Error no relacionado con duplicados');
          return { success: false, error: profileError };
        } else {
          console.log('✅ User already exists, skipping creation');
          return { success: true, action: 'skipped' };
        }
      } else {
        console.log('✅ User profile created successfully:', tempUserId);
        return { success: true, action: 'created' };
      }
    } else {
      console.error('Error checking existing profile:', getProfileError);
      return { success: false, error: getProfileError };
    }
  } catch (error) {
    console.error('Error en simulación Google:', error);
    return { success: false, error };
  }
}

// Simular el flujo OAuth de GitHub
async function simulateGithubOAuth(user) {
  try {
    console.log('🔍 Simulando flujo OAuth de GitHub...');
    const userEmail = user.email || `github_${user.id}@noemail.local`;
    
    // Check if user profile already exists
    const { data: existingProfile, error: getProfileError } = await supabase
      .from('user_profiles')
      .select('user_id, email, github_username')
      .eq('email', userEmail)
      .single();
    
    console.log('Resultado búsqueda GitHub:', { existingProfile, getProfileError });
    
    if (existingProfile && !getProfileError) {
      console.log('✅ User profile already exists:', user.username);
      return { success: true, action: 'updated' };
    } else if (getProfileError && getProfileError.code === 'PGRST116') {
      // User doesn't exist, create new profile
      console.log('📧 New GitHub user detected:', user.username);
      
      const tempUserId = crypto.randomUUID();
      
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: tempUserId,
          email: userEmail,
          user_type: 'freelancer',
          github_username: user.username,
          avatar_url: user.avatar
        });
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
        // If it's a duplicate error, just log it and continue
        if (profileError.code !== '23505') {
          console.log('❌ Error no relacionado con duplicados');
          return { success: false, error: profileError };
        } else {
          console.log('✅ User already exists, skipping creation');
          return { success: true, action: 'skipped' };
        }
      } else {
        console.log('✅ User profile created successfully:', tempUserId);
        return { success: true, action: 'created' };
      }
    } else {
      console.error('Error checking existing profile:', getProfileError);
      return { success: false, error: getProfileError };
    }
  } catch (error) {
    console.error('Error en simulación GitHub:', error);
    return { success: false, error };
  }
}

async function testOAuthFlows() {
  const testEmail = 'oauth-test@example.com';
  
  console.log('🧪 Probando flujos OAuth completos\n');
  
  // Limpiar
  await supabase.from('user_profiles').delete().eq('email', testEmail);
  
  // Test 1: Usuario nuevo con Google
  console.log('=== TEST 1: Usuario nuevo con Google ===');
  const googleUser = createMockGoogleUser(testEmail);
  const googleResult1 = await simulateGoogleOAuth(googleUser);
  console.log('Resultado:', googleResult1);
  
  // Test 2: Mismo usuario intenta con GitHub
  console.log('\n=== TEST 2: Mismo email intenta con GitHub ===');
  const githubUser = createMockGithubUser(testEmail, 'testuser');
  const githubResult = await simulateGithubOAuth(githubUser);
  console.log('Resultado:', githubResult);
  
  // Test 3: Usuario Google intenta login de nuevo
  console.log('\n=== TEST 3: Usuario Google login de nuevo ===');
  const googleResult2 = await simulateGoogleOAuth(googleUser);
  console.log('Resultado:', googleResult2);
  
  // Verificar estado final
  const { data: finalUsers } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', testEmail);
  
  console.log('\n📊 Estado final:');
  console.log(`Usuarios con email ${testEmail}:`, finalUsers?.length || 0);
  finalUsers?.forEach((user, index) => {
    console.log(`  ${index + 1}. ${user.user_type} - ${user.full_name || 'Sin nombre'} (${user.user_id})`);
  });
  
  // Limpiar
  await supabase.from('user_profiles').delete().eq('email', testEmail);
  console.log('\n🧹 Limpieza completada');
}

testOAuthFlows();