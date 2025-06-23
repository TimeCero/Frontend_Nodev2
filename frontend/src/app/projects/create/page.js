'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { supabase } from '../../../lib/supabase';

export default function CreateProjectPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({ colors: { primary: '#4CAF50', secondary: '#2C5F7F' } });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    skills_required: [],
    budget_min: '',
    budget_max: '',
    project_type: 'fixed',
    deadline: '',
    attachments: []
  });
  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState({});

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
    const token = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');

    if (!token || userType !== 'client') {
      router.push('/login');
      return;
    }

    // Obtener configuración
    fetch('http://localhost:3001/config')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error('Error loading config:', err));

    // Verificar autenticación
    fetch('http://localhost:3001/auth/verify-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token })
    })
    .then(res => res.json())
    .then(data => {
      if (data.valid && data.user.userType === 'client') {
        setUser(data.user);
      } else {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
        router.push('/login');
      }
      setLoading(false);
    })
    .catch(err => {
      console.error('Error:', err);
      router.push('/login');
    });
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills_required.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills_required: [...prev.skills_required, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills_required: prev.skills_required.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es obligatorio';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    }

    if (!formData.category) {
      newErrors.category = 'La categoría es obligatoria';
    }

    if (formData.skills_required.length === 0) {
      newErrors.skills_required = 'Agrega al menos una habilidad requerida';
    }

    if (formData.project_type === 'fixed') {
      if (!formData.budget_min || parseFloat(formData.budget_min) <= 0) {
        newErrors.budget_min = 'El presupuesto mínimo es obligatorio';
      }
      if (!formData.budget_max || parseFloat(formData.budget_max) <= 0) {
        newErrors.budget_max = 'El presupuesto máximo es obligatorio';
      }
      if (formData.budget_min && formData.budget_max && parseFloat(formData.budget_min) > parseFloat(formData.budget_max)) {
        newErrors.budget_max = 'El presupuesto máximo debe ser mayor al mínimo';
      }
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
      // Preparar datos del proyecto
      const projectData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        skills_required: formData.skills_required,
        project_type: formData.project_type,
        status: 'open'
      };

      // Agregar presupuesto si es proyecto de precio fijo
      if (formData.project_type === 'fixed') {
        projectData.budget_min = parseFloat(formData.budget_min);
        projectData.budget_max = parseFloat(formData.budget_max);
      }

      // Agregar fecha límite si se especificó
      if (formData.deadline) {
        projectData.deadline = formData.deadline;
      }

      // Verificar que el usuario local esté autenticado
      if (!user || user.userType !== 'client') {
        alert('Debes estar autenticado como cliente para crear un proyecto.');
        router.push('/login');
        return;
      }

      // Nota: Como estamos usando autenticación local en lugar de Supabase Auth,
      // y las políticas RLS requieren auth.uid(), crearemos el proyecto a través del backend
      // que tiene privilegios de servicio para bypasear RLS
      
      console.log('Creando proyecto para usuario:', user.id);

      // Crear proyecto a través del backend API
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3001/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...projectData,
          client_id: user.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('Error creating project:', errorData);
        alert(`Error al crear el proyecto: ${errorData.message || 'Error del servidor'}`);
        return;
      }

      const data = await response.json();

      console.log('Proyecto creado exitosamente:', data);
      alert('¡Proyecto publicado exitosamente!');
      router.push('/dashboard/client');

    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear el proyecto. Por favor, intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Publicar Nuevo Proyecto</h1>
            <p className="mt-2 text-gray-600">
              Completa los detalles de tu proyecto para encontrar el freelancer perfecto
            </p>
          </div>

          {/* Formulario */}
          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              {/* Título del Proyecto */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Proyecto *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Desarrollo de sitio web para restaurante"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              {/* Descripción Detallada */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción Detallada *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={6}
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe el alcance del trabajo, requerimientos, expectativas y cualquier detalle importante..."
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>

              {/* Categoría */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
              </div>

              {/* Habilidades Requeridas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Habilidades Requeridas *
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: React, Node.js, Diseño UI..."
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills_required.map((skill, index) => (
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
                {errors.skills_required && <p className="mt-1 text-sm text-red-600">{errors.skills_required}</p>}
              </div>

              {/* Tipo de Proyecto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Proyecto
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="project_type"
                      value="fixed"
                      checked={formData.project_type === 'fixed'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">Precio Fijo</div>
                      <div className="text-sm text-gray-600">Pago único por el proyecto completo</div>
                    </div>
                  </label>
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="project_type"
                      value="hourly"
                      checked={formData.project_type === 'hourly'}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">Por Horas</div>
                      <div className="text-sm text-gray-600">Pago basado en horas trabajadas</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Presupuesto (solo para proyectos de precio fijo) */}
              {formData.project_type === 'fixed' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="budget_min" className="block text-sm font-medium text-gray-700 mb-2">
                      Presupuesto Mínimo (USD) *
                    </label>
                    <input
                      type="number"
                      id="budget_min"
                      name="budget_min"
                      min="0"
                      step="0.01"
                      value={formData.budget_min}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.budget_min ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="500"
                    />
                    {errors.budget_min && <p className="mt-1 text-sm text-red-600">{errors.budget_min}</p>}
                  </div>
                  <div>
                    <label htmlFor="budget_max" className="block text-sm font-medium text-gray-700 mb-2">
                      Presupuesto Máximo (USD) *
                    </label>
                    <input
                      type="number"
                      id="budget_max"
                      name="budget_max"
                      min="0"
                      step="0.01"
                      value={formData.budget_max}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.budget_max ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="1000"
                    />
                    {errors.budget_max && <p className="mt-1 text-sm text-red-600">{errors.budget_max}</p>}
                  </div>
                </div>
              )}

              {/* Fecha Límite */}
              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Límite (Opcional)
                </label>
                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Publicando...' : 'Publicar Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}