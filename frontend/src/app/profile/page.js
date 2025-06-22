'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../components/Navigation';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ colors: { primary: '#3B82F6', secondary: '#10B981' } });
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ projects: 0, reviews: 0, rating: 0 });
  const router = useRouter();
  const userType = profile?.user_type;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Primero obtener datos básicos del usuario
        let authResponse = await fetch('http://localhost:3001/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!authResponse.ok) {
          authResponse = await fetch('http://localhost:3000/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }

        if (authResponse.ok) {
          const authData = await authResponse.json();
          
          // Luego obtener datos completos del perfil desde Supabase
          try {
            const profileResponse = await fetch('http://localhost:3001/api/profile', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              if (profileData.profile) {
                // Combinar datos básicos con datos completos del perfil
                const combinedData = {
                  ...authData.user,
                  ...profileData.profile,
                  full_name: profileData.profile.full_name || authData.user.name,
                  user_type: profileData.profile.user_type || authData.user.userType,
                  avatar_url: profileData.profile.avatar_url || authData.user.avatar
                };
                setProfile(combinedData);
              } else {
                // Si no hay perfil completo, usar solo datos básicos
                const mappedData = {
                  ...authData.user,
                  full_name: authData.user.name,
                  user_type: authData.user.userType,
                  avatar_url: authData.user.avatar
                };
                setProfile(mappedData);
              }
            } else {
              // Si falla la obtención del perfil completo, usar datos básicos
              const mappedData = {
                ...authData.user,
                full_name: authData.user.name,
                user_type: authData.user.userType,
                avatar_url: authData.user.avatar
              };
              setProfile(mappedData);
            }
          } catch (profileError) {
            console.error('Error fetching complete profile:', profileError);
            // Usar datos básicos como fallback
            const mappedData = {
              ...authData.user,
              full_name: authData.user.name,
              user_type: authData.user.userType,
              avatar_url: authData.user.avatar
            };
            setProfile(mappedData);
          }
          
          // Fetch user stats
          try {
            const statsResponse = await fetch(`http://localhost:3001/api/user-stats`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              setStats(statsData);
            }
          } catch (statsError) {
            console.log('Stats not available:', statsError);
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const configData = await response.json();
          setConfig(configData);
        }
      } catch (error) {
        console.error('Error fetching config:', error);
      }
    };

    fetchConfig();
  }, []);

  const getProfileCompleteness = () => {
    if (!profile) return 0;
    const fields = ['full_name', 'bio', 'location'];
    
    if (userType === 'freelancer') {
      fields.push('skills', 'hourly_rate', 'portfolio_url');
    } else {
      fields.push('company_name');
    }
    
    // Campos opcionales que aumentan la completitud
    const optionalFields = ['linkedin_url', 'website_url'];
    fields.push(...optionalFields);
    
    const completedFields = fields.filter(field => {
      if (field === 'skills') return profile[field] && profile[field].length > 0;
      if (field === 'hourly_rate') return profile[field] && profile[field] !== '' && profile[field] !== null;
      return profile[field] && profile[field].trim() !== '';
    });
    
    return Math.round((completedFields.length / fields.length) * 100);
  };

  const getMissingCriticalFields = () => {
    if (!profile) return [];
    const criticalFields = [
      { key: 'full_name', label: 'Nombre completo' },
      { key: 'bio', label: 'Biografía' }
    ];
    
    if (userType === 'freelancer') {
      criticalFields.push({ key: 'skills', label: 'Habilidades' });
    } else {
      criticalFields.push({ key: 'company_name', label: 'Nombre de la empresa' });
    }
    
    return criticalFields.filter(field => {
      if (field.key === 'skills') return !profile[field.key] || profile[field.key].length === 0;
      return !profile[field.key] || profile[field.key].trim() === '';
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'activity':
        return renderActivityTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return renderOverviewTab();
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {userType === 'freelancer' ? 'Proyectos Completados' : 'Proyectos Publicados'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.projects}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Calificación</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rating || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-2-2V10a2 2 0 012-2h8z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reseñas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.reviews}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Biografía</label>
              {profile?.bio ? (
                <p className="text-gray-900">{profile.bio}</p>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm">No especificada</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    ⚠️ Falta completar
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Ubicación</label>
              {profile?.location ? (
                <p className="text-gray-900">{profile.location}</p>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm">No especificada</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    ⚠️ Falta completar
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Miembro desde</label>
              <p className="text-gray-900">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'No disponible'}
              </p>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {userType === 'freelancer' ? 'Información Profesional' : 'Información de la Empresa'}
          </h3>
          <div className="space-y-4">
            {userType === 'freelancer' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Tarifa por hora</label>
                  {profile?.hourly_rate ? (
                    <p className="text-gray-900 font-semibold">${profile.hourly_rate} USD/hora</p>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 text-sm">No especificada</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⚠️ Falta completar
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Estado de disponibilidad</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile?.availability_status === 'available' 
                      ? 'bg-green-100 text-green-800' 
                      : profile?.availability_status === 'busy'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {profile?.availability_status === 'available' ? 'Disponible' : 
                     profile?.availability_status === 'busy' ? 'Ocupado' : 'No disponible'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Habilidades</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile?.skills && profile.skills.length > 0 ? (
                      profile.skills.map((skill, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400 text-sm">No especificadas</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⚠️ Falta completar
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {userType === 'client' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Nombre de la empresa</label>
                  {profile?.company_name ? (
                    <p className="text-gray-900">{profile.company_name}</p>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 text-sm">No especificado</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⚠️ Falta completar
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Industria</label>
                  {profile?.industry ? (
                    <p className="text-gray-900">{profile.industry}</p>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 text-sm">No especificada</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⚠️ Falta completar
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Links Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Enlaces y Redes Sociales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Portafolio', value: profile?.portfolio_url, icon: '🌐' },
            { label: 'LinkedIn', value: profile?.linkedin_url, icon: '💼' },
            { label: 'Sitio web', value: profile?.website_url, icon: '🔗' },
            { label: 'GitHub', value: profile?.github_username ? `https://github.com/${profile.github_username}` : null, icon: '💻' }
          ].map((link, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">{link.icon}</span>
                <label className="text-sm font-medium text-gray-700">{link.label}</label>
              </div>
              {link.value ? (
                <a 
                  href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm break-all"
                >
                  {link.value}
                </a>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm">No especificado</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    Opcional
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderActivityTab = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay actividad reciente</h3>
        <p className="mt-1 text-sm text-gray-500">Cuando tengas actividad, aparecerá aquí.</p>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Cuenta</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Notificaciones por email</h4>
              <p className="text-sm text-gray-500">Recibir notificaciones sobre nuevos proyectos y mensajes</p>
            </div>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-blue-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
            </button>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Perfil público</h4>
              <p className="text-sm text-gray-500">Permitir que otros usuarios vean tu perfil</p>
            </div>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-blue-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Zona de Peligro</h3>
        <div className="border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-900 mb-2">Eliminar cuenta</h4>
          <p className="text-sm text-red-700 mb-4">Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, ten cuidado.</p>
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
            Eliminar cuenta
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Missing Information Banner */}
        {getMissingCriticalFields().length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Tu perfil está incompleto
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Para mejorar tu visibilidad, completa la siguiente información:</p>
                  <ul className="list-disc list-inside mt-1">
                    {getMissingCriticalFields().map((field, index) => (
                      <li key={index}>{field.label}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3">
                  <a
                    href="/complete-profile"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                  >
                    Completar perfil ahora
                    <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 px-8 py-12">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              {/* Avatar */}
              <div className="relative">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name || 'Usuario'} 
                    className="w-24 h-24 rounded-full border-4 border-white shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center border-4 border-white shadow-xl">
                    <span className="text-3xl font-bold text-gray-600">
                      {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              {/* Profile Info */}
              <div className="text-center md:text-left text-white flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-4xl font-bold">
                    {profile?.full_name || (
                      <span className="text-blue-200">Nombre no especificado</span>
                    )}
                  </h1>
                  {!profile?.full_name && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-400 text-yellow-900">
                      ⚠️ Completar
                    </span>
                  )}
                </div>
                <p className="text-blue-100 text-lg mb-3">{profile?.email}</p>
                <div className="flex flex-col md:flex-row items-center md:items-start space-y-2 md:space-y-0 md:space-x-4">
                  <span className="inline-flex items-center bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm font-medium capitalize backdrop-blur-sm">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    {profile?.user_type === 'freelancer' ? 'Freelancer' : 'Cliente'}
                  </span>
                  <span className="inline-flex items-center bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                    📍 {profile?.location || 'Ubicación no especificada'}
                  </span>
                </div>
              </div>
              
              {/* Profile Completeness */}
              <div className="text-center text-white">
                <div className="mb-2">
                  <div className="text-2xl font-bold">{getProfileCompleteness()}%</div>
                  <div className="text-sm text-blue-100">Completado</div>
                </div>
                <div className="w-16 h-16 relative">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="2"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeDasharray={`${getProfileCompleteness()}, 100`}
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-8">
              {[
                { id: 'overview', name: 'Resumen', icon: '👤' },
                { id: 'activity', name: 'Actividad', icon: '📊' },
                { id: 'settings', name: 'Configuración', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="mb-8">
          {renderTabContent()}
        </div>

        {/* Profile Completion Banner */}
        {getProfileCompleteness() < 100 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  ¡Completa tu perfil para destacar!
                </h3>
                <p className="text-yellow-700 mb-4">
                  Tu perfil está {getProfileCompleteness()}% completo. Completa tu información para {userType === 'freelancer' ? 'atraer más clientes y conseguir mejores proyectos' : 'encontrar los mejores freelancers para tus proyectos'}.
                </p>
                <div className="flex items-center space-x-4">
                  <Link
                    href="/complete-profile"
                    className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Completar perfil
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-yellow-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProfileCompleteness()}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-yellow-700">{getProfileCompleteness()}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}