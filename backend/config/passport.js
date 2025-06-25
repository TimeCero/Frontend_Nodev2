const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Simulación de base de datos en memoria (después reemplazaremos con DynamoDB)
const users = new Map();

// Configuración de Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Buscar usuario existente
    let user = Array.from(users.values()).find(u => u.googleId === profile.id);
    
    if (user) {
      return done(null, user);
    }
    
    // Crear nuevo usuario cliente
    user = {
      id: crypto.randomUUID(),
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      avatar: profile.photos[0].value,
      provider: 'google',
      userType: 'client', // Los usuarios de Google son clientes
      createdAt: new Date().toISOString()
    };
    
    users.set(user.id, user);
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Configuración de GitHub OAuth
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/auth/github/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Buscar usuario existente
    let user = Array.from(users.values()).find(u => u.githubId === profile.id);
    
    if (user) {
      return done(null, user);
    }
    
    // Crear nuevo usuario freelancer
    user = {
      id: crypto.randomUUID(),
      githubId: profile.id,
      email: profile.emails ? profile.emails[0].value : null,
      name: profile.displayName || profile.username,
      username: profile.username,
      avatar: profile.photos[0].value,
      provider: 'github',
      userType: 'freelancer', // Los usuarios de GitHub son freelancers
      githubProfile: {
        publicRepos: profile._json.public_repos,
        followers: profile._json.followers,
        following: profile._json.following,
        bio: profile._json.bio,
        location: profile._json.location,
        blog: profile._json.blog
      },
      createdAt: new Date().toISOString()
    };
    
    users.set(user.id, user);
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Serialización para sesiones
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = users.get(id);
  done(null, user);
});

// Función para generar JWT
const generateJWT = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      userType: user.userType,
      provider: user.provider
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Función para obtener todos los usuarios (para testing)
const getAllUsers = () => {
  return Array.from(users.values());
};

// Función para obtener usuario por ID
const getUserById = (id) => {
  return users.get(id);
};

module.exports = {
  passport,
  generateJWT,
  getAllUsers,
  getUserById,
  users
};