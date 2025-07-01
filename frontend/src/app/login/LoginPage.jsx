'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState({ google: false, github: false });
  const [config, setConfig] = useState({ colors: { primary: '#4CAF50', secondary: '#2C5F7F' } });

  const getErrorMessage = () => {
    const message = searchParams.get('message');
    
    if (message === 'logged_out') {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-green-800">
                Sesión cerrada exitosamente
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Has cerrado sesión correctamente. Puedes iniciar sesión nuevamente cuando lo desees.
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    if (error === 'user_already_exists') {
      const provider = searchParams.get('provider');
      const email = searchParams.get('email');
      const username = searchParams.get('username');
      
      if (provider === 'google') {
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Usuario ya registrado
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Ya existe una cuenta con el correo <strong>{email}</strong>. 
                  Si es tu cuenta, intenta iniciar sesión con el mismo método que usaste originalmente.
                </p>
              </div>
            </div>
          </div>
        );
      } else if (provider === 'github') {
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Usuario ya registrado
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Ya existe una cuenta con el correo <strong>{email}</strong> o el usuario de GitHub <strong>{username}</strong>. 
                  Si es tu cuenta, intenta iniciar sesión con el mismo método que usaste originalmente.
                </p>
              </div>
            </div>
          </div>
        );
      }
    }
    
    if (error === 'concurrent_access') {
      const provider = searchParams.get('provider');
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Acceso simultáneo detectado
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Se detectó un intento de registro simultáneo. Por favor, espera unos segundos e intenta iniciar sesión con {provider === 'google' ? 'Google' : 'GitHub'} nuevamente.
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    if (error === 'google_auth_failed') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Error de autenticación con Google
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Hubo un problema al iniciar sesión con Google. Por favor, inténtalo de nuevo.
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    if (error === 'github_auth_failed') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Error de autenticación con GitHub
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Hubo un problema al iniciar sesión con GitHub. Por favor, inténtalo de nuevo.
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  useEffect(() => {
    // Obtener configuración del backend
    fetch('http://localhost:3001/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error('Error loading config:', err));

    // Verificar si hay errores en la URL
    const errorParam = searchParams.get('error');
    const email = searchParams.get('email');
    const provider = searchParams.get('provider');
    const username = searchParams.get('username');
    
    if (errorParam === 'google_auth_failed') {
      setError('google_auth_failed');
    } else if (errorParam === 'github_auth_failed') {
      setError('github_auth_failed');
    } else if (errorParam === 'user_already_exists') {
      setError('user_already_exists');
    } else if (errorParam === 'concurrent_access') {
      setError('concurrent_access');
    }
  }, [searchParams]);

  const handleGoogleLogin = () => {
    if (isLoading.google || isLoading.github) return; // Prevent multiple clicks
    setIsLoading({ ...isLoading, google: true });
    setError(''); // Clear any previous errors
    window.location.href = 'http://localhost:3001/auth/google';
  };

  const handleGithubLogin = () => {
    if (isLoading.google || isLoading.github) return; // Prevent multiple clicks
    setIsLoading({ ...isLoading, github: true });
    setError(''); // Clear any previous errors
    window.location.href = 'http://localhost:3001/auth/github';
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold" style={{ color: config.colors.secondary }}>
            Plataforma Freelancer
          </h2>
          <p className="mt-2 text-gray-600">
            Conectando talento y oportunidades
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Elige cómo quieres acceder:
            </h3>
          </div>

          {/* Login para Clientes con Google */}
          <div className="border rounded-lg p-4" style={{ borderColor: config.colors.primary }}>
            <h4 className="font-medium text-gray-900 mb-2">¿Necesitas contratar freelancers?</h4>
            <p className="text-sm text-gray-600 mb-3">
              Accede como cliente y encuentra el talento perfecto para tu proyecto.
            </p>
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading.google || isLoading.github}
              className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white font-medium transition-colors ${
                isLoading.google || isLoading.github ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
              }`}
              style={{ backgroundColor: config.colors.primary }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLoading.google ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Conectando...
                </>
              ) : (
                'Continuar con Google (Cliente)'
              )}
            </button>
          </div>

          {/* Login para Freelancers con GitHub */}
          <div className="border rounded-lg p-4" style={{ borderColor: config.colors.secondary }}>
            <h4 className="font-medium text-gray-900 mb-2">¿Eres freelancer?</h4>
            <p className="text-sm text-gray-600 mb-3">
              Muestra tu portafolio de GitHub y encuentra proyectos increíbles.
            </p>
            <button
              onClick={handleGithubLogin}
              disabled={isLoading.google || isLoading.github}
              className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white font-medium transition-colors ${
                isLoading.google || isLoading.github ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
              }`}
              style={{ backgroundColor: config.colors.secondary }}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              {isLoading.github ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Conectando...
                </>
              ) : (
                'Continuar con GitHub (Freelancer)'
              )}
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Al continuar, aceptas nuestros términos de servicio y política de privacidad.
          </p>
        </div>
      </div>
    </div>
  );
}