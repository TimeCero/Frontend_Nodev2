'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';

export default function FreelancersPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);

  const fetchFreelancers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/freelancers`); // Usa la variable de entorno
      const data = await response.json();
      
      setFreelancers((data.freelancers || []).map(f => {
        console.log('Freelancer data:', f); // Verifica los datos de cada freelancer
        return {
          id: f.id || `freelancer-${crypto.randomUUID()}`,
          full_name: f.full_name?.trim() || 'Nombre no disponible',
          bio: f.bio?.trim() || 'Sin biografía disponible',
          skills: Array.isArray(f.skills) ? f.skills : [],
          location: f.location?.trim() || 'Ubicación no especificada',
          hourly_rate: Number(f.hourly_rate) || 0,
          portfolio_url: f.portfolio_url?.trim() || '#'
        };
      }));
    } catch (error) {
      console.error('Error al obtener freelancers:', error);
      setFreelancers([]);
    }
    setLoading(false);
  };
  
  const fetchConfig = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/config`); // Usa la variable de entorno
      const data = await response.json();
      setConfig(data); // Guarda la configuración en el estado
    } catch (error) {
      console.error('Error al cargar la configuración:', error);
    }
  };

  useEffect(() => {
    fetchFreelancers();
    fetchConfig();
  }, []);

  return (
    <>
    {/* Renderiza el componente Navigation */}
    <Navigation />

    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Encuentra los <span className="text-blue-600">mejores</span> freelancers
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Conectamos tu proyecto con talento profesional independiente
          </p>
          
          {config && (
            <div className="mt-6 inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: config.colors?.primary || '#000'}}></span>
              <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: config.colors?.secondary || '#000'}}></span>
              Nuestros colores corporativos
            </div>
          )}
        </div>

        {/* Freelancers Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {freelancers.map((freelancer) => (
            <div key={freelancer.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
  {freelancer.full_name.charAt(0)}
</div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{freelancer.full_name}</h2>
                    <p className="text-blue-600">${freelancer.hourly_rate}/hora</p>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">{freelancer.bio}</p>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Habilidades</h3>
                  <div className="flex flex-wrap gap-2">
                    {freelancer.skills?.map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {freelancer.location}
                </div>
                
                <div className="flex justify-between items-center mt-6">
                  <a
                    href={freelancer.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
                  >
                    <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Portafolio
                  </a>
                  
                  <button
                    onClick={() => {
                      if (!user) {
                        router.push('/login');
                      } else {
                        alert(`Contactando al freelancer: ${freelancer.full_name}`);
                      }
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Contactar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}