const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

// Crear cliente de Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware de autenticación que usa Supabase
const authenticateJWTWithSupabase = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }
    
    const token = authHeader.substring(7); // Remover 'Bearer '
    
    // Verificar el token JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    
    // Buscar el usuario en Supabase
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', decoded.id)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Agregar información del usuario a la request
    req.user = {
      id: user.user_id,
      email: user.email || decoded.email,
      name: user.full_name,
      userType: user.user_type,
      avatar: user.avatar_url,
      skills: user.skills,
      hourly_rate: user.hourly_rate,
      bio: user.bio,
      company: user.company
    };
    
    next();
    
  } catch (error) {
    console.error('Error en authenticateJWTWithSupabase:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Middleware opcional de autenticación
const optionalAuthWithSupabase = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const { data: user, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', decoded.id)
        .single();
      
      if (!error && user) {
        req.user = {
          id: user.user_id,
          email: user.email || decoded.email,
          name: user.full_name,
          userType: user.user_type,
          avatar: user.avatar_url,
          skills: user.skills,
          hourly_rate: user.hourly_rate,
          bio: user.bio,
          company: user.company
        };
      } else {
        req.user = null;
      }
    } catch (jwtError) {
      req.user = null;
    }
    
    next();
    
  } catch (error) {
    console.error('Error en optionalAuthWithSupabase:', error);
    req.user = null;
    next();
  }
};

// Middleware para requerir cliente
const requireClientWithSupabase = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticación requerida' });
  }
  
  if (req.user.userType !== 'client') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere cuenta de cliente.' });
  }
  
  next();
};

// Middleware para requerir freelancer
const requireFreelancerWithSupabase = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticación requerida' });
  }
  
  if (req.user.userType !== 'freelancer') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere cuenta de freelancer.' });
  }
  
  next();
};

module.exports = {
  authenticateJWTWithSupabase,
  optionalAuthWithSupabase,
  requireClientWithSupabase,
  requireFreelancerWithSupabase
};