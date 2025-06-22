# Supabase Integration Guide

## Overview

This freelancer platform has been enhanced with Supabase integration to provide a robust, scalable database and authentication system. Supabase offers:

- **PostgreSQL Database**: Reliable, ACID-compliant relational database
- **Real-time subscriptions**: Live updates for chat and notifications
- **Row Level Security (RLS)**: Built-in security policies
- **Authentication**: OAuth providers (Google, GitHub) + JWT tokens
- **Auto-generated APIs**: RESTful and GraphQL endpoints
- **Dashboard**: Easy database management and monitoring

## Current Architecture

### Hybrid Authentication System
The platform now supports both:
1. **Legacy Passport.js**: Existing OAuth flows (Google/GitHub)
2. **Supabase Auth**: New user management and JWT verification

### Database Schema
Supabase manages the following tables:
- `user_profiles`: User information and preferences
- `projects`: Freelance project listings
- `project_applications`: Applications to projects
- `reviews`: User reviews and ratings
- `messages`: Chat system between users

## Setup Instructions

### 1. Supabase Project Setup

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up/login and create a new project
   - Choose a region close to your users

2. **Get Project Credentials**
   - Go to Settings → API
   - Copy the following values:
     - Project URL
     - `anon` public key
     - `service_role` secret key
   - Go to Settings → Auth → JWT Settings
     - Copy the JWT Secret

3. **Update Environment Variables**
   ```bash
   # Add to backend/.env
   SUPABASE_URL=your_project_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_JWT_SECRET=your_jwt_secret
   ```

### 2. Database Schema Setup

1. **Run SQL Schema**
   - Open Supabase Dashboard → SQL Editor
   - Copy and paste the contents of `backend/supabase-schema.sql`
   - Execute the script to create tables, policies, and triggers

2. **Verify Setup**
   - Check Tables tab to see all created tables
   - Verify RLS policies are enabled
   - Test the `handle_new_user()` trigger

### 3. OAuth Configuration

1. **Google OAuth**
   - In Supabase Dashboard → Authentication → Providers
   - Enable Google provider
   - Add your Google Client ID and Secret
   - Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`

2. **GitHub OAuth**
   - Enable GitHub provider in Supabase
   - Add your GitHub Client ID and Secret
   - Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 4. Migration from Existing Users

1. **Run Migration Script**
   ```bash
   cd backend
   node scripts/migrate-to-supabase.js
   ```

2. **Verify Migration**
   - Check Supabase Dashboard → Authentication → Users
   - Verify user profiles in Database → user_profiles table

## API Endpoints

### New Supabase Routes (`/api`)

- `POST /api/profile` - Create/update user profile
- `GET /api/profile` - Get current user profile
- `GET /api/freelancers` - List all freelancers
- `GET /api/clients` - List all clients
- `POST /api/verify-token` - Verify Supabase JWT token
- `GET /api/user-stats` - Get user statistics

### Legacy Routes (maintained for compatibility)

- `GET /auth/google` - Google OAuth login
- `GET /auth/github` - GitHub OAuth login
- `GET /auth/me` - Get current user (Passport.js)
- `POST /auth/verify-token` - Verify legacy JWT

## Frontend Integration

### Option 1: Supabase Client (Recommended for new features)

```javascript
// Install Supabase client
npm install @supabase/supabase-js

// Initialize client
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'your-project-url'
const supabaseKey = 'your-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)

// Authentication
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'http://localhost:3000/auth/callback'
  }
})

// Database operations
const { data: projects } = await supabase
  .from('projects')
  .select('*')
  .eq('status', 'open')
```

### Option 2: Backend API (Current implementation)

```javascript
// Continue using existing API calls
fetch('/api/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

## Development Workflow

### 1. Local Development

```bash
# Start backend with Supabase
cd backend
npm start

# Backend runs on http://localhost:3001
# Supabase integration active
```

### 2. Testing Authentication

1. **Test OAuth Flow**
   - Visit `http://localhost:3000`
   - Click "Login with Google" or "Login with GitHub"
   - Verify user creation in Supabase Dashboard

2. **Test API Endpoints**
   ```bash
   # Get user profile
   curl -H "Authorization: Bearer YOUR_JWT" http://localhost:3001/api/profile
   
   # List freelancers
   curl http://localhost:3001/api/freelancers
   ```

### 3. Database Operations

```javascript
// Example: Create a new project
const { data, error } = await supabase
  .from('projects')
  .insert({
    title: 'Website Development',
    description: 'Need a modern website',
    budget: 1000,
    client_id: user.id,
    skills_required: ['React', 'Node.js']
  })
```

## Security Features

### Row Level Security (RLS)
- Users can only access their own data
- Public profiles are readable by all
- Project applications are restricted to applicants and project owners

### JWT Token Verification
- All API endpoints verify Supabase JWT tokens
- Tokens contain user metadata and permissions
- Automatic token refresh handled by Supabase client

## Monitoring and Analytics

### Supabase Dashboard
- **Database**: Monitor table sizes, query performance
- **Auth**: Track user registrations, login patterns
- **API**: Monitor endpoint usage and response times
- **Logs**: Debug authentication and database issues

### Custom Analytics
```javascript
// Track user actions
const { error } = await supabase
  .from('user_analytics')
  .insert({
    user_id: user.id,
    action: 'project_created',
    metadata: { project_id: newProject.id }
  })
```

## Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   ```
   Error: supabaseUrl is required
   ```
   - Verify all Supabase environment variables are set
   - Restart the backend server after updating .env

2. **JWT Verification Failed**
   ```
   Error: Invalid JWT token
   ```
   - Check JWT_SECRET matches Supabase project settings
   - Verify token is being sent in Authorization header

3. **Database Connection Issues**
   ```
   Error: relation "user_profiles" does not exist
   ```
   - Run the database schema setup script
   - Check Supabase project is active and accessible

4. **OAuth Redirect Mismatch**
   ```
   Error: redirect_uri_mismatch
   ```
   - Update OAuth provider settings in Supabase Dashboard
   - Verify redirect URLs match exactly

### Debug Mode

```bash
# Enable debug logging
DEBUG=supabase:* npm start
```

## Migration Checklist

- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] OAuth providers configured
- [ ] Existing users migrated
- [ ] API endpoints tested
- [ ] Frontend integration updated
- [ ] RLS policies verified
- [ ] Monitoring dashboard configured

## Next Steps

1. **Real-time Features**
   - Implement live chat using Supabase subscriptions
   - Real-time project updates and notifications

2. **Advanced Features**
   - File storage for project attachments
   - Email notifications via Supabase Edge Functions
   - Advanced search with full-text search

3. **Performance Optimization**
   - Database indexing for large datasets
   - Connection pooling for high traffic
   - CDN integration for global performance

## Support

- **Supabase Documentation**: [docs.supabase.com](https://docs.supabase.com)
- **Community**: [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)
- **Status Page**: [status.supabase.com](https://status.supabase.com)

---

**Note**: This integration maintains backward compatibility with existing Passport.js authentication while adding Supabase capabilities. You can gradually migrate features to use Supabase directly for better performance and scalability.