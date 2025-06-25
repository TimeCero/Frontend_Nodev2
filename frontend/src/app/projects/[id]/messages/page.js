'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '../../../components/Navigation';
import { supabase } from '../../../../lib/supabase';

export default function ProjectMessagesPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);
  // Using the configured supabase client

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user && params.id) {
      fetchProjectAndMessages();
    }
  }, [user, params.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  const fetchProjectAndMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        router.push('/login');
        return;
      }

      // Obtener proyecto
      const projectResponse = await fetch(`http://localhost:3001/api/projects/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!projectResponse.ok) {
        throw new Error('Error al cargar el proyecto');
      }

      const projectData = await projectResponse.json();
      setProject(projectData.project);

      // Obtener mensajes
      const messagesResponse = await fetch(`http://localhost:3001/api/projects/${params.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!messagesResponse.ok) {
        const errorData = await messagesResponse.json();
        throw new Error(errorData.message || 'Error al cargar los mensajes');
      }

      const messagesData = await messagesResponse.json();
      setMessages(messagesData.messages);

    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/projects/${params.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newMessage.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al enviar el mensaje');
      }

      const result = await response.json();
      
      // Agregar el nuevo mensaje a la lista
      setMessages(prev => [...prev, result.data]);
      setNewMessage('');

    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando mensajes...</p>
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
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
          >
            ← Volver al proyecto
          </button>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              💬 Mensajes: {project?.title}
            </h1>
            <p className="text-gray-600">
              Comunícate con el equipo del proyecto
            </p>
          </div>
        </div>

        {/* Messages Container */}
        <div className="bg-white rounded-lg shadow flex flex-col" style={{ height: '600px' }}>
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No hay mensajes aún
                </h3>
                <p className="text-gray-600">
                  Inicia la conversación enviando el primer mensaje.
                </p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.sender_id === user?.id;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwnMessage 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-900'
                    }`}>
                      {!isOwnMessage && (
                        <div className="flex items-center mb-1">
                          <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center mr-2">
                            {message.user_profiles?.avatar_url ? (
                              <img
                                src={message.user_profiles.avatar_url}
                                alt={message.user_profiles.full_name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-white text-xs font-semibold">
                                {message.user_profiles?.full_name?.charAt(0) || '?'}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-semibold">
                            {message.user_profiles?.full_name || 'Usuario'}
                          </span>
                        </div>
                      )}
                      
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      <p className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </div>
                ) : (
                  'Enviar'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={() => router.push(`/projects/${params.id}/review`)}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            ⭐ Dejar Review
          </button>
          
          {project?.client_id === user?.id && (
            <button
              onClick={() => router.push(`/projects/${params.id}/applications`)}
              className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              📋 Ver Aplicaciones
            </button>
          )}
        </div>
      </div>
    </div>
  );
}