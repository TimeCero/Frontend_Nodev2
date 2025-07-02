'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from './components/Navigation';

export default function Home() {
  const router = useRouter();
  const [config, setConfig] = useState({ colors: { primary: '#4CAF50', secondary: '#2C5F7F' } });

  useEffect(() => {
    // Verificar si ya está autenticado
    const token = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');
    
    if (token && userType) {
      // Redirigir al dashboard correspondiente
      if (userType === 'client') {
        router.push('/dashboard/client');
      } else if (userType === 'freelancer') {
        router.push('/dashboard/freelancer');
      }
    }

    // Obtener configuración
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/config`)
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error('Error loading config:', err));
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Navigation />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Conecta con los mejores
            <span className="block" style={{ color: config.colors.primary }}>
              freelancers
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            La plataforma que une clientes con freelancers talentosos. 
            Encuentra el proyecto perfecto o el profesional ideal para tu negocio.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/login"
              className="px-8 py-3 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              style={{ backgroundColor: config.colors.primary }}
            >
              Soy Cliente - Busco Freelancers
            </Link>
            <Link 
              href="/login"
              className="px-8 py-3 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              style={{ backgroundColor: config.colors.secondary }}
            >
              Soy Freelancer - Busco Proyectos
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-3" style={{ color: config.colors.secondary }}>
              Para Clientes
            </h3>
            <p className="text-gray-600">
              Encuentra freelancers verificados con autenticación GitHub. 
              Revisa sus repositorios y proyectos antes de contratar.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">💼</div>
            <h3 className="text-xl font-semibold mb-3" style={{ color: config.colors.secondary }}>
              Para Freelancers
            </h3>
            <p className="text-gray-600">
              Muestra tu experiencia real con tu perfil de GitHub. 
              Accede a proyectos que coincidan con tus habilidades.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-3" style={{ color: config.colors.secondary }}>
              Seguro y Confiable
            </h3>
            <p className="text-gray-600">
              Autenticación OAuth con Google y GitHub. 
              Perfiles verificados y comunicación segura.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            ¿Cómo funciona?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Para Clientes */}
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-semibold mb-6" style={{ color: config.colors.primary }}>
                Para Clientes
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: config.colors.primary }}>1</div>
                  <p className="text-gray-600">Inicia sesión con tu cuenta de Google</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: config.colors.primary }}>2</div>
                  <p className="text-gray-600">Publica tu proyecto con detalles específicos</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: config.colors.primary }}>3</div>
                  <p className="text-gray-600">Revisa propuestas y perfiles de GitHub</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: config.colors.primary }}>4</div>
                  <p className="text-gray-600">Contrata al freelancer perfecto</p>
                </div>
              </div>
            </div>

            {/* Para Freelancers */}
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-semibold mb-6" style={{ color: config.colors.secondary }}>
                Para Freelancers
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: config.colors.secondary }}>1</div>
                  <p className="text-gray-600">Inicia sesión con tu cuenta de GitHub</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: config.colors.secondary }}>2</div>
                  <p className="text-gray-600">Tu perfil se crea automáticamente con tus repos</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: config.colors.secondary }}>3</div>
                  <p className="text-gray-600">Explora proyectos que coincidan contigo</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: config.colors.secondary }}>4</div>
                  <p className="text-gray-600">Envía propuestas y comienza a trabajar</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Listo para comenzar?
            </h2>
            <p className="text-gray-600 mb-6">
              Únete a nuestra comunidad de profesionales y encuentra tu próxima oportunidad.
            </p>
            <Link 
              href="/login"
              className="inline-block px-8 py-3 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              style={{ backgroundColor: config.colors.primary }}
            >
              Comenzar Ahora
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Plataforma Freelancer. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
