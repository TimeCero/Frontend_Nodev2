require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Configuración de CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu_session_secret_aqui',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Importar y configurar passport
const { passport } = require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

// Importar configuración de Supabase
const { supabase, isSupabaseConfigured } = require('./config/supabase');

// Importar rutas
const authRoutes = require('./routes/auth');
const supabaseAuthRoutes = require('./routes/supabaseAuth');
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes); // Mount auth routes at /api/auth as well
app.use('/api', supabaseAuthRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: '¡API de Freelancers está funcionando!',
    version: '1.0.0',
    endpoints: {
      auth: {
        google: '/auth/google',
        github: '/auth/github',
        me: '/auth/me',
        logout: '/auth/logout',
        users: '/auth/users'
      },
      supabase: {
        profile: '/api/profile',
        verify: '/api/verify',
        freelancers: '/api/freelancers',
        clients: '/api/clients',
        stats: '/api/stats'
      }
    },
    colors: {
      primary: process.env.PRIMARY_COLOR || '#4CAF50',
      secondary: process.env.SECONDARY_COLOR || '#2C5F7F'
    }
  });
});

// Frontend configuration endpoint
app.get('/config', (req, res) => {
  res.json({
    backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    colors: {
      primary: process.env.PRIMARY_COLOR || '#4CAF50',
      secondary: process.env.SECONDARY_COLOR || '#2C5F7F'
    },
    auth: {
      googleEnabled: !!process.env.GOOGLE_CLIENT_ID,
      githubEnabled: !!process.env.GITHUB_CLIENT_ID
    },
    supabase: {
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY,
      configured: isSupabaseConfigured
    },
    availableEndpoints: {
      auth: {
        google: '/auth/google',
        github: '/auth/github',
        me: '/auth/me',
        verifyToken: '/auth/verify-token'
      },
      supabase: {
        profile: '/api/profile',
        freelancers: '/api/freelancers',
        clients: '/api/clients',
        verifyToken: '/api/verify-token',
        userStats: '/api/user-stats'
      }
    }
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Algo salió mal!' });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Inicia el servidor
app.listen(port, () => {
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${port}`;
  console.log(`🚀 Servidor backend escuchando en ${backendUrl}`);
  console.log(`🎨 Colores: Primary ${process.env.PRIMARY_COLOR}, Secondary ${process.env.SECONDARY_COLOR}`);
  console.log(`🔐 OAuth configurado: Google ${!!process.env.GOOGLE_CLIENT_ID}, GitHub ${!!process.env.GITHUB_CLIENT_ID}`);
});