'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navigation from '../../../components/Navigation';

export default function ManageProjectPage() {
  const router = useRouter();
  const params = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchProject();
  }, []);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/projects/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar el proyecto');
      }

      const data = await response.json();
      setProject(data.project);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const updateProjectStatus = async (status) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/projects/${params.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado del proyecto');
      }

      await fetchProject();
      alert('Estado del proyecto actualizado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el estado del proyecto');
    } finally {
      setUpdating(false);
    }
  };

  const deleteProject = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) {
      return;
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/projects/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar el proyecto');
      }

      alert('Proyecto eliminado exitosamente');
      router.push('/projects/my');
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'Error al eliminar el proyecto');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'open': 'bg-green-100 text-green-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    
    const statusLabels = {
      'open': 'Abierto',
      'in_progress': 'En Progreso',
      'completed': 'Completado',
      'cancelled': 'Cancelado'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatBudget = (min, max, type) => {
    if (type === 'fixed') {
      return `$${min} - $${max}`;
    }
    return `$${min}/hora`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando proyecto...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-4">{error || 'Proyecto no encontrado'}</p>
            <button
              onClick={() => router.push('/projects/my')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Volver a Mis Proyectos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestionar Proyecto</h1>
              <p className="mt-2 text-gray-600">Administra el estado y configuración de tu proyecto</p>
            </div>
            <button
              onClick={() => router.push('/projects/my')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Volver
            </button>
          </div>
        </div>

        {/* Project Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{project.title}</h2>
              <p className="text-gray-600 mb-4">{project.description}</p>
            </div>
            {getStatusBadge(project.status)}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <span className="text-sm font-medium text-gray-500">Categoría</span>
              <p className="text-gray-900">{project.category}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Presupuesto</span>
              <p className="text-gray-900">{formatBudget(project.budget_min, project.budget_max, project.project_type)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Fecha de creación</span>
              <p className="text-gray-900">{formatDate(project.created_at)}</p>
            </div>
          </div>

          {project.deadline && (
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-500">Fecha límite</span>
              <p className="text-gray-900">{formatDate(project.deadline)}</p>
            </div>
          )}

          {project.skills_required && project.skills_required.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-500 block mb-2">Habilidades requeridas</span>
              <div className="flex flex-wrap gap-2">
                {project.skills_required.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Management Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Acciones de Gestión</h3>
          
          <div className="space-y-4">
            {/* Status Management */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">Cambiar Estado del Proyecto</h4>
              <div className="flex flex-wrap gap-3">
                {project.status !== 'completed' && (
                  <button
                    onClick={() => updateProjectStatus('completed')}
                    disabled={updating}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    {updating ? 'Actualizando...' : 'Marcar como Completado'}
                  </button>
                )}
                
                {project.status !== 'cancelled' && project.status !== 'completed' && (
                  <button
                    onClick={() => updateProjectStatus('cancelled')}
                    disabled={updating}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {updating ? 'Actualizando...' : 'Cancelar Proyecto'}
                  </button>
                )}
                
                {project.status !== 'open' && project.status !== 'in_progress' && (
                  <button
                    onClick={() => updateProjectStatus('open')}
                    disabled={updating}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updating ? 'Actualizando...' : 'Reabrir Proyecto'}
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">Acciones Rápidas</h4>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Ver Detalles
                </button>
                
                <button
                  onClick={() => router.push(`/projects/${project.id}/applications`)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Ver Aplicaciones
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div>
              <h4 className="text-md font-medium text-red-900 mb-3">Zona de Peligro</h4>
              <p className="text-sm text-gray-600 mb-3">
                Una vez que elimines este proyecto, no podrás recuperarlo. Por favor, ten cuidado.
              </p>
              {project.status !== 'in_progress' ? (
                <button
                  onClick={deleteProject}
                  disabled={updating}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  {updating ? 'Eliminando...' : 'Eliminar Proyecto'}
                </button>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No se puede eliminar un proyecto en progreso. Primero cancélalo o márcalo como completado.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}