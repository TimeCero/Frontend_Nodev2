# Plataforma Freelancer

Una plataforma web moderna para conectar freelancers con clientes, construida con Next.js y Node.js, utilizando Supabase como base de datos.

## 🚀 Características

- **Autenticación OAuth**: Login con Google y GitHub
- **Perfiles de Usuario**: Perfiles completos para freelancers y clientes
- **Dashboard Personalizado**: Interfaces específicas según el tipo de usuario
- **Gestión de Proyectos**: Sistema para publicar y gestionar proyectos
- **Base de Datos Robusta**: Integración con Supabase PostgreSQL
- **Interfaz Moderna**: UI/UX responsive con Tailwind CSS

## 🛠️ Tecnologías

### Frontend
- **Next.js 14**: Framework de React con App Router
- **React 18**: Biblioteca de interfaz de usuario
- **Tailwind CSS**: Framework de CSS utilitario
- **JavaScript ES6+**: Lenguaje de programación moderno

### Backend
- **Node.js**: Entorno de ejecución de JavaScript
- **Express.js**: Framework web para Node.js
- **Passport.js**: Middleware de autenticación
- **Supabase**: Base de datos PostgreSQL como servicio

### Base de Datos
- **PostgreSQL**: Base de datos relacional (via Supabase)
- **Supabase Auth**: Sistema de autenticación integrado

## 📋 Prerrequisitos

- Node.js (versión 18 o superior)
- npm o yarn
- Cuenta de Supabase
- Credenciales OAuth (Google y GitHub)

## ⚙️ Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/plataforma-freelancer.git
cd plataforma-freelancer
```

### 2. Instalar dependencias del backend
```bash
cd backend
npm install
```

### 3. Instalar dependencias del frontend
```bash
cd ../frontend
npm install
```

### 4. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `backend` con las siguientes variables:

```env
# Supabase Configuration
SUPABASE_URL=tu_supabase_url
SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key

# OAuth Configuration
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GITHUB_CLIENT_ID=tu_github_client_id
GITHUB_CLIENT_SECRET=tu_github_client_secret

# JWT Configuration
JWT_SECRET=tu_jwt_secret_muy_seguro

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### 5. Configurar la base de datos

1. Crea un nuevo proyecto en [Supabase](https://supabase.com)
2. Ejecuta el script SQL que se encuentra en `backend/supabase-schema.sql`
3. Configura las políticas de seguridad (RLS) según sea necesario

## 🚀 Uso

### Desarrollo

1. **Iniciar el servidor backend:**
```bash
cd backend
npm start
```
El servidor estará disponible en `http://localhost:3001`

2. **Iniciar el servidor frontend:**
```bash
cd frontend
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`

### Producción

1. **Construir el frontend:**
```bash
cd frontend
npm run build
```

2. **Iniciar en modo producción:**
```bash
npm start
```

## 📁 Estructura del Proyecto

```
plataforma-freelancer/
├── backend/
│   ├── config/
│   │   ├── passport.js
│   │   └── supabase.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── supabaseAuth.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── supabaseAuth.js
│   ├── scripts/
│   ├── supabase-schema.sql
│   ├── index.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── components/
│   │       ├── dashboard/
│   │       ├── profile/
│   │       ├── complete-profile/
│   │       └── auth/
│   ├── public/
│   ├── next.config.mjs
│   └── package.json
├── README.md
└── .gitignore
```

## 🔐 Autenticación

La aplicación soporta autenticación OAuth con:
- **Google**: Para acceso rápido con cuentas de Google
- **GitHub**: Especialmente útil para desarrolladores freelancers

## 👥 Tipos de Usuario

### Freelancers
- Crear perfil profesional
- Mostrar habilidades y portafolio
- Establecer tarifas por hora
- Gestionar proyectos

### Clientes
- Crear perfil de empresa
- Publicar proyectos
- Buscar freelancers
- Gestionar contrataciones

## 🗄️ Base de Datos

La aplicación utiliza PostgreSQL a través de Supabase con las siguientes tablas principales:

- `user_profiles`: Perfiles de usuarios (freelancers y clientes)
- `projects`: Proyectos publicados por clientes
- `applications`: Aplicaciones de freelancers a proyectos
- `reviews`: Sistema de reseñas y calificaciones

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

Tu Nombre - tu.email@ejemplo.com

Link del Proyecto: [https://github.com/tu-usuario/plataforma-freelancer](https://github.com/tu-usuario/plataforma-freelancer)

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Passport.js](http://www.passportjs.org/)
- [Express.js](https://expressjs.com/)

---

⭐ ¡No olvides dar una estrella al proyecto si te ha sido útil!