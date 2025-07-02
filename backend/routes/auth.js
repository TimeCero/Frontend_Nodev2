const express = require('express');
const crypto = require('crypto');
const { passport, generateJWT, getAllUsers } = require('../config/passport');
const { supabase, isSupabaseConfigured } = require('../config/supabase');
const { authenticateJWTWithSupabase, requireClientWithSupabase, requireFreelancerWithSupabase } = require('../middleware/supabaseAuthMiddleware');
const router = express.Router();

// Ruta para iniciar autenticación con Google (para clientes)
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

// Callback de Google OAuth
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed` }),
  async (req, res) => {
    try {
      // Create or update user in Supabase (if configured)
      if (isSupabaseConfigured && supabase) {
        try {
          const userEmail = req.user.email;
          
          // Use safe function to check and create user profile
          // Use the Passport user ID to maintain consistency
          const tempUserId = req.user.id;
          
          try {
            // First check if user already exists
            const { data: existingUser, error: checkError } = await supabase
              .rpc('check_user_exists', {
                p_email: userEmail
              });
            
            if (checkError) {
              console.error('Error checking existing user:', checkError);
              // Continue with creation attempt if check fails
            }
            
            if (existingUser && existingUser.length > 0) {
              // User exists, allow login
              console.log('✅ User already exists, allowing login:', userEmail);
              // Update avatar if needed
              try {
                await supabase
                  .from('user_profiles')
                  .update({ avatar_url: req.user.avatar })
                  .eq('email', userEmail);
              } catch (updateError) {
                console.log('Note: Could not update avatar:', updateError.message);
              }
            } else {
              // User doesn't exist, create new profile
              const { data: profileResult, error: profileError } = await supabase
                .rpc('safe_upsert_user_profile', {
                  p_email: userEmail,
                  p_user_id: tempUserId,
                  p_user_type: 'client',
                  p_avatar_url: req.user.avatar,
                  p_github_username: null
                });
              
              if (profileError) {
                if (profileError.code === 'P0001') {
                  // User was created by another process, allow login
                  console.log('✅ User was created concurrently, allowing login:', userEmail);
                } else if (profileError.code === 'P0002') {
                  // Concurrent access
                  console.log('⚠️ Concurrent access detected for:', userEmail);
                  return res.redirect(`${process.env.FRONTEND_URL}/login?error=concurrent_access&provider=google`);
                } else {
                  console.error('Profile creation error:', profileError);
                  return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
                }
              } else {
                console.log('✅ User profile created successfully:', profileResult[0]?.profile_user_id);
              }
            }
          } catch (error) {
            console.error('Unexpected error during profile creation:', error);
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
          }
        } catch (supabaseErr) {
          console.error('Supabase sync error:', supabaseErr);
        }
      }

      // Generate JWT (keeping existing flow for compatibility)
      const token = generateJWT(req.user);
      
      // Redirigir al frontend con el token
      res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}&userType=${req.user.userType}`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
    }
  }
);

// Ruta para iniciar autenticación con GitHub (para freelancers)
router.get('/github',
  passport.authenticate('github', { 
    scope: ['user:email', 'read:user'] 
  })
);

