'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../components/Navigation';
import { supabase } from '../../lib/supabase';

export default function ProjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ colors: { primary: '#4CAF50', secondary: '#2C5F7F' } });
  const [filters, setFilters] = useState({
    category: '',
    budget_min: '',
    budget_max: '',
    search: '',
    project_type: ''
  });
  const [sortBy, setSortBy] = useState('created_at');

  const categories = [
    'Desarrollo Web',
    'Desarrollo Móvil',
    'Diseño Gráfico',
    'Diseño UI/UX',
    'Marketing Digital',
    'Redacción y Contenido',
    'Traducción',
    'Consultoría',
    'Fotografía',
    'Video y Animación',
    'Música y Audio',
    'Datos y Análisis',
    'Administración',
    'Soporte Técnico',
    'Otros'
  ];

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user, filters, sortBy]);

  const checkUser = async () => {
    try {
      // Primero verificar si hay un token JWT del backend
      const authToken = localStorage.getItem('authToken');
      const storedUserType = localStorage.getItem('userType');
      
      if (authToken && storedUserType) {
        // Verificar el token con el backend
        try {
          const response = await fetch('http://localhost:3001/auth/verify-token', {
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
                full_name: result.user.full_name
              });
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
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/login');
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);

      // Obtener configuración
      fetch('http://localhost:3001/config')
        .then(res => res.json())
        .then(data => setConfig(data))
        .catch(err => console.error('Error loading config:', err));

      await fetchProjects();
    } catch (error) {
      console.error('Error loading projects:', error);
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      
      let query = supabase
        .from('projects')
        .select(`
          *,
          user_profiles!projects_client_id_fkey(
            full_name,
            company_name,
            avatar_url,
            location
          )
        `)
        .eq('status', 'open');

      // Aplicar filtros
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.project_type) {
        query = query.eq('project_type', filters.project_type);
      }
      
      if (filters.budget_min) {
        query = query.gte('budget_min', parseFloat(filters.budget_min));
      }
      
      if (filters.budget_max) {
        query = query.lte('budget_max', parseFloat(filters.budget_max));
      }
      
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Aplicar ordenamiento
      const ascending = sortBy === 'budget_min' ? true : false;
      query = query.order(sortBy, { ascending });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching projects:', error);
        return;
      }

      setProjects(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [filters, sortBy, user]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      budget_min: '',
      budget_max: '',
      search: '',
      project_type: ''
    });
  };

  const formatBudget = (min, max) => {
    if (min && max) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    } else if (min) {
      return `Desde $${min.toLocaleString()}`;
    } else if (max) {
      return `Hasta $${max.toLocaleString()}`;
    }
    return 'Presupuesto por negociar';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Hace 1 día';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  if (loading && !user) {
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
            <h1 className="text-3xl font-bold text-gray-900">Explorar Proyectos</h1>
            <p className="mt-2 text-gray-600">
              Encuentra proyectos que se ajusten a tus habilidades y experiencia
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar
                    </label>
                    <input
                      type="text"
                      name="search"
                      value={filters.search}
                      onChange={handleFilterChange}
                      placeholder="Palabras clave..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Categoría */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría
                    </label>
                    <select
                      name="category"
                      value={filters.category}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todas las categorías</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tipo de Proyecto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Proyecto
                    </label>
                    <select
                      name="project_type"
                      value={filters.project_type}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos los tipos</option>
                      <option value="fixed">Precio Fijo</option>
                      <option value="hourly">Por Horas</option>
                    </select>
                  </div>

                  {/* Presupuesto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Presupuesto (USD)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        name="budget_min"
                        value={filters.budget_min}
                        onChange={handleFilterChange}
                        placeholder="Mín"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        name="budget_max"
                        value={filters.budget_max}
                        onChange={handleFilterChange}
                        placeholder="Máx"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Ordenar por */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ordenar por
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="created_at">Más recientes</option>
                      <option value="budget_min">Presupuesto (menor a mayor)</option>
                      <option value="deadline">Fecha límite</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Proyectos */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : projects.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron proyectos</h3>
                  <p className="text-gray-600">Intenta ajustar tus filtros de búsqueda</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {projects.map((project) => (
                    <div key={project.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {project.title}
                            </h3>
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-3">
                                {project.category}
                              </span>
                              <span className="mr-3">📅 {formatDate(project.created_at)}</span>
                              {project.deadline && (
                                <span className="mr-3">⏰ Vence: {new Date(project.deadline).toLocaleDateString('es-ES')}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-green-600">
                              {formatBudget(project.budget_min, project.budget_max)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {project.project_type === 'fixed' ? 'Precio Fijo' : 'Por Horas'}
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-700 mb-4 line-clamp-3">
                          {project.description}
                        </p>

                        {/* Habilidades */}
                        {project.skills_required && project.skills_required.length > 0 && (
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                              {project.skills_required.slice(0, 5).map((skill, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {skill}
                                </span>
                              ))}
                              {project.skills_required.length > 5 && (
                                <span className="text-sm text-gray-600">
                                  +{project.skills_required.length - 5} más
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Cliente */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                              {project.user_profiles?.avatar_url ? (
                                <img
                                  src={project.user_profiles.avatar_url}
                                  alt="Cliente"
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <span className="text-sm font-medium text-gray-600">
                                  {project.user_profiles?.full_name?.charAt(0) || 'C'}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {project.user_profiles?.company_name || project.user_profiles?.full_name || 'Cliente'}
                              </div>
                              {project.user_profiles?.location && (
                                <div className="text-sm text-gray-600">
                                  📍 {project.user_profiles.location}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex space-x-3">
                            <button
                              onClick={() => router.push(`/projects/${project.id}`)}
                              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              Ver Detalles
                            </button>
                            {user?.userType === 'freelancer' && (
                              <button
                                onClick={() => router.push(`/projects/${project.id}/apply`)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                Aplicar
                              </button>
                            )}
                          </div>
                        </div>
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