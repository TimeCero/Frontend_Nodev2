'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const userTypeParam = searchParams.get('userType');
    setUserType(userTypeParam);

    if (!token) {
      setError('Token de autenticación no encontrado');
      setLoading(false);
      return;
    }

    // Guardar token en localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('userType', userTypeParam);

    // Verificar token con el backend
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/verify-token`, {

      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token })
    })
    .then(res => res.json())
    .then(async data => {
      if (data.valid) {
        setUser(data.user);
        
        // Verificar si ya existe un perfil completo en Supabase
        try {
          const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile`, {

            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          let hasCompleteProfile = false;
          
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.profile) {
              // Verificar si el perfil tiene los campos críticos completos
              const profile = profileData.profile;
              const hasName = profile.full_name && profile.full_name.trim() !== '';
              const hasBio = profile.bio && profile.bio.trim() !== '';
              
              if (userTypeParam === 'freelancer') {
                const hasSkills = profile.skills && profile.skills.length > 0;
                hasCompleteProfile = hasName && hasBio && hasSkills;
              } else {
                const hasCompany = profile.company_name && profile.company_name.trim() !== '';
                hasCompleteProfile = hasName && hasBio && hasCompany;
              }
              
              // Actualizar localStorage basado en el estado real del perfil
              if (hasCompleteProfile) {
                localStorage.setItem('profileCompleted', 'true');
              } else {
                localStorage.removeItem('profileCompleted');
              }
            }
          }
          
          // Redirigir según el estado del perfil después de 3 segundos
          setTimeout(() => {
            if (hasCompleteProfile) {
              // Perfil ya completado, ir al dashboard
              if (userTypeParam === 'client') {
                router.push('/dashboard/client');
              } else if (userTypeParam === 'freelancer') {
                router.push('/dashboard/freelancer');
              } else {
                router.push('/dashboard');
              }
            } else {
              // Perfil no completado o incompleto, ir a completar perfil
              router.push('/setup-profile');
            }
          }, 3000);
          
        } catch (profileError) {
          console.error('Error checking profile:', profileError);
          // En caso de error, usar el comportamiento por defecto
          const profileCompleted = localStorage.getItem('profileCompleted');
          setTimeout(() => {
            if (profileCompleted === 'true') {
              if (userTypeParam === 'client') {
                router.push('/dashboard/client');
              } else if (userTypeParam === 'freelancer') {
                router.push('/dashboard/freelancer');
              } else {
                router.push('/dashboard');
              }
            } else {
              router.push('/setup-profile');
            }
          }, 3000);
        }
      } else {
        setError('Token inválido');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
      }
      setLoading(false);
    })
    .catch(err => {
      console.error('Error verifying token:', err);
      setError('Error al verificar la autenticación');
      setLoading(false);
    });
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Verificando autenticación...</h2>
          <p className="text-gray-600 mt-2">Por favor espera un momento</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error de Autenticación</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Volver al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-green-500 text-6xl mb-4">✅</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">¡Autenticación Exitosa!</h2>
        
        {user && (
          <div className="mb-6">
            <p className="text-gray-600 mb-2">Bienvenido/a, <strong>{user.email}</strong></p>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                 style={{
                   backgroundColor: user.userType === 'client' ? '#4CAF50' : '#2C5F7F',
                   color: 'white'
                 }}>
              {user.userType === 'client' ? '👤 Cliente' : '💻 Freelancer'}
            </div>
          </div>
        )}
        
        <p className="text-gray-600 mb-4">
          Redirigiendo a tu dashboard en unos segundos...
        </p>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
        </div>
        
        <button
          onClick={() => {
          const profileCompleted = localStorage.getItem('profileCompleted');
          
          if (profileCompleted === 'true') {
            // Perfil ya completado, ir al dashboard
            if (userType === 'client') {
              router.push('/dashboard/client');
            } else if (userType === 'freelancer') {
              router.push('/dashboard/freelancer');
            } else {
              router.push('/dashboard');
            }
          } else {
            // Perfil no completado, ir a completar perfil
            router.push('/setup-profile');
          }
        }}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
        >
            {localStorage.getItem('profileCompleted') === 'true' ? 'Ir al Dashboard Ahora' : 'Completar Perfil Ahora'}
          </button>
      </div>
    </div>
  );
}