// Callback de GitHub OAuth
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=github_auth_failed` }),
  async (req, res) => {
    try {
      // Create or update user in Supabase (if configured)
      if (isSupabaseConfigured && supabase) {
        try {
          const userEmail = req.user.email || `github_${req.user.id}@noemail.local`;
          
          // Use safe function to check and create user profile
          // Use the Passport user ID to maintain consistency
          const tempUserId = req.user.id;
          
          try {
            // First check if user already exists
            const { data: existingUser, error: checkError } = await supabase
              .rpc('check_user_exists', {
                p_email: userEmail
              });
            
            if (checkError) {
              console.error('Error checking existing user:', checkError);
              // Continue with creation attempt if check fails
            }
            
            if (existingUser && existingUser.length > 0) {
              // User exists, allow login
              console.log('✅ User already exists, allowing login:', userEmail);
              // Update avatar and GitHub username if needed
              try {
                await supabase
                  .from('user_profiles')
                  .update({ 
                    avatar_url: req.user.avatar,
                    github_username: req.user.username
                  })
                  .eq('email', userEmail);
              } catch (updateError) {
                console.log('Note: Could not update profile:', updateError.message);
              }
            } else {
              // User doesn't exist, create new profile
              const { data: profileResult, error: profileError } = await supabase
                .rpc('safe_upsert_user_profile', {
                  p_email: userEmail,
                  p_user_id: tempUserId,
                  p_user_type: 'freelancer',
                  p_avatar_url: req.user.avatar,
                  p_github_username: req.user.username
                });
              
              if (profileError) {
                if (profileError.code === 'P0001') {
                  // User was created by another process, allow login
                  console.log('✅ User was created concurrently, allowing login:', userEmail);
                } else if (profileError.code === 'P0002') {
                  // Concurrent access
                  console.log('⚠️ Concurrent access detected for:', userEmail);
                  return res.redirect(`${process.env.FRONTEND_URL}/login?error=concurrent_access&provider=github`);
                } else {
                  console.error('Profile creation error:', profileError);
                  return res.redirect(`${process.env.FRONTEND_URL}/login?error=github_auth_failed`);
                }
              } else {
                console.log('✅ User profile created successfully:', profileResult[0]?.profile_user_id);
              }
            }
          } catch (error) {
            console.error('Unexpected error during profile creation:', error);
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=github_auth_failed`);
          }
        } catch (supabaseErr) {
          console.error('Supabase sync error:', supabaseErr);
        }
      }

      // Generate JWT (keeping existing flow for compatibility)
      const token = generateJWT(req.user);
      
      // Redirigir al frontend con el token
      res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}&userType=${req.user.userType}`);
    } catch (error) {
      console.error('GitHub callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=github_auth_failed`);
    }
  }
);

// Ruta para logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
    
    // Clear session data
    req.session.destroy((sessionErr) => {
      if (sessionErr) {
        console.error('Error destroying session:', sessionErr);
      }
    });
    
    // Clear cookies
    res.clearCookie('connect.sid');
    res.clearCookie('session');
    
    res.json({ message: 'Sesión cerrada exitosamente' });
  });
});

// Ruta GET para logout (para redirecciones)
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    
    // Clear session data
    req.session.destroy((sessionErr) => {
      if (sessionErr) {
        console.error('Error destroying session:', sessionErr);
      }
    });
    
    // Clear cookies
    res.clearCookie('connect.sid');
    res.clearCookie('session');
    
    // Redirect to login page
    res.redirect(`${process.env.FRONTEND_URL}/login?message=logged_out`);
  });
});

// Ruta para obtener información del usuario actual
router.get('/me', authenticateJWTWithSupabase, (req, res) => {
  if (req.user) {
    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        userType: req.user.userType,
        provider: req.user.provider,
        ...(req.user.userType === 'freelancer' && {
          username: req.user.username,
          githubProfile: req.user.githubProfile
        })
      }
    });
  } else {
    res.status(401).json({ error: 'No autenticado' });
  }
});

// Ruta para verificar token JWT
router.post('/verify-token', (req, res) => {

  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token requerido' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Token inválido' });
  }
});

// Ruta para verificar token JWT desde Authorization header
router.get('/verify', authenticateJWTWithSupabase, (req, res) => {
  if (req.user) {
    res.json({
      valid: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        userType: req.user.userType,
        provider: req.user.provider,
        ...(req.user.userType === 'freelancer' && {
          username: req.user.username,
          githubProfile: req.user.githubProfile
        })
      }
    });
  } else {
    res.status(401).json({ valid: false, error: 'Token inválido' });
  }
});

// Ruta de desarrollo para ver todos los usuarios registrados
router.get('/users', (req, res) => {
  const users = getAllUsers();
  res.json({
    total: users.length,
    clients: users.filter(u => u.userType === 'client').length,
    freelancers: users.filter(u => u.userType === 'freelancer').length,
    users: users.map(user => ({
      id: user.id,
      full_name: user.name,
      email: user.email,
      userType: user.userType,
      provider: user.provider,
      createdAt: user.createdAt
    }))
  });
});

module.exports = router;