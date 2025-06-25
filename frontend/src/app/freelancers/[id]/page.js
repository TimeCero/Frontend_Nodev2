'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function FreelancerProfile() {
  const params = useParams();
  const router = useRouter();
  const [freelancer, setFreelancer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    checkUser();
    fetchFreelancerProfile();
    fetchFreelancerReviews();
  }, [params.id]);

  const checkUser = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData.user);
      } else {
        localStorage.removeItem('authToken');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error verificando usuario:', error);
      router.push('/login');
    }
  };

  const fetchFreelancerProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3001/api/freelancers/${params.id}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFreelancer(data.profile);
      } else {
        setError('No se pudo cargar el perfil del freelancer');
      }
    } catch (error) {
      console.error('Error fetching freelancer profile:', error);
      setError('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const fetchFreelancerReviews = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3001/api/users/${params.id}/reviews`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const sendDirectMessage = async () => {
    if (!message.trim()) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipient_id: params.id,
          content: message
        })
      });

      if (response.ok) {
        setMessage('');
        setShowMessageModal(false);
        // Redirigir a la conversación
        router.push(`/messages/conversation/${params.id}`);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error al enviar el mensaje');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar el mensaje');
    } finally {
      setSendingMessage(false);
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!freelancer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Freelancer no encontrado</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Volver
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Perfil del Freelancer</h1>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Perfil Principal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Información Básica */}
              <div className="flex items-start space-x-6 mb-6">
                <div className="flex-shrink-0">
                  {freelancer.avatar_url ? (
                    <img
                      src={freelancer.avatar_url}
                      alt={freelancer.full_name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-2xl text-gray-600">
                        {freelancer.full_name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {freelancer.full_name || 'Nombre no disponible'}
                  </h2>
                  <p className="text-lg text-gray-600 mb-2">
                    {freelancer.bio || 'Sin descripción disponible'}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {freelancer.location && (
                      <span>📍 {freelancer.location}</span>
                    )}
                    {freelancer.hourly_rate && (
                      <span>💰 ${freelancer.hourly_rate}/hora</span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      freelancer.availability_status === 'available' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {freelancer.availability_status === 'available' ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Habilidades */}
              {freelancer.skills && freelancer.skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Habilidades</h3>
                  <div className="flex flex-wrap gap-2">
                    {freelancer.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Enlaces */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {freelancer.github_username && (
                  <a
                    href={`https://github.com/${freelancer.github_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                  >
                    <span>🐙</span>
                    <span>GitHub</span>
                  </a>
                )}
                {freelancer.linkedin_url && (
                  <a
                    href={freelancer.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                  >
                    <span>💼</span>
                    <span>LinkedIn</span>
                  </a>
                )}
                {freelancer.portfolio_url && (
                  <a
                    href={freelancer.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                  >
                    <span>🌐</span>
                    <span>Portafolio</span>
                  </a>
                )}
                {freelancer.website_url && (
                  <a
                    href={freelancer.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                  >
                    <span>🌍</span>
                    <span>Sitio Web</span>
                  </a>
                )}
              </div>
            </div>

            {/* Reseñas */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Reseñas</h3>
              
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {review.reviewer?.avatar_url ? (
                              <img
                                src={review.reviewer.avatar_url}
                                alt={review.reviewer.full_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-sm text-gray-600">
                                  {review.reviewer?.full_name?.charAt(0) || '?'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {review.reviewer?.full_name || 'Usuario anónimo'}
                            </p>
                            <div className="flex items-center space-x-2">
                              <div className="flex">
                                {renderStars(review.rating)}
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 ml-13">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Este freelancer aún no tiene reseñas.
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Estadísticas */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Calificación promedio:</span>
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold">{calculateAverageRating()}</span>
                    <span className="text-yellow-400">★</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de reseñas:</span>
                  <span className="font-semibold">{reviews.length}</span>
                </div>
              </div>
            </div>

            {/* Acciones */}
            {currentUser && currentUser.id !== params.id && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowMessageModal(true)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    💬 Enviar Mensaje
                  </button>
                  <button className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    💾 Guardar Freelancer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Mensaje */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Enviar mensaje a {freelancer.full_name}
            </h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setMessage('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={sendingMessage}
              >
                Cancelar
              </button>
              <button
                onClick={sendDirectMessage}
                disabled={sendingMessage || !message.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingMessage ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}