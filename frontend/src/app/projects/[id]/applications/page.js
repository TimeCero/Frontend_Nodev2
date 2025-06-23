'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function ProjectApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  // Using the configured supabase client

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user && params.id) {
      fetchProjectAndApplications();
    }
  }, [user, params.id]);

  const checkUser = async () => {
    try {
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

  const fetchProjectAndApplications = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Obtener proyecto
      const projectResponse = await fetch(`http://localhost:3001/api/projects/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!projectResponse.ok) {
        throw new Error('Error al cargar el proyecto');
      }

      const projectData = await projectResponse.json();
      setProject(projectData.project);

      // Verificar que el usuario es el dueño del proyecto
      if (projectData.project.client_id !== session.user.id) {
        setError('No tienes permisos para ver las aplicaciones de este proyecto');
        return;
      }

      // Obtener aplicaciones
      const applicationsResponse = await fetch(`http://localhost:3001/api/projects/${params.id}/applications`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!applicationsResponse.ok) {
        throw new Error('Error al cargar las aplicaciones');
      }

      const applicationsData = await applicationsResponse.json();
      setApplications(applicationsData.applications);

    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationStatus = async (applicationId, status) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar la aplicación');
      }

      // Actualizar la lista de aplicaciones
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status, updated_at: new Date().toISOString() }
            : app
        )
      );

      alert(`Aplicación ${status === 'accepted' ? 'aceptada' : 'rechazada'} exitosamente`);

    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      accepted: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aceptada' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazada' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando aplicaciones...</p>
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
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
          >
            ← Volver al proyecto
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Aplicaciones para: {project?.title}
          </h1>
          <p className="text-gray-600">
            Gestiona las aplicaciones de freelancers para tu proyecto
          </p>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay aplicaciones aún
            </h3>
            <p className="text-gray-600">
              Los freelancers interesados en tu proyecto aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((application) => (
              <div key={application.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Freelancer Info */}
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        {application.user_profiles?.avatar_url ? (
                          <img
                            src={application.user_profiles.avatar_url}
                            alt={application.user_profiles.full_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-blue-600 font-semibold text-lg">
                            {application.user_profiles?.full_name?.charAt(0) || '?'}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.user_profiles?.full_name || 'Usuario sin nombre'}
                        </h3>
                        <p className="text-gray-600">
                          ${application.user_profiles?.hourly_rate || 'No especificado'}/hora
                        </p>
                      </div>
                    </div>

                    {/* Application Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Tarifa Propuesta</h4>
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
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-md">
                        {application.proposal}
                      </p>
                    </div>

                    {/* Cover Letter */}
                    {application.cover_letter && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Carta de Presentación</h4>
                        <p className="text-gray-600 bg-gray-50 p-3 rounded-md">
                          {application.cover_letter}
                        </p>
                      </div>
                    )}

                    {/* Skills */}
                    {application.user_profiles?.skills && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Habilidades</h4>
                        <div className="flex flex-wrap gap-2">
                          {application.user_profiles.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bio */}
                    {application.user_profiles?.bio && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Biografía</h4>
                        <p className="text-gray-600">{application.user_profiles.bio}</p>
                      </div>
                    )}
                  </div>

                  {/* Status and Actions */}
                  <div className="ml-6 flex flex-col items-end">
                    <div className="mb-4">
                      {getStatusBadge(application.status)}
                    </div>
                    
                    {application.status === 'pending' && (
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleApplicationStatus(application.id, 'accepted')}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                        >
                          Aceptar
                        </button>
                        <button
                          onClick={() => handleApplicationStatus(application.id, 'rejected')}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}

                    {application.status === 'accepted' && (
                      <button
                        onClick={() => router.push(`/projects/${params.id}/messages`)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Ver Mensajes
                      </button>
                    )}
                  </div>
                </div>

                {/* Application Date */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Aplicación enviada el {new Date(application.created_at).toLocaleDateString('es-ES', {
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