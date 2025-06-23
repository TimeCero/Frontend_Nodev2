import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Hook personalizado para manejar autenticación con Supabase
export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener sesión actual
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}

// Hook para manejar perfiles de usuario
export const useUserProfile = (userId) => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error) {
          setError(error)
        } else {
          setProfile(data)
        }
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  const updateProfile = async (updates) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        setError(error)
        return false
      }

      setProfile(data)
      return true
    } catch (err) {
      setError(err)
      return false
    } finally {
      setLoading(false)
    }
  }

  return { profile, loading, error, updateProfile }
}

// Hook para manejar proyectos
export const useProjects = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProjects = async (filters = {}) => {
    try {
      setLoading(true)
      let query = supabase
        .from('projects')
        .select(`
          *,
          user_profiles!projects_client_id_fkey(
            full_name,
            company_name,
            avatar_url
          )
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      // Aplicar filtros si existen
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.budget_min) {
        query = query.gte('budget', filters.budget_min)
      }
      if (filters.budget_max) {
        query = query.lte('budget', filters.budget_max)
      }

      const { data, error } = await query

      if (error) {
        setError(error)
      } else {
        setProjects(data)
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return { projects, loading, error, refetch: fetchProjects }
}

// Hook para manejar aplicaciones a proyectos
export const useProjectApplications = (projectId) => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!projectId) {
      setLoading(false)
      return
    }

    const fetchApplications = async () => {
      try {
        const { data, error } = await supabase
          .from('project_applications')
          .select(`
            *,
            user_profiles!project_applications_freelancer_id_fkey(
              full_name,
              avatar_url,
              skills,
              hourly_rate
            )
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })

        if (error) {
          setError(error)
        } else {
          setApplications(data)
        }
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [projectId])

  const submitApplication = async (applicationData) => {
    try {
      const { data, error } = await supabase
        .from('project_applications')
        .insert([applicationData])
        .select()
        .single()

      if (error) {
        setError(error)
        return false
      }

      // Actualizar la lista de aplicaciones
      setApplications(prev => [data, ...prev])
      return true
    } catch (err) {
      setError(err)
      return false
    }
  }

  return { applications, loading, error, submitApplication }
}