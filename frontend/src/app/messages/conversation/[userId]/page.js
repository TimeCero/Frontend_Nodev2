'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../../../components/Navigation';

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const messagesEndRef = useRef(null);
  
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkUser();
    fetchOtherUserProfile();
    fetchMessages();
  }, [params.userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  const fetchOtherUserProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3001/api/users/${params.userId}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOtherUser(data.user);
      } else {
        setError('Error al cargar el perfil del usuario');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Error al cargar el perfil del usuario');
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3001/api/messages/conversation/${params.userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Asegurar que todos los mensajes tengan IDs únicos
        const messagesWithIds = (data.messages || []).map((message, index) => ({
          ...message,
          id: message.id || `loaded-${Date.now()}-${index}`
        }));
        setMessages(messagesWithIds);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al cargar los mensajes');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Error al cargar los mensajes');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipient_id: params.userId,
          content: newMessage.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Asegurar que el mensaje tenga un ID único, created_at válido y sender_id correcto
        const newMessageObj = {
          ...data.message,
          id: data.message.id || `temp-${Date.now()}-${Math.random()}`,
          created_at: data.message.created_at || new Date().toISOString(),
          sender_id: data.message.sender_id || currentUser?.id,
          content: data.message.content || newMessage.trim()
        };
        setMessages(prev => [...prev, newMessageObj]);
        setNewMessage('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al enviar el mensaje');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Hora no disponible';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Hora inválida';
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES');
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      // Validar que created_at existe y es válido
      const createdAt = message.created_at || new Date().toISOString();
      const date = new Date(createdAt);
      const dateKey = isNaN(date.getTime()) ? new Date().toDateString() : date.toDateString();
      if (!groups[dateKey]) {
         groups[dateKey] = [];
       }
       groups[dateKey].push(message);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando conversación...</p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      
      {/* Conversation Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/messages"
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              {otherUser && (
                <div className="flex items-center space-x-3">
                  {otherUser.avatar_url ? (
                    <img
                      src={otherUser.avatar_url}
                      alt={otherUser.full_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm text-gray-600">
                        {otherUser.full_name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">
                      {otherUser.full_name || 'Usuario'}
                    </h1>
                    <p className="text-sm text-gray-500">
                      {otherUser.user_type === 'freelancer' ? 'Freelancer' : 'Cliente'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <Link
              href={`/freelancers/${params.userId}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Ver Perfil
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mx-4 mt-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            {Object.keys(messageGroups).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay mensajes</h3>
                <p className="text-gray-500">
                  Envía el primer mensaje para comenzar la conversación.
                </p>
              </div>
            ) : (
              Object.keys(messageGroups).map(dateKey => (
                <div key={dateKey} className="mb-6">
                  {/* Date separator */}
                  <div className="flex justify-center mb-4">
                    <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {formatDate(dateKey)}
                    </span>
                  </div>
                  
                  {/* Messages for this date */}
                  <div className="space-y-4">
                    {messageGroups[dateKey].map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_id === currentUser?.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-900 shadow-sm border'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender_id === currentUser?.id
                                ? 'text-blue-100'
                                : 'text-gray-500'
                            }`}
                          >
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white border-t px-4 py-4 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={sendMessage} className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={sending}
                />
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
                <span>Enviar</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}