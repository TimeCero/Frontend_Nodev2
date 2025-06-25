const jwt = require('jsonwebtoken');
const { supabase, isSupabaseConfigured } = require('../config/supabase');

// Middleware to verify Supabase JWT tokens
const verifySupabaseToken = async (req, res, next) => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured || !supabase) {
      return res.status(503).json({ 
        error: 'Supabase not configured', 
        message: 'Please set up Supabase environment variables' 
      });
    }
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token using local JWT secret (not Supabase JWT secret)
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'JWT secret not configured' });
    }

    const decoded = jwt.verify(token, jwtSecret);

    // For local authentication, use decoded token info
    // Only try to get profile from Supabase if user has email (was synced)
    let profile = null;
    if (decoded.email && isSupabaseConfigured) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('email', decoded.email)
          .single();

        if (!profileError) {
          profile = profileData;
        }
      } catch (profileErr) {
        console.log('Profile not found in Supabase for:', decoded.email);
      }
    }

    // Normalizar avatar desde diferentes fuentes
    const avatar = profile?.avatar_url || decoded.avatar || decoded.picture;

    // Attach user info to request using decoded token
    req.user = {
      id: decoded.id,
      email: decoded.email,
      userType: decoded.userType,
      provider: decoded.provider,
      name: decoded.name || profile?.full_name,
      avatar: avatar,
      avatar_url: avatar,
      picture: avatar,
      profile: profile
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Optional middleware - doesn't fail if no token provided
const optionalSupabaseAuth = async (req, res, next) => {
  try {
    // If Supabase is not configured, continue without user info
    if (!isSupabaseConfigured || !supabase) {
      req.user = null;
      return next();
    }
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user info
      req.user = null;
      return next();
    }
    
    const token = authHeader.substring(7);
    
    // Try to verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      req.user = null;
      return next();
    }
    
    try {
      const decoded = jwt.verify(token, jwtSecret);
      
      // Get user from Supabase
      const { data: user, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        req.user = null;
        return next();
      }
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.user.id)
        .single();
      
      // Normalizar avatar desde diferentes fuentes
      const avatar = profile?.avatar_url || 
                    user.user.user_metadata?.avatar_url || 
                    user.user.user_metadata?.picture || 
                    user.user.user_metadata?.avatar;

      req.user = {
        id: user.user.id,
        email: user.user.email,
        ...user.user.user_metadata,
        avatar: avatar,
        avatar_url: avatar,
        picture: avatar,
        profile: profile || null
      };
      
    } catch (tokenError) {
      // Invalid token, continue without user
      req.user = null;
    }
    
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    req.user = null;
    next();
  }
};

module.exports = {
  verifySupabaseToken,
  optionalSupabaseAuth
};