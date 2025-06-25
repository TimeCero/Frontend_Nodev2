'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { supabase } from '../../../lib/supabase';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [project, setProject] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ colors: { primary: '#4CAF50', secondary: '#2C5F7F' } });
  const [userApplication, setUserApplication] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [totalApplications, setTotalApplications] = useState(0);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadProjectDetails();
    }
  }, [user]);

  useEffect(() => {
    // Verificar si el usuario acaba de aplicar exitosamente
    if (searchParams.get('applied') === 'true' && user) {
      setShowSuccessMessage(true);
      // Limpiar el parámetro de la URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      // Recargar los datos del proyecto para actualizar la interfaz
      loadProjectDetails();
      // Ocultar el mensaje después de 5 segundos
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
    }
  }, [searchParams, user]);

  const checkUser = async () => {
    try {
      // First try to verify backend JWT token
      const token = localStorage.getItem('authToken');
      if (token) {
        const response = await fetch('http://localhost:3001/auth/verify-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.valid) {
            setUser({ id: data.user.id, email: data.user.email });
            return;
          } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userType');
          }
        }
      }

      // Fallback to Supabase auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/login');
    }
  };

  const loadProjectDetails = async () => {
    try {
      setLoading(true);
      
      // Obtener configuración
      fetch('http://localhost:3001/config')
        .then(res => res.json())
        .then(data => setConfig(data))
        .catch(err => console.error('Error loading config:', err));

      await fetchProjectDetails();
     } catch (error) {
       console.error('Error loading project details:', error);
       setLoading(false);
     }
   };

   const fetchProjectDetails = async () => {
     try {
      
      // Validar que el ID del proyecto sea un UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(params.id)) {
        console.error('ID de proyecto inválido:', params.id);
        alert('ID de proyecto inválido');
        router.push('/projects');
        return;
      }
      
      // Obtener detalles del proyecto a través del backend API
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3001/api/projects/${params.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('Error fetching project:', errorData);
        
        if (response.status === 401) {
          alert('Debes estar autenticado para ver este proyecto.');
          router.push('/login');
        } else if (response.status === 404) {
          alert('Proyecto no encontrado.');
          router.push('/projects');
        } else {
          alert(`Error al cargar el proyecto: ${errorData.message || 'Error del servidor'}`);
          router.push('/projects');
        }
        return;
      }

      const projectData = await response.json();
      setProject(projectData.project || projectData);

      // Obtener el número total de aplicaciones para todos los usuarios
      if (user && token) {
        try {
          const countResponse = await fetch(`http://localhost:3001/api/projects/${params.id}/applications-count`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (countResponse.ok) {
            const countData = await countResponse.json();
            setTotalApplications(countData.count || 0);
          }
        } catch (error) {
          console.error('Error fetching applications count:', error);
        }
      }

      // Debug logs para verificar los valores
      console.log('Debug - user:', user);
      console.log('Debug - token:', token ? 'exists' : 'missing');
      console.log('Debug - projectData:', projectData);
      console.log('Debug - projectData.project?.client_id:', projectData.project?.client_id);
      console.log('Debug - user.id:', user?.id);
      console.log('Debug - comparison result:', projectData.project?.client_id === user?.id);

      // Obtener aplicaciones del proyecto (solo si el usuario es el propietario del proyecto)
      if (user && token && projectData && projectData.project && projectData.project.client_id === user.id) {
        console.log('Debug - Fetching applications for project owner');
        try {
          const applicationsResponse = await fetch(`http://localhost:3001/api/projects/${params.id}/applications`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          console.log('Debug - Applications response status:', applicationsResponse.status);
          
          if (applicationsResponse.ok) {
            const applicationsData = await applicationsResponse.json();
            console.log('Debug - Applications data received:', applicationsData);
            setApplications(applicationsData.applications || []);
          } else {
            console.error('Error fetching applications:', applicationsResponse.status);
            const errorText = await applicationsResponse.text();
            console.error('Error response:', errorText);
            setApplications([]);
          }
        } catch (error) {
          console.error('Error fetching applications:', error);
          setApplications([]);
        }
      } else if (user && token) {
        // Si es un freelancer, verificar si ya aplicó a este proyecto
        try {
          const userApplicationResponse = await fetch(`http://localhost:3001/api/projects/${params.id}/user-application`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (userApplicationResponse.ok) {
            const userAppData = await userApplicationResponse.json();
            setUserApplication(userAppData.application);
          } else {
            setUserApplication(null);
          }
        } catch (error) {
          console.error('Error checking user application:', error);
          setUserApplication(null);
        }
        setApplications([]);
      } else {
        // Si no está autenticado, no mostrar aplicaciones
        setApplications([]);
        setUserApplication(null);
      }

    } catch (error) {
      console.error('Error:', error);
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  };

  const formatBudget = (min, max) => {
    if (min && max) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    } else if (min) {
      return `Desde $${min.toLocaleString()}`;
    } else if (max) {
      return `Hasta $${max.toLocaleString()}`;
    }
    return 'Presupuesto por negociar';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Hace 1 día';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return `Hace ${Math.ceil(diffDays / 7)} semanas`;
    }
  };

  const handleApplicationAction = async (applicationId, status) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        // Actualizar la lista de aplicaciones
        setApplications(applications.map(app => 
          app.id === applicationId ? { ...app, status } : app
        ));
        alert(`Aplicación ${status === 'accepted' ? 'aceptada' : 'rechazada'} exitosamente`);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Error al actualizar la aplicación');
    }
  };

  const isProjectOwner = user && project && user.id === project.client_id;
  const canApply = user && user.userType === 'freelancer' && !userApplication && project?.status === 'open';

  // Debug logs
  console.log('Debug - User:', user);
  console.log('Debug - Project:', project);
  console.log('Debug - Applications:', applications);
  console.log('Debug - isProjectOwner:', isProjectOwner);
  console.log('Debug - user.id:', user?.id);
  console.log('Debug - project.client_id:', project?.client_id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Proyecto no encontrado</h1>
            <button
              onClick={() => router.push('/projects')}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Volver a proyectos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <button
              onClick={() => router.push('/projects')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Volver a proyectos
            </button>
          </nav>

          {/* Mensaje de éxito */}
          {showSuccessMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    ¡Tu propuesta ha sido enviada exitosamente!
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    El cliente revisará tu aplicación y te contactará si está interesado.
                  </p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setShowSuccessMessage(false)}
                    className="inline-flex text-green-400 hover:text-green-600"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contenido Principal */}
            <div className="lg:col-span-2">
              {/* Header del Proyecto */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {project.title}
                    </h1>
                    <div className="flex items-center text-sm text-gray-600 mb-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-3">
                        {project.category}
                      </span>
                      <span className="mr-3">📅 Publicado {getDaysAgo(project.created_at)}</span>
                      {project.deadline && (
                        <span className="mr-3 text-orange-600">
                          ⏰ Vence: {formatDate(project.deadline)}
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.status === 'open' ? 'bg-green-100 text-green-800' :
                        project.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status === 'open' ? 'Abierto' :
                         project.status === 'in_progress' ? 'En Progreso' :
                         project.status === 'completed' ? 'Completado' : 'Cerrado'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatBudget(project.budget_min, project.budget_max)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {project.project_type === 'fixed' ? 'Precio Fijo' : 'Por Horas'}
                    </div>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex space-x-3 mb-6">
                  {canApply && (
                    <button
                      onClick={() => router.push(`/projects/${project.id}/apply`)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Aplicar al Proyecto
                    </button>
                  )}
                  
                  {userApplication && (
                    <div className="px-6 py-2 bg-green-100 text-green-800 rounded-md border border-green-200">
                      ✓ Ya aplicaste a este proyecto
                    </div>
                  )}
                  
                  {isProjectOwner && (
                    <button
                      onClick={() => router.push(`/projects/${project.id}/manage`)}
                      className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Gestionar Proyecto
                    </button>
                  )}
                  
                  <button className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    💾 Guardar
                  </button>
                </div>

                {/* Descripción */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Descripción del Proyecto</h3>
                  <div className="prose max-w-none text-gray-700">
                    {project.description.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-3">{paragraph}</p>
                    ))}
                  </div>
                </div>

                {/* Habilidades Requeridas */}
                {project.skills_required && project.skills_required.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Habilidades Requeridas</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.skills_required.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Aplicaciones (solo para el dueño del proyecto) */}
              {isProjectOwner && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Propuestas Recibidas ({applications.length})
                  </h3>
                  
                  {applications.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📝</div>
                      <p className="text-gray-500">Aún no hay propuestas para este proyecto</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Las propuestas aparecerán aquí cuando los freelancers apliquen
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applications.map((application) => (
                        <div key={application.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                                {application.user_profiles?.avatar_url ? (
                                  <img
                                    src={application.user_profiles.avatar_url}
                                    alt="Freelancer"
                                    className="w-10 h-10 rounded-full"
                                  />
                                ) : (
                                  <span className="text-sm font-medium text-gray-600">
                                    {application.user_profiles?.full_name?.charAt(0) || 'F'}
                                  </span>
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {application.user_profiles?.full_name || 'Freelancer'}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Aplicó {getDaysAgo(application.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {application.proposed_rate && (
                                <div className="text-lg font-semibold text-green-600">
                                  ${application.proposed_rate}/hora
                                </div>
                              )}
                              <div className={`text-sm px-2 py-1 rounded ${
                                application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {application.status === 'pending' ? 'Pendiente' :
                                 application.status === 'accepted' ? 'Aceptada' : 'Rechazada'}
                              </div>
                            </div>
                          </div>
                          
                          {application.proposal && (
                            <p className="text-gray-700 mb-3">{application.proposal}</p>
                          )}
                          
                          {application.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleApplicationAction(application.id, 'accepted')}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                              >
                                Aceptar
                              </button>
                              <button 
                                onClick={() => handleApplicationAction(application.id, 'rejected')}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                              >
                                Rechazar
                              </button>
                              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                                Ver Perfil
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Información del Cliente */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sobre el Cliente</h3>
                
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                    {project.user_profiles?.avatar_url ? (
                      <img
                        src={project.user_profiles.avatar_url}
                        alt="Cliente"
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <span className="text-lg font-medium text-gray-600">
                        {project.user_profiles?.full_name?.charAt(0) || 'C'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {project.user_profiles?.company_name || project.user_profiles?.full_name || 'Cliente'}
                    </h4>
                    {project.user_profiles?.location && (
                      <p className="text-sm text-gray-600">
                        📍 {project.user_profiles.location}
                      </p>
                    )}
                  </div>
                </div>

                {project.user_profiles?.industry && (
                  <div className="mb-3">
                    <span className="text-sm text-gray-600">Industria:</span>
                    <p className="font-medium">{project.user_profiles.industry}</p>
                  </div>
                )}

                {project.user_profiles?.bio && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-600">Descripción:</span>
                    <p className="text-sm text-gray-700 mt-1">{project.user_profiles.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-gray-600">Proyectos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-gray-600">Reseñas</div>
                  </div>
                </div>
              </div>

              {/* Detalles del Proyecto */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Detalles del Proyecto</h3>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Tipo de proyecto:</span>
                    <p className="font-medium">
                      {project.project_type === 'fixed' ? 'Precio Fijo' : 'Por Horas'}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-600">Presupuesto:</span>
                    <p className="font-medium text-green-600">
                      {formatBudget(project.budget_min, project.budget_max)}
                    </p>
                  </div>
                  
                  {project.deadline && (
                    <div>
                      <span className="text-sm text-gray-600">Fecha límite:</span>
                      <p className="font-medium">{formatDate(project.deadline)}</p>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-sm text-gray-600">Publicado:</span>
                    <p className="font-medium">{formatDate(project.created_at)}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-600">Propuestas:</span>
                    <p className="font-medium">{totalApplications}</p>
                  </div>
                </div>
              </div>

              {/* Acciones del Proyecto */}
              {user && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones</h3>
                  
                  <div className="space-y-3">
                    {/* Si es el dueño del proyecto */}
                    {project.client_id === user.id && (
                      <>
                        <button
                          onClick={() => router.push(`/projects/${params.id}/applications`)}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                        >
                          📋 Ver Propuestas Recibidas ({totalApplications})
                        </button>
                        
                        {/* Vista previa de freelancers que aplicaron */}
                        {console.log('Applications array:', applications)}
                        {applications.length > 0 ? (
                          <div className="bg-gray-50 rounded-md p-3 mt-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Freelancers interesados:</h4>
                            <div className="space-y-2">
                              {applications.slice(0, 3).map((application) => (
                                <div key={application.id} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                                      {(application.user_profiles?.full_name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900 text-sm">
                                        {application.user_profiles?.full_name || 'Usuario sin nombre'}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {application.user_profiles?.hourly_rate ? `$${application.user_profiles.hourly_rate}/hora` : 'Tarifa no especificada'}
                                      </div>
                                      {application.user_profiles?.skills && (
                                        <div className="text-xs text-blue-600 mt-1">
                                          {application.user_profiles.skills.slice(0, 2).join(', ')}
                                          {application.user_profiles.skills.length > 2 && '...'}
                                        </div>
                                      )}
                                    </div>
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                      application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {application.status === 'accepted' ? 'Aceptado' :
                                       application.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {applications.length > 3 && (
                                <div className="text-xs text-gray-500 text-center mt-2">
                                  +{applications.length - 3} freelancers más...
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-md p-3 mt-3">
                            <div className="text-sm text-gray-500 text-center">
                              No hay aplicaciones aún
                            </div>
                          </div>
                        )}
                        
                        <button
                          onClick={() => router.push(`/projects/${params.id}/messages`)}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                        >
                          💬 Mensajes del Proyecto
                        </button>
                      </>
                    )}
                    
                    {/* Si es freelancer y tiene aplicación aceptada */}
                    {project.client_id !== user.id && userApplication?.status === 'accepted' && (
                      <>
                        <button
                          onClick={() => router.push(`/projects/${params.id}/messages`)}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                        >
                          💬 Mensajes del Proyecto
                        </button>
                        
                        <button
                          onClick={() => router.push(`/projects/${params.id}/review`)}
                          className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors flex items-center justify-center"
                        >
                          ⭐ Dejar Review
                        </button>
                      </>
                    )}
                    
                    {/* Si es freelancer y puede aplicar */}
                    {project.client_id !== user.id && !userApplication && (
                      <button
                        onClick={() => router.push(`/projects/${params.id}/apply`)}
                        className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center"
                      >
                        📝 Aplicar al Proyecto
                      </button>
                    )}
                    
                    {/* Si es freelancer y ya aplicó */}
                    {project.client_id !== user.id && userApplication && userApplication.status === 'pending' && (
                      <div className="w-full bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md text-center">
                        ⏳ Aplicación Pendiente
                      </div>
                    )}
                    
                    {project.client_id !== user.id && userApplication && userApplication.status === 'rejected' && (
                      <div className="w-full bg-red-100 text-red-800 px-4 py-2 rounded-md text-center">
                        ❌ Aplicación Rechazada
                      </div>
                    )}
                    
                    {/* Botón para ver mis aplicaciones (solo freelancers) */}
                    {project.client_id !== user.id && (
                      <button
                        onClick={() => router.push('/my-applications')}
                        className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center"
                      >
                        📋 Mis Aplicaciones
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}