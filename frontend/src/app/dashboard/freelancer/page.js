'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';

export default function FreelancerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileBanner, setShowProfileBanner] = useState(false);
  const [config, setConfig] = useState({ colors: { primary: '#4CAF50', secondary: '#2C5F7F' } });
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({ sent: 0, completed: 0 });

  const fetchApplications = async (token) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/my-applications`, {

        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
        
        // Calcular estadísticas
        const totalSent = data.applications?.length || 0;
        const completed = data.applications?.filter(app => app.status === 'accepted')?.length || 0;
        
        setStats({ sent: totalSent, completed });
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');

    if (!token || userType !== 'freelancer') {
      router.push('/login');
      return;
    }

    // Obtener configuración
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/config`)

      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error('Error loading config:', err));

    // Verificar autenticación
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/verify-token`, {

      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token })
    })
    .then(res => res.json())
    .then(data => {
      if (data.valid && data.user.userType === 'freelancer') {
        setUser(data.user);
        
        // Verificar si el perfil está completo
        const profileCompleted = localStorage.getItem('profileCompleted');
        if (profileCompleted !== 'true') {
          // Verificar si el usuario tiene información básica completa
          const hasBasicInfo = data.user?.bio && data.user?.skills && data.user.skills.length > 0;
          if (!hasBasicInfo) {
            setShowProfileBanner(true);
          } else {
            localStorage.setItem('profileCompleted', 'true');
          }
        }
        
        // Obtener aplicaciones del freelancer
        fetchApplications(token);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Completa tu perfil para obtener más proyectos
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Los clientes prefieren freelancers con perfiles completos. Agrega tu biografía, habilidades y tarifa.
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push('/complete-profile')}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700"
                  >
                    Completar Perfil
                  </button>
                  <button
                    onClick={() => setShowProfileBanner(false)}
                    className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
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
                ¡Hola, {user?.name}! 💻
              </h2>
              <p className="text-gray-600 mb-4">
                Gestiona tus proyectos, busca nuevas oportunidades y haz crecer tu carrera freelance.
              </p>
              
              {/* GitHub Stats */}
              {user?.githubProfile && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">Tu Perfil de GitHub</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold" style={{ color: config.colors.secondary }}>
                        {user.githubProfile.publicRepos}
                      </p>
                      <p className="text-sm text-gray-600">Repositorios</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ color: config.colors.secondary }}>
                        {user.githubProfile.followers}
                      </p>
                      <p className="text-sm text-gray-600">Seguidores</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold" style={{ color: config.colors.secondary }}>
                        {user.githubProfile.following}
                      </p>
                      <p className="text-sm text-gray-600">Siguiendo</p>
                    </div>
                    <div>
                      <a 
                        href={`https://github.com/${user.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Ver Perfil
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-900">Propuestas Enviadas</h3>
                  <p className="text-2xl font-bold text-blue-600">{stats.sent}</p>
                  <p className="text-sm text-gray-600 mt-1">Aplicaciones totales</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-medium text-green-900">Propuestas Aceptadas</h3>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                  <p className="text-sm text-gray-600 mt-1">Proyectos conseguidos</p>
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
                  onClick={() => router.push('/projects')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  style={{ borderColor: config.colors.secondary }}
                >
                  <div className="text-2xl mb-2">🔍</div>
                  <h4 className="font-medium text-gray-900">Buscar Proyectos</h4>
                  <p className="text-sm text-gray-600">Encuentra nuevas oportunidades</p>
                </button>
                
                <button 
                  onClick={() => router.push('/my-applications')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">📝</div>
                  <h4 className="font-medium text-gray-900">Mis Propuestas</h4>
                  <p className="text-sm text-gray-600">Gestiona tus ofertas enviadas</p>
                </button>
                
                <button 
                  onClick={() => router.push('/messages')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">💬</div>
                  <h4 className="font-medium text-gray-900">Mensajes</h4>
                  <p className="text-sm text-gray-600">Comunícate con clientes</p>
                </button>
                
                <button 
                  onClick={() => router.push('/profile')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">👤</div>
                  <h4 className="font-medium text-gray-900">Mi Perfil</h4>
                  <p className="text-sm text-gray-600">Actualiza tu información</p>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Opportunities */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Oportunidades Recientes</h3>
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🚀</div>
                <p className="text-gray-500">No hay proyectos disponibles aún</p>
                <p className="text-sm text-gray-400 mt-2">
                  Cuando haya nuevos proyectos que coincidan con tu perfil, aparecerán aquí.
                </p>
                <button 
                  onClick={() => router.push('/projects')}
                  className="mt-4 px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90"
                  style={{ backgroundColor: config.colors.secondary }}
                >
                  Explorar Proyectos
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}