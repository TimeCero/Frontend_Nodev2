'use client';
import { useRouter } from 'next/navigation';
import Navigation from '../components/Navigation';

export default function HowItWorksPage() {
  const router = useRouter();

  const handleRegisterRedirect = () => {
    router.push('/register');
  };

  const steps = [
    {
      title: "1. Regístrate",
      description: "Crea tu cuenta en minutos como cliente o freelancer",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      title: "2. Completa tu perfil",
      description: "Añade tus habilidades, experiencia y portfolio (para freelancers) o detalles de tu empresa (para clientes)",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: "3. Encuentra coincidencias",
      description: "Nuestro sistema te recomienda los mejores freelancers o proyectos según tus necesidades",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      title: "4. Colabora con seguridad",
      description: "Usa nuestra plataforma para comunicarte, compartir archivos y realizar pagos seguros",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    }
  ];

  const stats = [
    { value: "10,000+", label: "Freelancers activos" },
    { value: "5,000+", label: "Proyectos completados" },
    { value: "95%", label: "Tasa de satisfacción" },
    { value: "24h", label: "Soporte rápido" }
  ];

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              <span className="block">Cómo Funciona</span>
              <span className="block text-blue-600 mt-2">Nuestra Plataforma</span>
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-xl text-gray-600">
              Conectamos talento con oportunidades de manera simple, segura y efectiva
            </p>
          </div>

          {/* Steps Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">El proceso en 4 simples pasos</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-center w-16 h-16 mb-4 mx-auto rounded-full bg-blue-100 text-blue-600">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-center text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-center">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Client vs Freelancer Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">¿Cómo puedes participar?</h2>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Client Card */}
              <div className="relative bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 opacity-10"></div>
                <div className="relative p-8">
                  <div className="flex items-center mb-6">
                    <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="ml-4 text-2xl font-bold text-gray-900">Para Clientes</h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Encuentra al profesional perfecto para llevar tus proyectos al siguiente nivel con nuestra amplia red de talento verificada.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-3 text-gray-700">Publica proyectos con descripciones detalladas</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-3 text-gray-700">Recibe propuestas de freelancers calificados</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-3 text-gray-700">Compara perfiles, portafolios y reseñas</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-3 text-gray-700">Paga de forma segura solo cuando estés satisfecho</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Freelancer Card */}
              <div className="relative bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-500 opacity-10"></div>
                <div className="relative p-8">
                  <div className="flex items-center mb-6">
                    <div className="flex-shrink-0 p-3 bg-purple-100 rounded-lg">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="ml-4 text-2xl font-bold text-gray-900">Para Freelancers</h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Accede a proyectos emocionantes, construye tu reputación y gana dinero haciendo lo que amas, con total flexibilidad.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-3 text-gray-700">Explora miles de proyectos en diversas categorías</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-3 text-gray-700">Postula con propuestas personalizadas</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-3 text-gray-700">Negocia términos y tarifas directamente</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="flex-shrink-0 h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="ml-3 text-gray-700">Recibe pagos puntuales y seguros</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mb-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-xl p-8 text-white">
            <h2 className="text-3xl font-bold text-center mb-12">Nuestro impacto en números</h2>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-extrabold mb-2">{stat.value}</div>
                  <div className="text-lg font-medium opacity-90">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Lo que dicen nuestros usuarios</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">JM</div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold">Juan Martínez</h4>
                    <p className="text-gray-500">Diseñador UI/UX</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  &quot;Encontre proyectos desafiantes que me permitieron crecer profesionalmente mientras trabajo desde cualquier lugar. La plataforma es intuitiva y los pagos siempre son puntuales.&quot;
                </p>
                <div className="mt-4 flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">SR</div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold">Sofía Ramírez</h4>
                    <p className="text-gray-500">CEO, TechStart</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  &quot;Como startup, encontrar talento calificado era un desafío. Esta plataforma nos conectó con freelancers excepcionales que se convirtieron en parte esencial de nuestro equipo remoto.&quot;
                </p>
                <div className="mt-4 flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">¿Listo para comenzar?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Únete a nuestra comunidad de talento y oportunidades. Regístrate hoy y descubre un mundo de posibilidades.
            </p>
            <button
              onClick={handleRegisterRedirect}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              Regístrate Gratis
            </button>
            <p className="mt-4 text-gray-500">Sin cargos ocultos - Cancelas cuando quieras</p>
          </div>
        </div>
      </div>
    </>
  );
}