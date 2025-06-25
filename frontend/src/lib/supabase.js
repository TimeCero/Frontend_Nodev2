import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yxdkitxivnycjzbygpmu.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZGtpdHhpdm55Y2p6YnlncG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0ODA3MjAsImV4cCI6MjA2NjA1NjcyMH0.XGcoBhw8Qnoz95O-VJ6M2XEpi6_ddwxNSMCqlpIhSTg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your-supabase-url'
}

// Helper function to get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error getting current user:', error)
      return null
    }
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Helper function to sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Error signing out:', error)
    return false
  }
}

// Helper function to get session
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error getting session:', error)
      return null
    }
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}