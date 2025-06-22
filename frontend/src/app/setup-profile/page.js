'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../components/Navigation';

export default function SetupProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
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
        // Pre-llenar el nombre si está disponible
        if (data.user.full_name) {
          setFormData(prev => ({ ...prev, full_name: data.user.full_name }));
        }
      }
      setLoading(false);
    })
    .catch(err => {
      console.error('Error getting user info:', err);
      setLoading(false);
    });
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error si existe
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSkillAdd = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const handleSkillRemove = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'El nombre completo es requerido';
    }

    if (!formData.bio.trim()) {
      newErrors.bio = 'La biografía es requerida';
    }

    if (userType === 'freelancer' && formData.skills.length === 0) {
      newErrors.skills = 'Debes agregar al menos una habilidad';
    }

    if (userType === 'freelancer' && formData.hourly_rate && isNaN(formData.hourly_rate)) {
      newErrors.hourly_rate = 'La tarifa debe ser un número válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
          user_type: userType,
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null
        })
      });

      if (response.ok) {
        localStorage.setItem('profileCompleted', 'true');
        alert('¡Perfil configurado exitosamente!');
        // Redirigir al dashboard correspondiente
        if (userType === 'freelancer') {
          router.push('/dashboard/freelancer');
        } else {
          router.push('/dashboard/client');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error al configurar el perfil');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el perfil. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('profileCompleted', 'true');
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
              ¡Bienvenido! Configura tu perfil
            </h1>
            <p className="text-gray-600">
              {userType === 'freelancer' 
                ? 'Configura tu perfil profesional para empezar a recibir proyectos'
                : 'Configura tu perfil de empresa para encontrar los mejores freelancers'
              }
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Puedes omitir este paso y completarlo más tarde
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.full_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Tu nombre completo"
              />
              {errors.full_name && <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>}
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.bio ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={userType === 'freelancer' 
                  ? 'Describe brevemente tu experiencia y especialidades...'
                  : 'Describe tu empresa y el tipo de proyectos que manejas...'
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
                    Habilidades principales *
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSkillAdd())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: JavaScript, React, Node.js"
                    />
                    <button
                      type="button"
                      onClick={handleSkillAdd}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          onClick={() => handleSkillRemove(skill)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  {errors.skills && <p className="mt-1 text-sm text-red-600">{errors.skills}</p>}
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
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.hourly_rate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="25"
                    min="1"
                  />
                  {errors.hourly_rate && <p className="mt-1 text-sm text-red-600">{errors.hourly_rate}</p>}
                </div>
              </>
            )}

            {/* Campos específicos para clientes */}
            {userType === 'client' && (
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
                  placeholder="Nombre de tu empresa"
                />
              </div>
            )}

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Configurar perfil'}
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
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