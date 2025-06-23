'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

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
  // Using the configured supabase client

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

  const fetchProjectData = async () => {
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

      // Obtener aplicaciones aceptadas para encontrar participantes
      const applicationsResponse = await fetch(`http://localhost:3001/api/projects/${params.id}/applications`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json();
        const acceptedApplications = applicationsData.applications.filter(app => app.status === 'accepted');
        
        // Crear lista de participantes (excluyendo al usuario actual)
        const projectParticipants = [];
        
        // Si el usuario es el cliente, agregar freelancers aceptados
        if (projectData.project.client_id === session.user.id) {
          acceptedApplications.forEach(app => {
            if (app.freelancer_id !== session.user.id) {
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
          const hasAcceptedApplication = acceptedApplications.some(app => app.freelancer_id === session.user.id);
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
      console.error('Error:', error);
      setError(error.message);
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

  const handleSubmitReview = async (participantId) => {
    const review = reviews[participantId];
    
    if (!review?.rating) {
      alert('Por favor selecciona una calificación');
      return;
    }

    try {
      setSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:3001/api/reviews', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: params.id,
          reviewee_id: participantId,
          rating: parseInt(review.rating),
          comment: review.comment || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al enviar la review');
      }

      alert('Review enviada exitosamente');
      
      // Limpiar el formulario de review para este participante
      setReviews(prev => {
        const newReviews = { ...prev };
        delete newReviews[participantId];
        return newReviews;
      });

    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (participantId, currentRating) => {
    return [1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        type="button"
        onClick={() => handleReviewChange(participantId, 'rating', star)}
        className={`text-2xl ${
          star <= (currentRating || 0) 
            ? 'text-yellow-400' 
            : 'text-gray-300'
        } hover:text-yellow-400 transition-colors`}
      >
        ⭐
      </button>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información del proyecto...</p>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
          >
            ← Volver al proyecto
          </button>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ⭐ Calificar Participantes
            </h1>
            <h2 className="text-xl text-gray-700 mb-2">{project?.title}</h2>
            <p className="text-gray-600">
              Comparte tu experiencia trabajando en este proyecto
            </p>
          </div>
        </div>

        {/* Reviews Section */}
        {participants.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay participantes para calificar
            </h3>
            <p className="text-gray-600">
              Este proyecto aún no tiene freelancers aceptados o no tienes permisos para calificar.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {participants.map((participant) => {
              const review = reviews[participant.id] || {};
              
              return (
                <div key={participant.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      {participant.avatar_url ? (
                        <img
                          src={participant.avatar_url}
                          alt={participant.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-blue-600 font-semibold text-xl">
                          {participant.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {participant.name}
                      </h3>
                      <p className="text-gray-600">{participant.role}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Rating */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Calificación *
                      </label>
                      <div className="flex space-x-1">
                        {renderStars(participant.id, review.rating)}
                      </div>
                      {review.rating && (
                        <p className="text-sm text-gray-600 mt-1">
                          {review.rating} de 5 estrellas
                        </p>
                      )}
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comentario (opcional)
                      </label>
                      <textarea
                        value={review.comment || ''}
                        onChange={(e) => handleReviewChange(participant.id, 'comment', e.target.value)}
                        placeholder="Comparte tu experiencia trabajando con esta persona..."
                        rows={4}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSubmitReview(participant.id)}
                        disabled={submitting || !review.rating}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {submitting ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Enviando...
                          </div>
                        ) : (
                          'Enviar Review'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => router.push(`/projects/${params.id}/messages`)}
            className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            💬 Ver Mensajes
          </button>
          
          <button
            onClick={() => router.push('/projects/my')}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            📋 Mis Proyectos
          </button>
        </div>
      </div>
    </div>
  );
}