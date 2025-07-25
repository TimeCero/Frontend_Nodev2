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


// Create project
router.post('/projects', async (req, res) => {
  try {
    // Verificar token de autenticación local
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token de autenticación requerido' });
    }

    // Verificar token con el sistema de autenticación local
    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_jwt_secret_aqui');
    } catch (error) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Verificar que el usuario sea cliente
    if (decoded.userType !== 'client') {
      return res.status(403).json({ message: 'Solo los clientes pueden crear proyectos' });
    }

    const projectData = req.body;
    
    // Validar datos requeridos
    if (!projectData.title || !projectData.description || !projectData.client_id) {
      return res.status(400).json({ message: 'Faltan datos requeridos del proyecto' });
    }

    // Verificar que el client_id coincida con el usuario autenticado
    if (projectData.client_id !== decoded.id) {
      return res.status(403).json({ message: 'No autorizado para crear proyectos para otro usuario' });
    }

    // Crear proyecto usando Supabase con privilegios de servicio
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...projectData,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating project in Supabase:', error);
        return res.status(500).json({ 
          message: 'Error al crear el proyecto en la base de datos',
          error: error.message 
        });
      }

      res.status(201).json({
        message: 'Proyecto creado exitosamente',
        project: data
      });
    } else {
      res.status(500).json({ message: 'Supabase no está configurado' });
    }

  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Ruta para obtener los proyectos del cliente autenticado (DEBE IR ANTES de /projects/:id)
router.get('/projects/my', verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          user_profiles!projects_client_id_fkey(
            user_id,
            email,
            full_name,
            company_name,
            avatar_url,
            location,
            bio,
            industry,
            user_type
          )
        `)
        .eq('client_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user projects:', error);
        return res.status(500).json({ 
          message: 'Error al obtener los proyectos',
          error: error.message 
        });
      }

      res.json(data || []);
    } else {
      res.status(500).json({ message: 'Supabase no está configurado' });
    }

  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Obtener detalles de un proyecto específico
router.get('/projects/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({ message: 'ID de proyecto inválido' });
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          user_profiles!projects_client_id_fkey(
            full_name,
            company_name,
            avatar_url,
            location,
            bio,
            industry
          )
        `)
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ message: 'Proyecto no encontrado' });
        }
        return res.status(500).json({ 
          message: 'Error al obtener el proyecto',
          error: error.message 
        });
      }

      res.json({ project: data });
    } else {
      res.status(500).json({ message: 'Supabase no está configurado' });
    }

  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Obtener aplicaciones de un proyecto específico
