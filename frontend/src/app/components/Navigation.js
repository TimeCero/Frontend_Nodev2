'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [config, setConfig] = useState({ colors: { primary: '#4CAF50', secondary: '#2C5F7F' } });

  useEffect(() => {
    // Obtener configuración
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/config`)

      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error('Error loading config:', err));

    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      // Primero verificar si hay un token JWT del backend
      const authToken = localStorage.getItem('authToken');
      const storedUserType = localStorage.getItem('userType');
      
      if (authToken && storedUserType) {
        // Verificar el token con el backend
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/verify-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: authToken })
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.valid && result.user) {
              setUser({
                id: result.user.id,
                email: result.user.email,
                name: result.user.full_name || result.user.email?.split('@')[0],
                full_name: result.user.full_name,
                avatar: result.user.avatar_url
              });
              setUserType(storedUserType);
              return;
            }
          }
        } catch (error) {
          console.error('Error verifying JWT token:', error);
          // Si falla la verificación JWT, limpiar localStorage
          localStorage.removeItem('authToken');
          localStorage.removeItem('userType');
        }
      }
      
      // Si no hay token JWT válido, verificar Supabase Auth
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        
        // Obtener perfil del usuario para determinar el tipo
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('user_type, full_name, avatar_url')
          .eq('user_id', session.user.id)
          .single();
        
        if (profile) {
          setUserType(profile.user_type);
          setUser({
            ...session.user,
            full_name: profile.full_name,
            avatar: profile.avatar_url
          });
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear local state
      setUser(null);
      setUserType(null);
      
      // Clear any remaining localStorage data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userType');
      localStorage.removeItem('profileCompleted');
      localStorage.removeItem('token');
    
      // Clear session storage as well
      sessionStorage.clear();
    
      // Reset state
      setUser(null);
      setUserType(null);
    
      // Redirect to login page with logout message
      router.push('/login?message=logged_out');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still redirect even if there's an error
      router.push('/login?message=logged_out');
    }
  };

  const getDashboardLink = () => {
    if (userType === 'client') return '/dashboard/client';
    if (userType === 'freelancer') return '/dashboard/freelancer';
    return '/';
  };

  // Función para verificar si un enlace está activo
  const isActiveLink = (href) => {
    return pathname === href;
  };

  // Función para obtener clases de enlace
  const getLinkClasses = (href, isMobile = false) => {
    const baseClasses = isMobile 
      ? "block px-3 py-2 rounded-md text-base font-medium transition-colors"
      : "px-3 py-2 rounded-md text-sm font-medium transition-colors";
    
    const activeClasses = isActiveLink(href)
      ? "bg-blue-100 text-blue-700"
      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50";
    
    return `${baseClasses} ${activeClasses}`;
  };

  return (
    <nav className="bg-white shadow-lg border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <img 
                src="/logo.svg" 
                alt="FreelanceHub Logo" 
                className="w-8 h-8"
                onError={(e) => {
                  // Fallback si no se encuentra el logo
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div 
                className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center"
                style={{ display: 'none' }}
              >
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <h1 className="text-xl font-bold" style={{ color: config.colors.secondary }}>
                FreelanceHub
              </h1>
            </Link>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {user ? (
              // Menú para usuarios logueados
              <>
                <Link href={getDashboardLink()} className={getLinkClasses(getDashboardLink())}>
                  Dashboard
                </Link>
                
                {userType === 'client' && (
                  <>
                    <Link href="/projects/my" className={getLinkClasses('/projects/my')}>
                      Mis Proyectos
                    </Link>
                    <Link href="/projects/create" className={getLinkClasses('/projects/create')}>
                      Publicar Trabajo
                    </Link>
                    <Link href="/freelancers" className={getLinkClasses('/freelancers')}>
                      Buscar Freelancers
                    </Link>
                  </>
                )}
                
                {userType === 'freelancer' && (
                  <>
                    <Link href="/projects" className={getLinkClasses('/projects')}>
                      Explorar Trabajos
                    </Link>
                    <Link href="/my-applications" className={getLinkClasses('/my-applications')}>
                      Mis Propuestas
                    </Link>
                  </>
                )}
                
                <Link href="/messages" className={getLinkClasses('/messages')}>
                  Mensajes
                </Link>

                {/* User Menu */}
                <div className="relative ml-4">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name || user.email} 
                        className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center"
                      style={{ display: user.avatar ? 'none' : 'flex' }}
                    >
                      <span className="text-white text-sm font-medium">
                        {user.name ? user.name.charAt(0).toUpperCase() : 
                         user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <span className="hidden lg:block">{user.name || user.email?.split('@')[0] || 'Usuario'}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900">{user.name || 'Usuario'}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400 capitalize">{userType}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Mi Perfil
                      </Link>
                      <Link
                        href="/profile/edit"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Editar Perfil
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Configuración
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleLogout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Menú para visitantes
              <>
                <Link href="/" className={getLinkClasses('/')}>
                  Inicio
                </Link>
                <Link href="/freelancers" className={getLinkClasses('/freelancers')}>
                  Buscar Freelancers
                </Link>
                <Link href="/how-it-works" className={getLinkClasses('/how-it-works')}>
                  Cómo Funciona
                </Link>
                <Link href="/about" className={getLinkClasses('/about')}>
                  Sobre Nosotros
                </Link>
                <Link 
                  href="/login"
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium rounded-lg transition-colors border border-gray-300 hover:border-gray-400"
                >
                  Iniciar Sesión
                </Link>
                <Link 
                  href="/login"
                  className="px-4 py-2 text-white font-medium rounded-lg transition-colors ml-2"
                  style={{ backgroundColor: config.colors.primary }}
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-gray-900 focus:outline-none focus:text-gray-900"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t bg-gray-50">
              {user ? (
                <>
                  {/* User info en móvil */}
                  <div className="flex items-center space-x-3 px-3 py-2 mb-2">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name || user.email} 
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center"
                      style={{ display: user.avatar ? 'none' : 'flex' }}
                    >
                      <span className="text-white font-medium">
                        {user.name ? user.name.charAt(0).toUpperCase() : 
                         user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name || user.email?.split('@')[0] || 'Usuario'}</p>
                      <p className="text-sm text-gray-500 capitalize">{userType}</p>
                    </div>
                  </div>
                  
                  <Link href={getDashboardLink()} className={getLinkClasses(getDashboardLink(), true)} onClick={() => setIsMenuOpen(false)}>
                    Dashboard
                  </Link>
                  
                  {userType === 'client' && (
                    <>
                      <Link href="/projects/my" className={getLinkClasses('/projects/my', true)} onClick={() => setIsMenuOpen(false)}>
                        Mis Proyectos
                      </Link>
                      <Link href="/projects/create" className={getLinkClasses('/projects/create', true)} onClick={() => setIsMenuOpen(false)}>
                        Publicar Trabajo
                      </Link>
                      <Link href="/freelancers" className={getLinkClasses('/freelancers', true)} onClick={() => setIsMenuOpen(false)}>
                        Buscar Freelancers
                      </Link>
                    </>
                  )}
                  
                  {userType === 'freelancer' && (
                    <>
                      <Link href="/projects" className={getLinkClasses('/projects', true)} onClick={() => setIsMenuOpen(false)}>
                        Explorar Trabajos
                      </Link>
                      <Link href="/my-applications" className={getLinkClasses('/my-applications', true)} onClick={() => setIsMenuOpen(false)}>
                        Mis Propuestas
                      </Link>
                    </>
                  )}
                  
                  <Link href="/messages" className={getLinkClasses('/messages', true)} onClick={() => setIsMenuOpen(false)}>
                    Mensajes
                  </Link>
                  
                  <hr className="my-2" />
                  
                  <Link href="/profile" className={getLinkClasses('/profile', true)} onClick={() => setIsMenuOpen(false)}>
                    Mi Perfil
                  </Link>
                  
                  <Link href="/profile/edit" className={getLinkClasses('/profile/edit', true)} onClick={() => setIsMenuOpen(false)}>
                    Editar Perfil
                  </Link>
                  
                  <Link href="/settings" className={getLinkClasses('/settings', true)} onClick={() => setIsMenuOpen(false)}>
                    Configuración
                  </Link>
                  
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                    className="block w-full text-left text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-md text-base font-medium transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <Link href="/" className={getLinkClasses('/', true)} onClick={() => setIsMenuOpen(false)}>
                    Inicio
                  </Link>
                  <Link href="/freelancers" className={getLinkClasses('/freelancers', true)} onClick={() => setIsMenuOpen(false)}>
                    Buscar Freelancers
                  </Link>
                  <Link href="/how-it-works" className={getLinkClasses('/how-it-works', true)} onClick={() => setIsMenuOpen(false)}>
                    Cómo Funciona
                  </Link>
                  <Link href="/about" className={getLinkClasses('/about', true)} onClick={() => setIsMenuOpen(false)}>
                    Sobre Nosotros
                  </Link>
                  <hr className="my-2" />
                  <Link href="/login" className={getLinkClasses('/login', true)} onClick={() => setIsMenuOpen(false)}>
                    Iniciar Sesión
                  </Link>
                  <Link 
                    href="/login"
                    className="block mx-3 my-2 px-4 py-2 text-white font-medium rounded-lg transition-colors text-center"
                    style={{ backgroundColor: config.colors.primary }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}