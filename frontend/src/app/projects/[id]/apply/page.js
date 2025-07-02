'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navigation from '../../../components/Navigation';
import { supabase } from '../../../../lib/supabase';
import { useProjectApplications } from '../../../../hooks/useSupabase';

export default function ApplyToProjectPage() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState({ colors: { primary: '#4CAF50', secondary: '#2C5F7F' } });
  const { submitApplication } = useProjectApplications(params.id);
  
  const [formData, setFormData] = useState({
    proposal: '',
    proposedRate: '',
    estimatedDuration: '',
    coverLetter: '',
    attachments: []
  });
  
  const [errors, setErrors] = useState({});

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
        if (data.user.userType !== 'freelancer') {
          router.push('/dashboard');
          return;
        }
        setUser(data.user);
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
  }, [router, params.id]);

  // Efecto separado para cargar detalles del proyecto cuando el usuario esté disponible
  useEffect(() => {
    if (user) {
      fetchProjectDetails();
    }
  }, [user]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      
      // Obtener detalles del proyecto
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          user_profiles!projects_client_id_fkey(
            full_name,
            company_name,
            avatar_url
          )
        `)
        .eq('id', params.id)
        .single();

      if (projectError) {
        console.error('Error fetching project:', projectError);
        router.push('/projects');
        return;
      }

      if (projectData.status !== 'open') {
        router.push(`/projects/${params.id}`);
        return;
      }

      setProject(projectData);

      // Verificar si ya aplicó
      if (user?.id) {
        const { data: existingApplication } = await supabase
          .from('project_applications')
          .select('id')
          .eq('project_id', params.id)
          .eq('freelancer_id', user.id)
          .single();

        if (existingApplication) {
          router.push(`/projects/${params.id}`);
          return;
        }
      }

    } catch (error) {
      console.error('Error:', error);
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  };

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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      attachments: files
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.proposal.trim()) {
      newErrors.proposal = 'La propuesta es requerida';
    } else if (formData.proposal.trim().length < 50) {
      newErrors.proposal = 'La propuesta debe tener al menos 50 caracteres';
    }

    if (!formData.coverLetter.trim()) {
      newErrors.coverLetter = 'La carta de presentación es requerida';
    } else if (formData.coverLetter.trim().length < 100) {
      newErrors.coverLetter = 'La carta de presentación debe tener al menos 100 caracteres';
    }

    if (project?.project_type === 'hourly' && !formData.proposedRate) {
      newErrors.proposedRate = 'La tarifa por hora es requerida para proyectos por horas';
    } else if (formData.proposedRate && (isNaN(formData.proposedRate) || parseFloat(formData.proposedRate) <= 0)) {
      newErrors.proposedRate = 'Ingresa una tarifa válida';
    }

    if (!formData.estimatedDuration.trim()) {
      newErrors.estimatedDuration = 'El tiempo estimado es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        alert('Debes estar autenticado para aplicar a este proyecto.');
        router.push('/login');
        return;
      }

      // Verificar que el usuario sea freelancer
      if (user.userType !== 'freelancer') {
        alert('Solo los freelancers pueden aplicar a proyectos.');
        return;
      }

      // Crear la aplicación usando el backend API
      const applicationData = {
        project_id: params.id,
        proposal: formData.proposal.trim(),
        cover_letter: formData.coverLetter.trim(),
        estimated_duration: formData.estimatedDuration.trim()
      };

      if (formData.proposedRate) {
        applicationData.proposed_rate = parseFloat(formData.proposedRate);
      }

      console.log('Submitting application with data:', applicationData);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/applications`, {

        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(applicationData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al enviar la aplicación');
      }

      const result = await response.json();
      console.log('Application submitted successfully:', result);

      // Redirigir al proyecto con mensaje de éxito
      router.push(`/projects/${params.id}?applied=true`);

    } catch (error) {
      console.error('Error submitting application:', error);
      alert(`Error al enviar la aplicación: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Proyecto no encontrado</h1>
            <button
              onClick={() => router.push('/projects')}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Volver a proyectos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <button
              onClick={() => router.push(`/projects/${params.id}`)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Volver al proyecto
            </button>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario de Aplicación */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                  Aplicar al Proyecto
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Carta de Presentación */}
                  <div>
                    <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-2">
                      Carta de Presentación *
                    </label>
                    <textarea
                      id="coverLetter"
                      name="coverLetter"
                      rows={4}
                      value={formData.coverLetter}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.coverLetter ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Preséntate al cliente. Explica por qué eres la persona ideal para este proyecto..."
                    />
                    {errors.coverLetter && (
                      <p className="mt-1 text-sm text-red-600">{errors.coverLetter}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      Mínimo 100 caracteres. Actual: {formData.coverLetter.length}
                    </p>
                  </div>

                  {/* Propuesta Detallada */}
                  <div>
                    <label htmlFor="proposal" className="block text-sm font-medium text-gray-700 mb-2">
                      Propuesta Detallada *
                    </label>
                    <textarea
                      id="proposal"
                      name="proposal"
                      rows={6}
                      value={formData.proposal}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.proposal ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Describe detalladamente cómo planeas abordar este proyecto, qué metodología usarás, qué entregables proporcionarás..."
                    />
                    {errors.proposal && (
                      <p className="mt-1 text-sm text-red-600">{errors.proposal}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      Mínimo 50 caracteres. Actual: {formData.proposal.length}
                    </p>
                  </div>

                  {/* Tarifa Propuesta (solo para proyectos por horas) */}
                  {project.project_type === 'hourly' && (
                    <div>
                      <label htmlFor="proposedRate" className="block text-sm font-medium text-gray-700 mb-2">
                        Tarifa por Hora (USD) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                          type="number"
                          id="proposedRate"
                          name="proposedRate"
                          min="1"
                          step="0.01"
                          value={formData.proposedRate}
                          onChange={handleInputChange}
                          className={`w-full pl-8 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.proposedRate ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="25.00"
                        />
                      </div>
                      {errors.proposedRate && (
                        <p className="mt-1 text-sm text-red-600">{errors.proposedRate}</p>
                      )}
                      <p className="mt-1 text-sm text-gray-500">
                        Ingresa tu tarifa por hora en dólares estadounidenses
                      </p>
                    </div>
                  )}

                  {/* Tiempo Estimado */}
                  <div>
                    <label htmlFor="estimatedDuration" className="block text-sm font-medium text-gray-700 mb-2">
                      Tiempo Estimado de Entrega *
                    </label>
                    <input
                      type="text"
                      id="estimatedDuration"
                      name="estimatedDuration"
                      value={formData.estimatedDuration}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.estimatedDuration ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ej: 2 semanas, 1 mes, 15 días hábiles"
                    />
                    {errors.estimatedDuration && (
                      <p className="mt-1 text-sm text-red-600">{errors.estimatedDuration}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      Especifica cuánto tiempo necesitarías para completar el proyecto
                    </p>
                  </div>

                  {/* Archivos Adjuntos */}
                  <div>
                    <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-2">
                      Archivos Adjuntos (Opcional)
                    </label>
                    <input
                      type="file"
                      id="attachments"
                      name="attachments"
                      multiple
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Puedes adjuntar tu portafolio, ejemplos de trabajo o documentos relevantes (máx. 10MB por archivo)
                    </p>
                    {formData.attachments.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">Archivos seleccionados:</p>
                        <ul className="text-sm text-gray-500">
                          {Array.from(formData.attachments).map((file, index) => (
                            <li key={index}>• {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Botones */}
                  <div className="flex space-x-4 pt-6">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Enviando...' : 'Enviar Propuesta'}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/projects/${params.id}`)}
                      className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Sidebar - Resumen del Proyecto */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen del Proyecto</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{project.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-3">{project.description}</p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Presupuesto:</span>
                      <span className="font-medium text-green-600">
                        {formatBudget(project.budget_min, project.budget_max)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Tipo:</span>
                      <span className="font-medium">
                        {project.project_type === 'fixed' ? 'Precio Fijo' : 'Por Horas'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Categoría:</span>
                      <span className="font-medium">{project.category}</span>
                    </div>
                    
                    {project.deadline && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Fecha límite:</span>
                        <span className="font-medium text-orange-600">
                          {new Date(project.deadline).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {project.skills_required && project.skills_required.length > 0 && (
                    <div className="border-t pt-4">
                      <span className="text-sm text-gray-600 mb-2 block">Habilidades requeridas:</span>
                      <div className="flex flex-wrap gap-1">
                        {project.skills_required.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
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
                        <p className="font-medium text-sm">
                          {project.user_profiles?.company_name || project.user_profiles?.full_name || 'Cliente'}
                        </p>
                        <p className="text-xs text-gray-500">Cliente</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}