router.get('/projects/:id/applications', verifySupabaseToken, async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({ message: 'ID de proyecto inválido' });
    }

    if (isSupabaseConfigured && supabase) {
      // Primero verificar que el usuario es el dueño del proyecto
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('client_id')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        return res.status(404).json({ message: 'Proyecto no encontrado' });
      }

      // Verificar que el usuario es el dueño del proyecto
      if (project.client_id !== userId) {
        return res.status(403).json({ message: 'No tienes permisos para ver las aplicaciones de este proyecto' });
      }

      const { data, error } = await supabase
        .from('project_applications')
        .select(`
          *,
          user_profiles!project_applications_freelancer_id_fkey(
            full_name,
            avatar_url,
            skills,
            hourly_rate,
            bio
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        return res.status(500).json({ 
          message: 'Error al obtener las aplicaciones',
          error: error.message 
        });
      }

      res.json({ applications: data || [] });
    } else {
      res.status(500).json({ message: 'Supabase no está configurado' });
    }

  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Obtener la aplicación del usuario actual para un proyecto específico
router.get('/projects/:id/user-application', verifySupabaseToken, async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    // Validar que el projectId sea un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({ message: 'ID de proyecto inválido' });
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('project_applications')
        .select('*')
        .eq('project_id', projectId)
        .eq('freelancer_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching user application:', error);
        return res.status(500).json({ 
          message: 'Error al obtener la aplicación del usuario',
          error: error.message 
        });
      }

      res.json({ application: data || null });
    } else {
      res.status(500).json({ message: 'Supabase no está configurado' });
    }

  } catch (error) {
    console.error('Error fetching user application:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Obtener el número total de aplicaciones de un proyecto
router.get('/projects/:id/applications-count', verifySupabaseToken, async (req, res) => {
  try {
    const projectId = req.params.id;

    // Validar que el projectId sea un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({ message: 'ID de proyecto inválido' });
    }

    if (isSupabaseConfigured && supabase) {
      const { count, error } = await supabase
        .from('project_applications')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching applications count:', error);
        return res.status(500).json({ 
          message: 'Error al obtener el número de aplicaciones',
          error: error.message 
        });
      }

      res.json({ count: count || 0 });
    } else {
      res.status(500).json({ message: 'Supabase no está configurado' });
    }

  } catch (error) {
    console.error('Error fetching applications count:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Aceptar o rechazar una aplicación
router.patch('/applications/:id/status', async (req, res) => {
  try {
    const applicationId = req.params.id;
    const { status } = req.body; // 'accepted' or 'rejected'
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token de autenticación requerido' });
    }

    // Verificar token
    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_jwt_secret_aqui');
      console.log('Debug - Messages endpoint - Full decoded token:', decoded);
      console.log('Debug - Messages endpoint - User ID from token (sub):', decoded.sub);
      console.log('Debug - Messages endpoint - User ID from token (id):', decoded.id);
    } catch (error) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Validar status
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido. Debe ser "accepted" o "rejected"' });
    }

    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(applicationId)) {
      return res.status(400).json({ message: 'ID de aplicación inválido' });
    }

    if (isSupabaseConfigured && supabase) {
      // Verificar que el usuario es el dueño del proyecto
      const { data: application, error: appError } = await supabase
        .from('project_applications')
        .select(`
          *,
          projects!project_applications_project_id_fkey(
            client_id
          )
        `)
        .eq('id', applicationId)
        .single();

      if (appError || !application) {
        return res.status(404).json({ message: 'Aplicación no encontrada' });
      }

      if (application.projects.client_id !== decoded.id) {
        return res.status(403).json({ message: 'No autorizado para modificar esta aplicación' });
      }

      // Actualizar el status de la aplicación
      const { data, error } = await supabase
        .from('project_applications')
        .update({ 
          status
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating application:', error);
        return res.status(500).json({ 
          message: 'Error al actualizar la aplicación',
          error: error.message 
        });
      }

      res.json({ 
        message: `Aplicación ${status === 'accepted' ? 'aceptada' : 'rechazada'} exitosamente`,
        application: data
      });
    } else {
      res.status(500).json({ message: 'Supabase no está configurado' });
    }

  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Obtener mensajes de un proyecto
router.get('/projects/:id/messages', async (req, res) => {
  try {
    const projectId = req.params.id;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token de autenticación requerido' });
    }

    // Verificar token
    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_jwt_secret_aqui');
    } catch (error) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({ message: 'ID de proyecto inválido' });
    }

    if (isSupabaseConfigured && supabase) {
      // Verificar que el usuario tiene acceso al proyecto
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('client_id')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        return res.status(404).json({ message: 'Proyecto no encontrado' });
      }

      console.log('Debug - Messages endpoint - Project client_id:', project.client_id);
      console.log('Debug - Messages endpoint - User ID:', decoded.id);
      
      // Verificar si el usuario es el cliente o tiene una aplicación aceptada
      let hasAccess = project.client_id === decoded.id;
      console.log('Debug - Messages endpoint - Is project owner:', hasAccess);
      
      if (!hasAccess) {
        console.log('Debug - Messages endpoint - Checking for accepted application');
        const { data: application } = await supabase
          .from('project_applications')
          .select('status')
          .eq('project_id', projectId)
          .eq('freelancer_id', decoded.id)
          .eq('status', 'accepted')
          .single();
        
        console.log('Debug - Messages endpoint - Application found:', !!application);
        hasAccess = !!application;
      }

      if (!hasAccess) {
        console.log('Debug - Messages endpoint - Access denied for user:', decoded.id);
        return res.status(403).json({ message: 'No autorizado para ver los mensajes de este proyecto' });
      }
      
      console.log('Debug - Messages endpoint - Access granted for user:', decoded.id);

      // Obtener mensajes
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          user_profiles!messages_sender_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return res.status(500).json({ 
          message: 'Error al obtener los mensajes',
          error: error.message 
        });
      }

      res.json({ messages: data || [] });
    } else {
      res.status(500).json({ message: 'Supabase no está configurado' });
    }

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Enviar un mensaje
router.post('/projects/:id/messages', async (req, res) => {
  try {
    const projectId = req.params.id;
    const { content } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token de autenticación requerido' });
    }

    // Verificar token
    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_jwt_secret_aqui');
    } catch (error) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Validar datos
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'El contenido del mensaje es requerido' });
    }

    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({ message: 'ID de proyecto inválido' });
    }

    if (isSupabaseConfigured && supabase) {
      // Verificar que el usuario tiene acceso al proyecto
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('client_id')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        return res.status(404).json({ message: 'Proyecto no encontrado' });
      }

      // Verificar si el usuario es el cliente o tiene una aplicación aceptada
      let hasAccess = project.client_id === decoded.id;
      
      if (!hasAccess) {
        const { data: application } = await supabase
          .from('project_applications')
          .select('status')
          .eq('project_id', projectId)
          .eq('freelancer_id', decoded.id)
          .eq('status', 'accepted')
          .single();
        
        hasAccess = !!application;
      }

      if (!hasAccess) {
        return res.status(403).json({ message: 'No autorizado para enviar mensajes en este proyecto' });
      }

      // Crear mensaje
      const { data, error } = await supabase
        .from('messages')
        .insert({
          project_id: projectId,
          sender_id: decoded.id,
          content: content.trim(),
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          user_profiles!messages_sender_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Error creating message:', error);
        return res.status(500).json({ 
          message: 'Error al enviar el mensaje',
          error: error.message 
        });
      }

      res.status(201).json({ 
        message: 'Mensaje enviado exitosamente',
        data: data
      });
    } else {
      res.status(500).json({ message: 'Supabase no está configurado' });
    }

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Crear aplicación a proyecto
router.post('/applications', verifySupabaseToken, async (req, res) => {
  try {
    const { project_id, proposal, cover_letter, estimated_duration, proposed_rate } = req.body;
    const decoded = req.user;

    // Validaciones básicas
    if (!project_id || !proposal || !cover_letter || !estimated_duration) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos: project_id, proposal, cover_letter, estimated_duration' 
      });
    }

    if (isSupabaseConfigured && supabase) {
      // Verificar que el proyecto existe y está abierto
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, status, client_id')
        .eq('id', project_id)
        .single();

      if (projectError || !project) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }

      if (project.status !== 'open') {
        return res.status(400).json({ error: 'El proyecto no está abierto para aplicaciones' });
      }

      // Verificar que el usuario no es el cliente del proyecto
      if (project.client_id === decoded.id) {
        return res.status(400).json({ error: 'No puedes aplicar a tu propio proyecto' });
      }

      // Verificar que no existe ya una aplicación
      const { data: existingApplication } = await supabase
        .from('project_applications')
        .select('id')
        .eq('project_id', project_id)
        .eq('freelancer_id', decoded.id)
        .single();

      if (existingApplication) {
        return res.status(400).json({ error: 'Ya has aplicado a este proyecto' });
      }

      // Crear aplicación
      const applicationData = {
        project_id,
        freelancer_id: decoded.id,
        proposal: proposal.trim(),
        cover_letter: cover_letter.trim(),
        estimated_duration: estimated_duration.trim(),
        status: 'pending',
        created_at: new Date().toISOString()
      };

      if (proposed_rate) {
        applicationData.proposed_rate = parseFloat(proposed_rate);
      }

      const { data, error } = await supabase
        .from('project_applications')
        .insert([applicationData])
        .select('*')
        .single();

      if (error) {
        console.error('Error creating application:', error);
        return res.status(500).json({ 
          error: 'Error al crear la aplicación',
          details: error.message 
        });
      }

      res.status(201).json({ 
        message: 'Aplicación enviada exitosamente',
        application: data
      });
    } else {
      res.status(500).json({ error: 'Supabase no está configurado' });
    }

  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
});

// Crear una review
router.post('/reviews', verifySupabaseToken, async (req, res) => {
  try {
    const { project_id, reviewee_id, rating, comment } = req.body;
    const user = req.user;

    // Validar datos
    if (!project_id || !reviewee_id || !rating) {
      return res.status(400).json({ message: 'project_id, reviewee_id y rating son requeridos' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'El rating debe estar entre 1 y 5' });
    }

    // Validar UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(project_id) || !uuidRegex.test(reviewee_id)) {
      return res.status(400).json({ message: 'IDs inválidos' });
    }

    if (isSupabaseConfigured && supabase) {
      // Verificar que el proyecto existe y el usuario tiene permisos
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('client_id, status')
        .eq('id', project_id)
        .single();

      if (projectError || !project) {
        return res.status(404).json({ message: 'Proyecto no encontrado' });
      }

      // Verificar que el usuario puede hacer review (es cliente o freelancer aceptado)
      let canReview = project.client_id === user.id;
      
      if (!canReview) {
        const { data: application } = await supabase
          .from('project_applications')
          .select('status')
          .eq('project_id', project_id)
          .eq('freelancer_id', user.id)
          .eq('status', 'accepted')
          .single();
        
        canReview = !!application;
      }

      if (!canReview) {
        return res.status(403).json({ message: 'No autorizado para hacer review en este proyecto' });
      }

      // Verificar que no existe ya una review del mismo reviewer para el mismo reviewee en el mismo proyecto
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('project_id', project_id)
        .eq('reviewer_id', user.id)
        .eq('reviewee_id', reviewee_id)
        .single();

      if (existingReview) {
        return res.status(400).json({ message: 'Ya has hecho una review para este usuario en este proyecto' });
      }

      // Crear review
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          project_id,
          reviewer_id: user.id,
          reviewee_id,
          rating,
          comment: comment || null,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          reviewer:user_profiles!reviews_reviewer_id_fkey(
            full_name,
            avatar_url
          ),
          reviewee:user_profiles!reviews_reviewee_id_fkey(
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Error creating review:', error);
        return res.status(500).json({ 
          message: 'Error al crear la review',
          error: error.message 
        });
      }

      res.status(201).json({ 
        message: 'Review creada exitosamente',
        review: data
      });
    } else {
      res.status(500).json({ message: 'Supabase no está configurado' });
    }

  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Obtener perfil de un usuario específico
router.get('/users/:id/profile', async (req, res) => {
  try {
    const userId = req.params.id;

    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    if (isSupabaseConfigured && supabase) {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return res.status(404).json({ 
          message: 'Perfil de usuario no encontrado',
          error: error.message 
        });
      }

      res.json({ profile });
    } else {
      res.status(503).json({ 
        message: 'Supabase no configurado',
        error: 'Please set up Supabase environment variables' 
      });
    }
  } catch (error) {
    console.error('Error in /users/:id/profile:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Get freelancer profile by ID (using the primary key 'id')
router.get('/freelancers/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que sea un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ message: 'ID de freelancer inválido - debe ser un UUID' });
    }

    if (isSupabaseConfigured && supabase) {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .eq('user_type', 'freelancer')
        .single();

      if (error) {
        console.error('Error fetching freelancer profile:', error);
        return res.status(404).json({ 
          message: 'Perfil de freelancer no encontrado',
          error: error.message 
        });
      }

      // Asegurar que user_id esté disponible para mensajes directos
      res.json({ 
        profile: {
          ...profile,
          // Destacar que user_id debe usarse para mensajes
          messaging_id: profile.user_id
        }
      });
    } else {
      res.status(503).json({ message: 'Supabase no configurado' });
    }
  } catch (error) {
    console.error('Error in freelancer profile endpoint:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener reviews de un usuario
router.get('/users/:id/reviews', async (req, res) => {
  try {
    const userId = req.params.id;

    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:user_profiles!reviews_reviewer_id_fkey(
            full_name,
            avatar_url
          ),
          projects(
            title
          )
        `)
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        return res.status(500).json({ 
          message: 'Error al obtener las reviews',
          error: error.message 
        });
      }

      // Calcular estadísticas
      const reviews = data || [];
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0;

      res.json({ 
        reviews,
        stats: {
          total: totalReviews,
          average: Math.round(averageRating * 10) / 10
        }
      });
    } else {
      res.status(500).json({ message: 'Supabase no está configurado' });
    }

  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Enviar mensaje directo a un usuario
