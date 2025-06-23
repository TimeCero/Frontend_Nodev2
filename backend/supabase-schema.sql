-- Supabase Database Schema for Freelancer Platform
-- Run this script in your Supabase SQL editor

-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL, -- Removed foreign key constraint to allow local users
  email TEXT UNIQUE, -- Made nullable to support users without email, but unique when present
  user_type TEXT CHECK (user_type IN ('client', 'freelancer')) NOT NULL,
  full_name TEXT, -- User's full name
  github_username TEXT,
  company_name TEXT,
  skills TEXT[], -- Array of skills for freelancers
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  hourly_rate DECIMAL(10,2), -- For freelancers
  portfolio_url TEXT,
  linkedin_url TEXT,
  website_url TEXT,
  availability_status TEXT CHECK (availability_status IN ('available', 'busy', 'unavailable')) DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  freelancer_id UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  project_type TEXT CHECK (project_type IN ('fixed', 'hourly')) DEFAULT 'fixed',
  status TEXT CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')) DEFAULT 'open',
  skills_required TEXT[],
  deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_applications table
CREATE TABLE IF NOT EXISTS public.project_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  freelancer_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  cover_letter TEXT,
  proposed_rate DECIMAL(10,2),
  estimated_duration TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, freelancer_id)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table for project communication
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view all profiles" ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" ON public.user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for projects
CREATE POLICY "Anyone can view open projects" ON public.projects
  FOR SELECT USING (status = 'open' OR client_id = auth.uid() OR freelancer_id = auth.uid());

CREATE POLICY "Clients can insert projects" ON public.projects
  FOR INSERT WITH CHECK (
    auth.uid() = client_id AND 
    EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND user_type = 'client')
  );

CREATE POLICY "Clients can update their projects" ON public.projects
  FOR UPDATE USING (auth.uid() = client_id);

CREATE POLICY "Clients can delete their projects" ON public.projects
  FOR DELETE USING (auth.uid() = client_id);

-- RLS Policies for project_applications
CREATE POLICY "Users can view applications for their projects or their own applications" ON public.project_applications
  FOR SELECT USING (
    freelancer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND client_id = auth.uid())
  );

CREATE POLICY "Freelancers can insert applications" ON public.project_applications
  FOR INSERT WITH CHECK (
    auth.uid() = freelancer_id AND 
    EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND user_type = 'freelancer')
  );

CREATE POLICY "Freelancers can update their applications" ON public.project_applications
  FOR UPDATE USING (auth.uid() = freelancer_id);

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert reviews for completed projects" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = project_id 
      AND status = 'completed' 
      AND (client_id = auth.uid() OR freelancer_id = auth.uid())
    )
  );

-- RLS Policies for messages
CREATE POLICY "Users can view messages for their projects" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = project_id 
      AND (client_id = auth.uid() OR freelancer_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages for their projects" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = project_id 
      AND (client_id = auth.uid() OR freelancer_id = auth.uid())
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON public.user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_freelancer_id ON public.projects(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_project_applications_project_id ON public.project_applications(project_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_freelancer_id ON public.project_applications(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON public.messages(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON public.reviews(reviewee_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_user_profiles
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_projects
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile for all OAuth users (with or without email)
  -- Use ON CONFLICT DO NOTHING to avoid errors when user already exists
  INSERT INTO public.user_profiles (user_id, email, user_type)
  VALUES (
    NEW.id, 
    NEW.email, -- Can be NULL for users without public email
    CASE 
      WHEN NEW.app_metadata->>'provider' = 'github' THEN 'freelancer'
      WHEN NEW.app_metadata->>'provider' = 'google' THEN 'client'
      WHEN NEW.raw_app_meta_data->>'provider' = 'github' THEN 'freelancer'
      WHEN NEW.raw_app_meta_data->>'provider' = 'google' THEN 'client'
      ELSE 'client' -- Default to client
    END
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;