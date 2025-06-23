'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../components/Navigation';

export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({
    location: '',
    portfolio_url: '',
    linkedin_url: '',
    website_url: '',
    availability_status: 'available',
    industry: '',
    company_name: '',
    skills: [],
    hourly_rate: '',
    bio: ''
  });
  const [skillInput, setSkillInput] = useState('');

  // Función para cargar el perfil existente
  const loadExistingProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          // Cargar los datos existentes en el formulario
          setFormData({
            location: data.profile.location || '',
            portfolio_url: data.profile.portfolio_url || '',
            linkedin_url: data.profile.linkedin_url || '',
            website_url: data.profile.website_url || '',
            availability_status: data.profile.availability_status || 'available',
            industry: data.profile.industry || '',
            company_name: data.profile.company_name || '',
            skills: data.profile.skills || [],
            hourly_rate: data.profile.hourly_rate || '',
            bio: data.profile.bio || ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUserType = localStorage.getItem('userType');
    
    if (!token) {
      router.push('/login');
      return;
    }

    if (!storedUserType || (storedUserType !== 'client' && storedUserType !== 'freelancer')) {
      alert('Error: Tipo de usuario no válido. Por favor, inicia sesión nuevamente.');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userType');
      router.push('/login');
      return;
    }

    setUserType(storedUserType);
    
    // Cargar el perfil existente si existe
    loadExistingProfile().finally(() => {
      setLoading(false);
    });
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Validar que userType esté definido
    if (!userType) {
      alert('Error: Tipo de usuario no definido. Por favor, inicia sesión nuevamente.');
      setSaving(false);
      router.push('/login');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          user_type: userType
        })
      });

      if (response.ok) {
        // Marcar el perfil como completado
        localStorage.setItem('profileCompleted', 'true');
        alert('Perfil actualizado exitosamente');
        // Redirigir al dashboard correspondiente
        if (userType === 'freelancer') {
          router.push('/dashboard/freelancer');
        } else {
          router.push('/dashboard/client');
        }
      } else {
        alert('Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el perfil. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    // Marcar como completado aunque se omita (para no mostrar el banner nuevamente)
    localStorage.setItem('profileCompleted', 'true');
    // Redirigir al dashboard sin completar el perfil
    if (userType === 'freelancer') {
      router.push('/dashboard/freelancer');
    } else {
      router.push('/dashboard/client');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Completa tu perfil
            </h1>
            <p className="text-gray-600">
              {userType === 'freelancer' 
                ? 'Agrega información adicional para mejorar tu perfil profesional y obtener más proyectos'
                : 'Completa información adicional de tu empresa para encontrar mejores freelancers'
              }
            </p>
            <div className="mt-4 text-sm text-blue-600">
              💡 Completar tu perfil aumenta tus posibilidades de éxito en la plataforma
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ubicación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ciudad, País"
              />
            </div>

            {/* Biografía */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biografía *
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Cuéntanos sobre ti, tu experiencia y qué te hace único..."
              />
            </div>

            {/* Campos específicos para freelancers */}
            {userType === 'freelancer' && (
              <>
                {/* Portfolio URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL del Portfolio
                  </label>
                  <input
                    type="url"
                    name="portfolio_url"
                    value={formData.portfolio_url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://tu-portfolio.com"
                  />
                </div>

                {/* LinkedIn */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    name="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://linkedin.com/in/tu-perfil"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sitio Web Personal
                  </label>
                  <input
                    type="url"
                    name="website_url"
                    value={formData.website_url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://tu-sitio.com"
                  />
                </div>

                {/* Estado de disponibilidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado de Disponibilidad
                  </label>
                  <select
                    name="availability_status"
                    value={formData.availability_status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="available">Disponible</option>
                    <option value="busy">Ocupado</option>
                    <option value="not_available">No disponible</option>
                  </select>
                </div>
              </>
            )}

            {/* Campos específicos para clientes */}
            {userType === 'client' && (
              <>
                {/* Industria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industria
                  </label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Tecnología, Marketing, Diseño"
                  />
                </div>

                {/* Sitio web de la empresa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sitio Web de la Empresa
                  </label>
                  <input
                    type="url"
                    name="website_url"
                    value={formData.website_url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://tu-empresa.com"
                  />
                </div>
              </>
            )}

            {/* Campos específicos para Freelancers */}
            {userType === 'freelancer' && (
              <>
                {/* Habilidades */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Habilidades *
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: JavaScript, React, Node.js"
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Agregar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tarifa por hora */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarifa por hora (USD)
                  </label>
                  <input
                    type="number"
                    name="hourly_rate"
                    value={formData.hourly_rate}
                    onChange={handleInputChange}
                    min="1"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="25.00"
                  />
                </div>

              </>
            )}

            {/* Campos específicos para Clientes */}
            {userType === 'client' && (
              <>
                {/* Nombre de la empresa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la empresa
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tu Empresa S.A."
                  />
                </div>
              </>
            )}

            {/* Botones */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={saving || !formData.bio || (userType === 'freelancer' && formData.skills.length === 0)}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {saving ? 'Guardando...' : 'Completar Perfil'}
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
              >
                Omitir por ahora
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}