router.post('/messages', verifySupabaseToken, async (req, res) => {
  try {
    const { recipient_id, content } = req.body;
    const user = req.user;

    // Validar datos
    if (!recipient_id || !content) {
      return res.status(400).json({ message: 'recipient_id y content son requeridos' });
    }

    if (!content.trim()) {
      return res.status(400).json({ message: 'El contenido del mensaje no puede estar vacío' });
    }

    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(recipient_id)) {
      return res.status(400).json({ message: 'ID de destinatario inválido' });
    }

    // No permitir enviarse mensajes a sí mismo
    if (recipient_id === user.id) {
      return res.status(400).json({ message: 'No puedes enviarte mensajes a ti mismo' });
    }

    if (isSupabaseConfigured && supabase) {
      // Verificar que el destinatario existe
      const { data: recipient, error: recipientError } = await supabase
        .from('user_profiles')
        .select('user_id, full_name')
        .eq('user_id', recipient_id)
        .single();

      if (recipientError || !recipient) {
        return res.status(404).json({ message: 'Usuario destinatario no encontrado' });
      }

      // Crear el mensaje directo
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id,
          content: content.trim(),
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          sender:user_profiles!direct_messages_sender_id_fkey(
            user_id,
            full_name,
            avatar_url
          ),
          recipient:user_profiles!direct_messages_recipient_id_fkey(
            user_id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Error creating direct message:', error);
        return res.status(500).json({ 
          message: 'Error al enviar el mensaje',
          error: error.message 
        });
      }

      res.status(201).json({ 
        message: 'Mensaje enviado exitosamente',
        data 
      });
    } else {
      res.status(503).json({ 
        message: 'Supabase no configurado',
        error: 'Please set up Supabase environment variables' 
      });
    }
  } catch (error) {
    console.error('Error in /messages:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Obtener conversaciones del usuario
router.get('/messages/conversations', verifySupabaseToken, async (req, res) => {
  try {
    const user = req.user;

    if (isSupabaseConfigured && supabase) {
      // Obtener todas las conversaciones donde el usuario participa
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:user_profiles!direct_messages_sender_id_fkey(
            user_id,
            full_name,
            avatar_url
          ),
          recipient:user_profiles!direct_messages_recipient_id_fkey(
            user_id,
            full_name,
            avatar_url
          )
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return res.status(500).json({ 
          message: 'Error al obtener las conversaciones',
          error: error.message 
        });
      }

      // Agrupar mensajes por conversación
      const conversations = {};
      data.forEach(message => {
        const otherUserId = message.sender_id === user.id ? message.recipient_id : message.sender_id;
        const otherUser = message.sender_id === user.id ? message.recipient : message.sender;
        
        if (!conversations[otherUserId]) {
          conversations[otherUserId] = {
            user: otherUser,
            messages: [],
            lastMessage: null
          };
        }
        
        conversations[otherUserId].messages.push(message);
        if (!conversations[otherUserId].lastMessage || 
            new Date(message.created_at) > new Date(conversations[otherUserId].lastMessage.created_at)) {
          conversations[otherUserId].lastMessage = message;
        }
      });

      // Convertir a array y ordenar por último mensaje
      const conversationsList = Object.values(conversations)
        .sort((a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at));

      res.json({ conversations: conversationsList });
    } else {
      res.status(503).json({ 
        message: 'Supabase no configurado',
        error: 'Please set up Supabase environment variables' 
      });
    }
  } catch (error) {
    console.error('Error in /messages/conversations:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Obtener mensajes de una conversación específica
router.get('/messages/conversation/:userId', verifySupabaseToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = req.user;

    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:user_profiles!direct_messages_sender_id_fkey(
            user_id,
            full_name,
            avatar_url
          ),
          recipient:user_profiles!direct_messages_recipient_id_fkey(
            user_id,
            full_name,
            avatar_url
          )
        `)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching conversation:', error);
        return res.status(500).json({ 
          message: 'Error al obtener la conversación',
          error: error.message 
        });
      }

      res.json({ messages: data || [] });
    } else {
      res.status(503).json({ 
        message: 'Supabase no configurado',
        error: 'Please set up Supabase environment variables' 
      });
    }
  } catch (error) {
    console.error('Error in /messages/conversation/:userId:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Endpoint para obtener las aplicaciones del freelancer autenticado
router.get('/my-applications', verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('project_applications')
        .select(`
          *,
          projects (
            id,
            title,
            description,
            budget_min,
            budget_max,
            client_id,
            status,
            created_at,
            user_profiles!projects_client_id_fkey (
              full_name,
              avatar_url
            )
          )
        `)
        .eq('freelancer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching my applications:', error);
        return res.status(500).json({ 
          message: 'Error al obtener las aplicaciones',
          error: error.message 
        });
      }

      res.json(data || []);
    } else {
      res.status(503).json({ 
        message: 'Supabase no configurado',
        error: 'Please set up Supabase environment variables' 
      });
    }
  } catch (error) {
    console.error('Error in /my-applications:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Actualizar estado de un proyecto (finalizar, cancelar)
router.patch('/projects/:id/status', verifySupabaseToken, async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    const { status } = req.body;

    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({ message: 'ID de proyecto inválido' });
    }

    // Validar estado
    const validStatuses = ['completed', 'cancelled', 'open', 'in_progress'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    if (isSupabaseConfigured && supabase) {
      // Verificar que el usuario es el dueño del proyecto
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('client_id')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        return res.status(404).json({ message: 'Proyecto no encontrado' });
      }

      if (project.client_id !== userId) {
        return res.status(403).json({ message: 'No tienes permisos para modificar este proyecto' });
      }

      // Actualizar el estado del proyecto
      const { data, error } = await supabase
        .from('projects')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) {
        console.error('Error updating project status:', error);
        return res.status(500).json({ 
          message: 'Error al actualizar el estado del proyecto',
          error: error.message 
        });
      }

      res.json({ 
        message: 'Estado del proyecto actualizado exitosamente',
        project: data 
      });
    } else {
      res.status(500).json({ message: 'Supabase no está configurado' });
    }

  } catch (error) {
    console.error('Error updating project status:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Eliminar un proyecto
router.delete('/projects/:id', verifySupabaseToken, async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    // Validar UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({ message: 'ID de proyecto inválido' });
    }

    if (isSupabaseConfigured && supabase) {
      // Verificar que el usuario es el dueño del proyecto
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('client_id, status')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        return res.status(404).json({ message: 'Proyecto no encontrado' });
      }

      if (project.client_id !== userId) {
        return res.status(403).json({ message: 'No tienes permisos para eliminar este proyecto' });
      }

      // Solo permitir eliminar proyectos que no estén en progreso
      if (project.status === 'in_progress') {
        return res.status(400).json({ message: 'No se puede eliminar un proyecto en progreso' });
      }

      // Eliminar el proyecto (las aplicaciones se eliminarán automáticamente por CASCADE)
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        console.error('Error deleting project:', error);
        return res.status(500).json({ 
          message: 'Error al eliminar el proyecto',
          error: error.message 
        });
      }

      res.json({ message: 'Proyecto eliminado exitosamente' });
    } else {
      res.status(500).json({ message: 'Supabase no está configurado' });
    }

  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

module.exports = router;