'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ProjectReviewPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState({});

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user && params.id) {
      fetchProjectData();
    }
  }, [user, params.id]);

  const checkUser = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }
      
      // Verify token with backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/verify`, {

        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        localStorage.removeItem('authToken');
        router.push('/login');
        return;
      }
      
      const userData = await response.json();
      setUser(userData.user);
    } catch (error) {
      console.error('Error checking user:', error);
      localStorage.removeItem('authToken');
      router.push('/login');
    }
  };

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        router.push('/login');
        return;
      }

      // Obtener proyecto
      const projectResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/${params.id}`, {

        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!projectResponse.ok) {
        throw new Error('Error al cargar el proyecto');
      }

      const projectData = await projectResponse.json();
      setProject(projectData.project);

      // Obtener aplicaciones aceptadas para encontrar participantes
      const applicationsResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/${params.id}/applications`, {

        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json();
        const acceptedApplications = applicationsData.applications.filter(app => app.status === 'accepted');
        
        // Crear lista de participantes (excluyendo al usuario actual)
        const projectParticipants = [];
        
        // Si el usuario es el cliente, agregar freelancers aceptados
        if (projectData.project.client_id === user.id) {
          acceptedApplications.forEach(app => {
            if (app.freelancer_id !== user.id) {
              projectParticipants.push({
                id: app.freelancer_id,
                name: app.user_profiles?.full_name || 'Usuario sin nombre',
                avatar_url: app.user_profiles?.avatar_url,
                role: 'Freelancer'
              });
            }
          });
        } else {
          // Si el usuario es freelancer, agregar el cliente
          const hasAcceptedApplication = acceptedApplications.some(app => app.freelancer_id === user.id);
          if (hasAcceptedApplication) {
            projectParticipants.push({
              id: projectData.project.client_id,
              name: projectData.project.client_name || 'Cliente',
              avatar_url: null,
              role: 'Cliente'
            });
          }
        }
        
        setParticipants(projectParticipants);
      }

    } catch (error) {
      console.error('Error fetching project data:', error);
      setError('Error al cargar los datos del proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewChange = (participantId, field, value) => {
    setReviews(prev => ({
      ...prev,
      [participantId]: {
        ...prev[participantId],
        [field]: value
      }
    }));
  };

  const submitReview = async (participantId) => {
    const review = reviews[participantId];
    if (!review || !review.rating) {
      alert('Por favor, proporciona una calificación');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reviews`, {

        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          project_id: params.id,
          reviewee_id: participantId,
          rating: parseInt(review.rating),
          comment: review.comment || null
        })
      });

      if (response.ok) {
        alert('Reseña enviada exitosamente');
        // Limpiar el formulario de reseña
        setReviews(prev => {
          const newReviews = { ...prev };
          delete newReviews[participantId];
          return newReviews;
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al enviar la reseña');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error al enviar la reseña: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Proyecto no encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Reseñas del Proyecto: {project.title}
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600">{project.description}</p>
          </div>

          {participants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay participantes para reseñar en este proyecto.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Participantes del Proyecto</h2>
              
              {participants.map(participant => {
                const review = reviews[participant.id] || {};
                
                return (
                  <div key={participant.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        {participant.avatar_url ? (
                          <img 
                            src={participant.avatar_url} 
                            alt={participant.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-medium">
                            {participant.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">{participant.name}</h3>
                        <p className="text-sm text-gray-500">{participant.role}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Calificación (1-5 estrellas)
                        </label>
                        <select
                          value={review.rating || ''}
                          onChange={(e) => handleReviewChange(participant.id, 'rating', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Selecciona una calificación</option>
                          <option value="1">1 estrella</option>
                          <option value="2">2 estrellas</option>
                          <option value="3">3 estrellas</option>
                          <option value="4">4 estrellas</option>
                          <option value="5">5 estrellas</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Comentario (opcional)
                        </label>
                        <textarea
                          value={review.comment || ''}
                          onChange={(e) => handleReviewChange(participant.id, 'comment', e.target.value)}
                          rows={3}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Escribe tu comentario sobre este participante..."
                        />
                      </div>
                      
                      <button
                        onClick={() => submitReview(participant.id)}
                        disabled={submitting || !review.rating}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Enviando...' : 'Enviar Reseña'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}