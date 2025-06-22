'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../../components/Navigation';

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState('');
  const [config, setConfig] = useState({ colors: { primary: '#4CAF50', secondary: '#2C5F7F' } });
  const [formData, setFormData] = useState({
    bio: '',
    location: '',
    skills: [],
    hourly_rate: '',
    portfolio_url: '',
    linkedin_url: '',
    website_url: '',
    company_name: '',
    availability_status: 'available'
  });
  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUserType = localStorage.getItem('userType');
    
    if (!token) {
      router.push('/login');
      return;
    }

    setUserType(storedUserType);

    // Obtener configuración
    fetch('http://localhost:3001/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error('Error loading config:', err));

    // Obtener información del usuario
    fetch('http://localhost:3001/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.user) {
        setUser(data.user);
      }
    })
    .catch(err => console.error('Error getting user info:', err));

    // Obtener perfil actual
    fetch('http://localhost:3001/api/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.profile) {
        setFormData({
          bio: data.profile.bio || '',
          location: data.profile.location || '',
          skills: data.profile.skills || [],
          hourly_rate: data.profile.hourly_rate || '',
          portfolio_url: data.profile.portfolio_url || '',
          linkedin_url: data.profile.linkedin_url || '',
          website_url: data.profile.website_url || '',
          company_name: data.profile.company_name || '',
          availability_status: data.profile.availability_status || 'available'
        });
      }
      setLoading(false);
    })
    .catch(err => {
      console.error('Error getting profile:', err);
      setLoading(false);
    });
  }, [router]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.bio.trim()) {
      newErrors.bio = 'La biografía es requerida';
    }

    if (userType === 'freelancer' && formData.hourly_rate && isNaN(formData.hourly_rate)) {
      newErrors.hourly_rate = 'La tarifa debe ser un número válido';
    }

    // Validar URLs
    const urlFields = ['portfolio_url', 'linkedin_url', 'website_url'];
    urlFields.forEach(field => {
      if (formData[field] && !isValidUrl(formData[field])) {
        newErrors[field] = 'Debe ser una URL válida';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
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
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);

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
          user_type: userType, // Incluir el tipo de usuario
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null
        })
      });

      if (response.ok) {
        localStorage.setItem('profileCompleted', 'true');
        alert('Perfil actualizado exitosamente');
        router.push('/profile');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el perfil. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Editar Perfil</h1>
            <Link
              href="/profile"
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
            >
              Volver al Perfil
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.bio ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={userType === 'freelancer' 
                  ? 'Describe tu experiencia, habilidades y lo que te hace único como freelancer...'
                  : 'Describe tu empresa, el tipo de proyectos que manejas y lo que buscas en un freelancer...'
                }
              />
              {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio}</p>}
            </div>

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

            {/* Campos específicos para freelancers */}
            {userType === 'freelancer' && (
              <>
                {/* Habilidades */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Habilidades
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Agregar habilidad (ej: React, Node.js, Python)"
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="px-4 py-2 text-white font-medium rounded-md transition-colors"
                      style={{ backgroundColor: config.colors.primary }}
                    >
                      Agregar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
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
                    Tarifa por Hora (USD)
                  </label>
                  <input
                    type="number"
                    name="hourly_rate"
                    value={formData.hourly_rate}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.hourly_rate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="25.00"
                  />
                  {errors.hourly_rate && <p className="mt-1 text-sm text-red-600">{errors.hourly_rate}</p>}
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
                    <option value="unavailable">No disponible</option>
                  </select>
                </div>
              </>
            )}

            {/* Campos específicos para clientes */}
            {userType === 'client' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre de tu empresa o organización"
                />
              </div>
            )}

            {/* URLs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL del Portafolio
                </label>
                <input
                  type="url"
                  name="portfolio_url"
                  value={formData.portfolio_url}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.portfolio_url ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://miportafolio.com"
                />
                {errors.portfolio_url && <p className="mt-1 text-sm text-red-600">{errors.portfolio_url}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn
                </label>
                <input
                  type="url"
                  name="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.linkedin_url ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://linkedin.com/in/usuario"
                />
                {errors.linkedin_url && <p className="mt-1 text-sm text-red-600">{errors.linkedin_url}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sitio Web
              </label>
              <input
                type="url"
                name="website_url"
                value={formData.website_url}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.website_url ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://misitioweb.com"
              />
              {errors.website_url && <p className="mt-1 text-sm text-red-600">{errors.website_url}</p>}
            </div>

            {/* Botones */}
            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => router.push('/profile')}
                className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: config.colors.primary }}
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}