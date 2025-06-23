const express = require('express');
const { supabase, isSupabaseConfigured } = require('../config/supabase');
const { verifySupabaseToken, optionalSupabaseAuth } = require('../middleware/supabaseAuth');
const router = express.Router();

// Create or update user profile
router.post('/profile', verifySupabaseToken, async (req, res) => {
  try {
    const { 
      user_type, 
      full_name,
      bio, 
      location,
      skills, 
      hourly_rate, 
      github_username, 
      portfolio_url,
      linkedin_url,
      website_url,
      company_name,
      industry,
      availability_status,
      avatar_url
    } = req.body;
    
    // Try to save to Supabase if configured (now supports users without email)
    if (isSupabaseConfigured && supabase) {
      const profileData = {
        user_id: req.user.id,
        email: req.user.email,
        user_type,
        full_name,
        bio,
        location,
        skills,
        hourly_rate: hourly_rate === '' ? null : hourly_rate,
        github_username,
        portfolio_url,
        linkedin_url,
        website_url,
        company_name,
        industry,
        availability_status,
        updated_at: new Date().toISOString()
      };
      
      // Solo actualizar avatar_url si se proporciona
      if (avatar_url) {
        profileData.avatar_url = avatar_url;
      }
      
      // Primero verificar si ya existe un perfil con este user_id
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', req.user.id)
        .single();
      
      let data, error;
      
      if (existingProfile) {
        // Si existe, hacer update sin incluir email para evitar conflictos
        const updateData = { ...profileData };
        delete updateData.email; // Remover email del update
        delete updateData.user_id; // Remover user_id del update
        
        const result = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('user_id', req.user.id)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      } else {
        // Si no existe, crear nuevo perfil
        const result = await supabase
          .from('user_profiles')
          .insert(profileData)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }
      
      if (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
      }
      
      // Normalizar el campo avatar para compatibilidad
      if (data) {
        data.avatar = data.avatar_url || data.avatar;
        data.picture = data.avatar_url || data.avatar;
      }
      
      res.json({ success: true, profile: data });
    } else {
      return res.status(503).json({ 
        error: 'Supabase not configured', 
        message: 'Please set up Supabase environment variables' 
      });
    }
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', verifySupabaseToken, async (req, res) => {
  try {
    // Try to get from Supabase first if configured (now supports users without email)
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', req.user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return res.status(500).json({ error: 'Failed to fetch profile' });
      }
      
      // Normalizar el campo avatar para compatibilidad
      if (data) {
        data.avatar = data.avatar_url || data.avatar;
        data.picture = data.avatar_url || data.avatar;
      }
      
      res.json({ profile: data || null });
     } else {
       return res.status(503).json({ 
         error: 'Supabase not configured', 
         message: 'Please set up Supabase environment variables' 
       });
     }
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Para obtener freelancers con paginación
router.get('/freelancers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, bio, skills, location, hourly_rate, portfolio_url')
      .eq('user_type', 'freelancer');

    if (error) {
      console.error('Error fetching freelancers:', error);
      return res.status(500).json({ error: 'Error fetching freelancers' });
    }

    res.json({ freelancers: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Unexpected error' });
  }
});

// Get all clients
router.get('/clients', optionalSupabaseAuth, async (req, res) => {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return res.json({ 
        clients: [], 
        message: 'Supabase not configured - showing empty list' 
      });
    }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, email, bio, created_at')
      .eq('user_type', 'client');
    
    if (error) {
      console.error('Error fetching clients:', error);
      return res.status(500).json({ error: 'Failed to fetch clients' });
    }
    
    res.json({ clients: data || [] });
  } catch (error) {
    console.error('Clients fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint (for frontend to check if user is authenticated)
router.get('/verify', verifySupabaseToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
});

// Get user statistics
router.get('/user-stats', optionalSupabaseAuth, async (req, res) => {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return res.json({ 
        stats: {
          total_freelancers: 0,
          total_clients: 0,
          total_users: 0
        },
        message: 'Supabase not configured - showing zero stats'
      });
    }
    
    const { data: freelancers, error: freelancerError } = await supabase
      .from('user_profiles')
      .select('user_id', { count: 'exact' })
      .eq('user_type', 'freelancer');
    
    const { data: clients, error: clientError } = await supabase
      .from('user_profiles')
      .select('user_id', { count: 'exact' })
      .eq('user_type', 'client');
    
    if (freelancerError || clientError) {
      console.error('Error fetching stats:', freelancerError || clientError);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }
    
    res.json({
      stats: {
        total_freelancers: freelancers?.length || 0,
        total_clients: clients?.length || 0,
        total_users: (freelancers?.length || 0) + (clients?.length || 0)
      }
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;