const jwt = require('jsonwebtoken');
const { getUserById } = require('../config/passport');

// Middleware para verificar JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Token inválido' });
      }
      
      // Obtener información completa del usuario
      const user = getUserById(decoded.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: 'Token de acceso requerido' });
  }
};

// Middleware para verificar que el usuario sea un cliente
const requireClient = (req, res, next) => {
  if (req.user && req.user.userType === 'client') {
    next();
  } else {
    res.status(403).json({ error: 'Acceso restringido a clientes' });
  }
};

// Middleware para verificar que el usuario sea un freelancer
const requireFreelancer = (req, res, next) => {
  if (req.user && req.user.userType === 'freelancer') {
    next();
  } else {
    res.status(403).json({ error: 'Acceso restringido a freelancers' });
  }
};

// Middleware opcional de autenticación (no falla si no hay token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (!err) {
        const user = getUserById(decoded.id);
        if (user) {
          req.user = user;
        }
      }
      next();
    });
  } else {
    next();
  }
};

module.exports = {
  authenticateJWT,
  requireClient,
  requireFreelancer,
  optionalAuth
};