# Supabase Setup Guide for Freelancer Platform

This guide will help you set up Supabase as the database and authentication backend for the freelancer platform.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js and npm installed
- The freelancer platform backend code

## Step 1: Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `freelancer-platform` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest region to your users
5. Click "Create new project"
6. Wait for the project to be created (this may take a few minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (something like `https://xxxxx.supabase.co`)
   - **Project API Keys**:
     - `anon` `public` key
     - `service_role` `secret` key (keep this secure!)

3. Go to **Settings** → **Auth** → **Settings**
4. Copy the **JWT Secret** (you'll need this for token verification)

## Step 3: Configure Environment Variables

Update your `backend/.env` file with the Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here
```

## Step 4: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `backend/supabase-schema.sql`
3. Paste it into the SQL Editor
4. Click **Run** to execute the schema

This will create:
- `user_profiles` table for storing user information
- `projects` table for freelance projects
- `project_applications` table for freelancer applications
- `reviews` table for project reviews
- `messages` table for project communication
- Row Level Security (RLS) policies
- Automatic triggers for user profile creation

## Step 5: Configure OAuth Providers

### Google OAuth Setup

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click the toggle to enable it
3. Enter your Google OAuth credentials:
   - **Client ID**: Your Google Client ID
   - **Client Secret**: Your Google Client Secret
4. Add the redirect URL: `https://your-project-id.supabase.co/auth/v1/callback`
5. Click **Save**

### GitHub OAuth Setup

1. In the same **Providers** section, find **GitHub**
2. Enable it and enter your GitHub OAuth credentials:
   - **Client ID**: Your GitHub Client ID
   - **Client Secret**: Your GitHub Client Secret
3. Add the redirect URL: `https://your-project-id.supabase.co/auth/v1/callback`
4. Click **Save**

## Step 6: Update OAuth Provider Settings

### Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your OAuth 2.0 client
3. Add these authorized redirect URIs:
   - `https://your-project-id.supabase.co/auth/v1/callback`
   - `http://localhost:3001/auth/google/callback` (for local development)

### Update GitHub OAuth App

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Edit your OAuth app
3. Update the **Authorization callback URL** to:
   - `https://your-project-id.supabase.co/auth/v1/callback`
   - Add `http://localhost:3001/auth/github/callback` for local development

## Step 7: Test the Setup

1. Start your backend server:
   ```bash
   cd backend
   npm start
   ```

2. Visit `http://localhost:3001/config` to verify Supabase is configured:
   ```json
   {
     "supabase": {
       "url": "https://your-project-id.supabase.co",
       "anonKey": "your_anon_key",
       "configured": true
     }
   }
   ```

3. Test the API endpoints:
   - `GET /api/freelancers` - Should return empty array initially
   - `GET /api/verify` - Should require authentication

## Step 8: Frontend Integration

Update your frontend to use Supabase for authentication:

1. Install Supabase client in frontend:
   ```bash
   cd frontend
   npm install @supabase/supabase-js
   ```

2. The frontend will automatically get Supabase configuration from `/config` endpoint

## API Endpoints

Once set up, you'll have these new API endpoints:

- `POST /api/profile` - Create/update user profile
- `GET /api/profile` - Get current user profile
- `GET /api/freelancers` - Get all freelancers
- `GET /api/clients` - Get all clients (authenticated)
- `GET /api/verify` - Verify JWT token
- `GET /api/stats` - Get user statistics

## Database Tables

### user_profiles
Stores extended user information beyond what Supabase Auth provides.

### projects
Stores freelance project listings posted by clients.

### project_applications
Stores applications from freelancers to projects.

### reviews
Stores reviews and ratings between clients and freelancers.

### messages
Stores project-related communication.

## Security Features

- **Row Level Security (RLS)**: Ensures users can only access their own data
- **JWT Verification**: All API endpoints verify Supabase JWT tokens
- **OAuth Integration**: Secure authentication via Google and GitHub
- **Automatic User Profiles**: User profiles are created automatically on signup

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Ensure all environment variables are set in `.env`
   - Restart the backend server after updating `.env`

2. **"Invalid token" errors**
   - Check that `SUPABASE_JWT_SECRET` matches your project's JWT secret
   - Ensure the frontend is sending the token in the `Authorization` header

3. **OAuth redirect errors**
   - Verify redirect URLs are correctly configured in both Supabase and OAuth providers
   - Check that URLs match exactly (including http/https)

4. **Database permission errors**
   - Ensure RLS policies are correctly applied
   - Check that the schema was executed successfully

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com/)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

## Next Steps

1. **Customize the schema** based on your specific requirements
2. **Add more tables** for features like payments, notifications, etc.
3. **Set up real-time subscriptions** for live updates
4. **Configure email templates** for auth emails
5. **Set up database backups** for production

## Production Considerations

- Use environment-specific Supabase projects (dev, staging, prod)
- Enable database backups
- Set up monitoring and alerts
- Configure custom domains for auth
- Review and adjust RLS policies for your use case
- Set up proper CORS policies
- Enable rate limiting if needed