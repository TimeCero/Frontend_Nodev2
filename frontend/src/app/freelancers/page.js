'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../components/Navigation';
import { supabase } from '../../lib/supabase';

export default function FreelancersPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ colors: { primary: '#4CAF50', secondary: '#2C5F7F' } });
  
  const [filters, setFilters] = useState({
    search: '',
    skills: '',
    location: '',
    hourlyRateMin: '',
    hourlyRateMax: '',
    availability: 'all',
    sortBy: 'newest'
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
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
      if (data.valid) {
        setUser(data.user);
        fetchFreelancers();
      } else {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
        router.push('/login');
      }
    })
    .catch(err => {
      console.error('Error:', err);
      router.push('/login');
    });
  }, [router]);

  const fetchFreelancers = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('user_profiles')
        .select('*')
        .eq('user_type', 'freelancer');

      // Aplicar filtros
      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,bio.ilike.%${filters.search}%`);
      }

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters.hourlyRateMin) {
        query = query.gte('hourly_rate', parseFloat(filters.hourlyRateMin));
      }

      if (filters.hourlyRateMax) {
        query = query.lte('hourly_rate', parseFloat(filters.hourlyRateMax));
      }

      if (filters.availability !== 'all') {
        query = query.eq('availability_status', filters.availability);
      }

      // Ordenar
      switch (filters.sortBy) {
        case 'rate_low':
          query = query.order('hourly_rate', { ascending: true });
          break;
        case 'rate_high':
          query = query.order('hourly_rate', { ascending: false });
          break;
        case 'name':
          query = query.order('full_name', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching freelancers:', error);
        return;
      }

      // Filtrar por habilidades si se especifica
      let filteredData = data || [];
      if (filters.skills) {
        const skillsArray = filters.skills.toLowerCase().split(',').map(s => s.trim());
        filteredData = filteredData.filter(freelancer => {
          if (!freelancer.skills) return false;
          const freelancerSkills = freelancer.skills.map(skill => skill.toLowerCase());
          return skillsArray.some(skill => 
            freelancerSkills.some(fSkill => fSkill.includes(skill))
          );
        });
      }

      setFreelancers(filteredData);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const timeoutId = setTimeout(() => {
        fetchFreelancers();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [filters, user]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      skills: '',
      location: '',
      hourlyRateMin: '',
      hourlyRateMax: '',
      availability: 'all',
      sortBy: 'newest'
    });
  };

  const getAvailabilityColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityText = (status) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'busy':
        return 'Ocupado';
      case 'unavailable':
        return 'No Disponible';
      default:
        return 'Sin especificar';
    }
  };

  if (loading && freelancers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Buscar Freelancers
            </h1>
            <p className="text-gray-600">
              Encuentra el talento perfecto para tu proyecto
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filtros */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Limpiar
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Búsqueda */}
                  <div>
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                      Buscar
                    </label>
                    <input
                      type="text"
                      id="search"
                      name="search"
                      value={filters.search}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nombre o descripción..."
                    />
                  </div>

                  {/* Habilidades */}
                  <div>
                    <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
                      Habilidades
                    </label>
                    <input
                      type="text"
                      id="skills"
                      name="skills"
                      value={filters.skills}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="React, Python, Diseño..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separa con comas
                    </p>
                  </div>

                  {/* Ubicación */}
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={filters.location}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ciudad, país..."
                    />
                  </div>

                  {/* Tarifa por Hora */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tarifa por Hora (USD)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        name="hourlyRateMin"
                        value={filters.hourlyRateMin}
                        onChange={handleFilterChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Mín"
                        min="0"
                      />
                      <input
                        type="number"
                        name="hourlyRateMax"
                        value={filters.hourlyRateMax}
                        onChange={handleFilterChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Máx"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Disponibilidad */}
                  <div>
                    <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-1">
                      Disponibilidad
                    </label>
                    <select
                      id="availability"
                      name="availability"
                      value={filters.availability}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Todos</option>
                      <option value="available">Disponible</option>
                      <option value="busy">Ocupado</option>
                      <option value="unavailable">No Disponible</option>
                    </select>
                  </div>

                  {/* Ordenar por */}
                  <div>
                    <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
                      Ordenar por
                    </label>
                    <select
                      id="sortBy"
                      name="sortBy"
                      value={filters.sortBy}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="newest">Más Recientes</option>
                      <option value="name">Nombre A-Z</option>
                      <option value="rate_low">Tarifa: Menor a Mayor</option>
                      <option value="rate_high">Tarifa: Mayor a Menor</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Freelancers */}
            <div className="lg:col-span-3">
              {/* Resultados Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {loading ? 'Buscando...' : `${freelancers.length} freelancers encontrados`}
                  </h2>
                </div>
              </div>

              {/* Lista */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : freelancers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No se encontraron freelancers
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Intenta ajustar tus filtros de búsqueda
                  </p>
                  <button
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Limpiar filtros
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {freelancers.map((freelancer) => (
                    <div key={freelancer.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          {/* Avatar */}
                          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                            {freelancer.avatar_url ? (
                              <img
                                src={freelancer.avatar_url}
                                alt={freelancer.full_name}
                                className="w-16 h-16 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-xl font-medium text-gray-600">
                                {freelancer.full_name?.charAt(0) || 'F'}
                              </span>
                            )}
                          </div>

                          {/* Información */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-xl font-semibold text-gray-900">
                                {freelancer.full_name || 'Freelancer'}
                              </h3>
                              <div className="flex items-center space-x-2">
                                {freelancer.availability_status && (
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    getAvailabilityColor(freelancer.availability_status)
                                  }`}>
                                    {getAvailabilityText(freelancer.availability_status)}
                                  </span>
                                )}
                                {freelancer.hourly_rate && (
                                  <span className="text-lg font-bold text-green-600">
                                    ${freelancer.hourly_rate}/hora
                                  </span>
                                )}
                              </div>
                            </div>

                            {freelancer.location && (
                              <p className="text-sm text-gray-600 mb-2">
                                📍 {freelancer.location}
                              </p>
                            )}

                            {freelancer.bio && (
                              <p className="text-gray-700 mb-3 line-clamp-2">
                                {freelancer.bio}
                              </p>
                            )}

                            {/* Habilidades */}
                            {freelancer.skills && freelancer.skills.length > 0 && (
                              <div className="mb-4">
                                <div className="flex flex-wrap gap-2">
                                  {freelancer.skills.slice(0, 6).map((skill, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                  {freelancer.skills.length > 6 && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                      +{freelancer.skills.length - 6} más
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Estadísticas */}
                            <div className="flex items-center space-x-6 text-sm text-gray-600">
                              <div className="flex items-center">
                                <span className="text-yellow-400 mr-1">⭐</span>
                                <span>0 reseñas</span>
                              </div>
                              <div>
                                <span>0 proyectos completados</span>
                              </div>
                              <div>
                                <span>Miembro desde {new Date(freelancer.created_at).getFullYear()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex space-x-3 mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => router.push(`/freelancers/${freelancer.id}`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Ver Perfil
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          💬 Contactar
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          💾 Guardar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}