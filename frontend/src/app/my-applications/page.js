'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Navigation from '../components/Navigation';

export default function MyApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  // Using the configured supabase client

  const formatBudget = (min, max) => {
    if (!min && !max) return 'No especificado';
    if (min && max) {
      if (min === max) return `$${min}`;
      return `$${min} - $${max}`;
    }
    return min ? `Desde $${min}` : `Hasta $${max}`;
  };

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortApplications();
  }, [applications, statusFilter, sortBy]);

  const filterAndSortApplications = () => {
    let filtered = [...applications];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'date_asc':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'rate_desc':
          return b.proposed_rate - a.proposed_rate;
        case 'rate_asc':
          return a.proposed_rate - b.proposed_rate;
        case 'project_name':
          return (a.projects?.title || '').localeCompare(b.projects?.title || '');
        default:
          return 0;
      }
    });
    
    setFilteredApplications(filtered);
  };

  const checkUser = async () => {
    try {
      // Primero verificar si hay un token JWT del backend
      const authToken = localStorage.getItem('authToken');
      const storedUserType = localStorage.getItem('userType');
      
      if (authToken && storedUserType) {
        // Verificar el token con el backend
        try {
          const response = await fetch('http://localhost:3001/auth/verify-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: authToken })
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.valid && result.user) {
              const userData = {
                id: result.user.id,
                email: result.user.email,
                name: result.user.full_name || result.user.email?.split('@')[0],
                full_name: result.user.full_name
              };
              setUser(userData);
              
              // Establecer el perfil del usuario con la información del token
              setUserProfile({
                user_id: result.user.id,
                email: result.user.email,
                full_name: result.user.full_name,
                user_type: result.user.userType
              });
              return;
            }
          }
        } catch (error) {
          console.error('Error verifying JWT token:', error);
          // No limpiar localStorage aquí, solo continuar con Supabase
        }
      }
      
      // Si no hay token JWT válido, verificar Supabase Auth
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Found Supabase session:', session.user.id);
        setUser(session.user);
        
        // Obtener perfil del usuario
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          // Intentar buscar por email si no se encuentra por user_id
          if (session.user.email) {
            const { data: profileByEmail } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('email', session.user.email)
              .single();
            
            if (profileByEmail) {
              setUserProfile(profileByEmail);
              return;
            }
          }
        } else {
          setUserProfile(profile);
          return;
        }
      }
      
      // Si no hay ningún tipo de autenticación válida, redirigir al login
      console.log('No valid authentication found, redirecting to login');
      router.push('/login');
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/login');
    }
  };

  const fetchApplications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      console.log('Fetching applications for user:', user);
      console.log('User ID:', user.id);
      console.log('User email:', user.email);
      
      let userProfile = null;
      let profileError = null;
      
      // Si el usuario tiene email, buscar por email
      if (user.email) {
        console.log('Searching for user profile with email:', user.email);
        const result = await supabase
          .from('user_profiles')
          .select('user_id, email')
          .eq('email', user.email)
          .single();
        userProfile = result.data;
        profileError = result.error;
      } else {
        // Si no tiene email (usuario de GitHub sin email público), buscar por user_id
        console.log('No email found, searching by user_id:', user.id);
        const result = await supabase
          .from('user_profiles')
          .select('user_id, email')
          .eq('user_id', user.id)
          .single();
        userProfile = result.data;
        profileError = result.error;
        
        // Si no se encuentra por user_id, intentar buscar por email generado para GitHub
        if (profileError) {
          console.log('Trying with generated GitHub email:', `github_${user.id}@noemail.local`);
          const githubResult = await supabase
            .from('user_profiles')
            .select('user_id, email')
            .eq('email', `github_${user.id}@noemail.local`)
            .single();
          userProfile = githubResult.data;
          profileError = githubResult.error;
        }
      }

      console.log('Profile query result:', { userProfile, profileError });

      if (profileError) {
        console.error('Error getting user profile:', profileError);
        
        // Intentar buscar todos los perfiles para debug
        const { data: allProfiles } = await supabase
          .from('user_profiles')
          .select('email, user_id')
          .limit(10);
        console.log('Available profiles:', allProfiles);
        
        throw new Error('No se pudo obtener el perfil del usuario');
      }

      const supabaseUserId = userProfile.user_id;
      console.log('Supabase User ID:', supabaseUserId);

      // Obtener aplicaciones del usuario desde Supabase usando el user_id de Supabase
      const { data, error } = await supabase
        .from('project_applications')
        .select(`
          *,
          projects (
            id,
            title,
            description,
            budget_min,
            budget_max,
            client_id,
            status,
            created_at,
            user_profiles!projects_client_id_fkey (
              full_name,
              avatar_url
            )
          )
        `)
        .eq('freelancer_id', supabaseUserId)
        .order('created_at', { ascending: false });

      console.log('Supabase query result:', { data, error });
      console.log('Applications found:', data?.length || 0);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }

      setApplications(data || []);

    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Enviada/Pendiente', icon: '⏳' },
      reviewed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'En Consideración', icon: '👀' },
      accepted: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aceptada', icon: '✅' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazada', icon: '❌' },
      archived: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Archivada/Cerrada', icon: '📁' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const handleViewProject = (projectId) => {
    router.push(`/projects/${projectId}`);
  };

  const handleViewMessages = (projectId) => {
    router.push(`/projects/${projectId}/messages`);
  };

  const handleViewProposal = (application) => {
    // Create a modal or detailed view for the proposal
    alert(`Propuesta para: ${application.projects?.title}\n\nTarifa propuesta: $${application.proposed_rate}/hora\nDuración estimada: ${application.estimated_duration}\n\nPropuesta:\n${application.proposal}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tus propuestas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📋 Mis Propuestas
              </h1>
              <p className="text-gray-600">
                Gestiona y revisa el estado de tus propuestas a proyectos
              </p>
            </div>
            <button
              onClick={() => router.push('/projects')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              🔍 Buscar Proyectos
            </button>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por estado:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Enviada/Pendiente</option>
                  <option value="reviewed">En Consideración</option>
                  <option value="accepted">Aceptada</option>
                  <option value="rejected">Rechazada</option>
                  <option value="archived">Archivada/Cerrada</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date_desc">Fecha (más reciente)</option>
                  <option value="date_asc">Fecha (más antigua)</option>
                  <option value="rate_desc">Tarifa (mayor a menor)</option>
                  <option value="rate_asc">Tarifa (menor a mayor)</option>
                  <option value="project_name">Nombre del proyecto</option>
                </select>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              Mostrando {filteredApplications.length} de {applications.length} propuestas
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applications.filter(app => app.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aceptadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applications.filter(app => app.status === 'accepted').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No has enviado propuestas aún
            </h3>
            <p className="text-gray-600 mb-6">
              Explora proyectos disponibles y envía tu primera propuesta.
            </p>
            <button
              onClick={() => router.push('/projects')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Explorar Proyectos
            </button>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron propuestas
            </h3>
            <p className="text-gray-600 mb-6">
              Intenta cambiar los filtros para ver más resultados.
            </p>
            <button
              onClick={() => {
                setStatusFilter('all');
                setSortBy('date_desc');
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredApplications.map((application) => (
              <div key={application.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Project Info */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {application.projects?.title || 'Proyecto sin título'}
                      </h3>
                      {getStatusBadge(application.status)}
                    </div>

                    {/* Client Info */}
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                        {application.projects?.user_profiles?.avatar_url ? (
                          <img
                            src={application.projects.user_profiles.avatar_url}
                            alt={application.projects.user_profiles.full_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-semibold text-sm">
                            {application.projects?.user_profiles?.full_name?.charAt(0) || 'C'}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Cliente: {application.projects?.user_profiles?.full_name || 'Cliente'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Presupuesto: {formatBudget(application.projects?.budget_min, application.projects?.budget_max)}
                        </p>
                      </div>
                    </div>

                    {/* Application Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Tu Propuesta</h4>
                        <p className="text-gray-600">${application.proposed_rate}/hora</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Duración Estimada</h4>
                        <p className="text-gray-600">{application.estimated_duration}</p>
                      </div>
                    </div>

                    {/* Proposal */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Propuesta</h4>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-md text-sm">
                        {application.proposal}
                      </p>
                    </div>

                    {/* Project Description */}
                    {application.projects?.description && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Descripción del Proyecto</h4>
                        <p className="text-gray-600 text-sm line-clamp-3">
                          {application.projects.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="ml-6 flex flex-col space-y-2">
                    <button
                      onClick={() => handleViewProject(application.project_id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      📋 Ver Proyecto
                    </button>
                    
                    <button
                      onClick={() => handleViewProposal(application)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm"
                    >
                      📄 Ver Propuesta
                    </button>
                    
                    {(application.status === 'accepted' || application.status === 'reviewed') && (
                      <button
                        onClick={() => handleViewMessages(application.project_id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                      >
                        💬 Chat Cliente
                      </button>
                    )}
                  </div>
                </div>

                {/* Application Date */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Propuesta enviada el {new Date(application.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}