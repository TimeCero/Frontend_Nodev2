'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';

export default function ClientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileBanner, setShowProfileBanner] = useState(false);
  const [config, setConfig] = useState({ colors: { primary: '#4CAF50', secondary: '#2C5F7F' } });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');

    if (!token || userType !== 'client') {
      router.push('/login');
      return;
    }

    // Obtener configuración
    fetch('http://localhost:3001/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error('Error loading config:', err));

    // Verificar autenticación
    fetch('http://localhost:3001/auth/verify-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token })
    })
    .then(res => res.json())
    .then(data => {
      if (data.valid && data.user.userType === 'client') {
        setUser(data.user);
        
        // Verificar si el perfil está completo
        const profileCompleted = localStorage.getItem('profileCompleted');
        if (profileCompleted !== 'true') {
          // Verificar si el usuario tiene información básica completa
          const hasBasicInfo = data.user?.bio;
          if (!hasBasicInfo) {
            setShowProfileBanner(true);
          } else {
            localStorage.setItem('profileCompleted', 'true');
          }
        }
      } else {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
        router.push('/login');
      }
      setLoading(false);
    })
    .catch(err => {
      console.error('Error:', err);
      router.push('/login');
    });
  }, [router]);

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        console.warn('Backend logout failed, continuing with local cleanup');
      }
    } catch (error) {
      console.warn('Error calling logout endpoint:', error);
    }
    
    // Clear all local storage data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('profileCompleted');
    localStorage.removeItem('token');
    
    // Clear session storage
    sessionStorage.clear();
    
    // Redirect to login
    router.push('/login?message=logged_out');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Banner de perfil incompleto */}
          {showProfileBanner && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Completa tu perfil para atraer mejores freelancers
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Los freelancers prefieren trabajar con clientes que tienen perfiles completos. Agrega información sobre tu empresa.
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push('/complete-profile')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Completar Perfil
                  </button>
                  <button
                    onClick={() => setShowProfileBanner(false)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Omitir
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Welcome Section */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Bienvenido/a, {user?.name}! 👋
              </h2>
              <p className="text-gray-600 mb-4">
                Desde aquí puedes gestionar tus proyectos, buscar freelancers y mucho más.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-medium text-green-900">Proyectos Activos</h3>
                  <p className="text-2xl font-bold text-green-600">0</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-900">Freelancers Contratados</h3>
                  <p className="text-2xl font-bold text-blue-600">0</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="font-medium text-purple-900">Proyectos Completados</h3>
                  <p className="text-2xl font-bold text-purple-600">0</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={() => router.push('/projects/create')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  style={{ borderColor: config.colors.primary }}
                >
                  <div className="text-2xl mb-2">📝</div>
                  <h4 className="font-medium text-gray-900">Publicar Proyecto</h4>
                  <p className="text-sm text-gray-600">Crea un nuevo proyecto y encuentra freelancers</p>
                </button>
                
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="text-2xl mb-2">🔍</div>
                  <h4 className="font-medium text-gray-900">Buscar Freelancers</h4>
                  <p className="text-sm text-gray-600">Explora perfiles de freelancers</p>
                </button>
                
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="text-2xl mb-2">💬</div>
                  <h4 className="font-medium text-gray-900">Mensajes</h4>
                  <p className="text-sm text-gray-600">Revisa tus conversaciones</p>
                </button>
                
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="text-2xl mb-2">⚙️</div>
                  <h4 className="font-medium text-gray-900">Configuración</h4>
                  <p className="text-sm text-gray-600">Ajusta tu perfil y preferencias</p>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Actividad Reciente</h3>
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-gray-500">No hay actividad reciente</p>
                <p className="text-sm text-gray-400 mt-2">
                  Cuando publiques proyectos o contrates freelancers, verás la actividad aquí.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}