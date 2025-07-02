'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';

export default function MyProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchMyProjects();
  }, []);

  const fetchMyProjects = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/my`, {

        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar los proyectos');
      }

      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar los proyectos');
    } finally {
      setLoading(false);
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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
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

  const updateProjectStatus = async (projectId, status) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/${projectId}/status`, {

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

      // Recargar los proyectos
      await fetchMyProjects();
      alert('Estado del proyecto actualizado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el estado del proyecto');
    }
  };

  const deleteProject = async (projectId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este proyecto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects/${projectId}`, {

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

      // Recargar los proyectos
      await fetchMyProjects();
      alert('Proyecto eliminado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'Error al eliminar el proyecto');
    }
  };

  const getActionButtons = (project) => {
    const buttons = [];
    
    // Botón Ver detalles (siempre disponible)
    buttons.push(
      <button
        key="details"
        onClick={() => router.push(`/projects/${project.id}`)}
        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        Ver detalles
      </button>
    );

    // Botones de gestión según el estado
    if (project.status === 'open' || project.status === 'in_progress') {
      buttons.push(
        <button
          key="complete"
          onClick={() => updateProjectStatus(project.id, 'completed')}
          className="text-green-600 hover:text-green-800 text-sm font-medium"
        >
          Finalizar
        </button>
      );
      
      buttons.push(
        <button
          key="cancel"
          onClick={() => updateProjectStatus(project.id, 'cancelled')}
          className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
        >
          Cancelar
        </button>
      );
    }

    // Botón eliminar (solo para proyectos no en progreso)
    if (project.status !== 'in_progress') {
      buttons.push(
        <button
          key="delete"
          onClick={() => deleteProject(project.id)}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Eliminar
        </button>
      );
    }

    return buttons;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando proyectos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mis Proyectos</h1>
          <p className="mt-2 text-gray-600">Gestiona todos tus proyectos publicados</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes proyectos</h3>
            <p className="mt-1 text-sm text-gray-500">Comienza publicando tu primer proyecto.</p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/projects/create')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Publicar Proyecto
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {project.title}
                    </h3>
                    {getStatusBadge(project.status)}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {project.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium">Categoría:</span>
                      <span className="ml-2">{project.category}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium">Presupuesto:</span>
                      <span className="ml-2">{formatBudget(project.budget_min, project.budget_max, project.project_type)}</span>
                    </div>
                    
                    {project.deadline && (
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="font-medium">Fecha límite:</span>
                        <span className="ml-2">{formatDate(project.deadline)}</span>
                      </div>
                    )}
                  </div>
                  
                  {project.skills_required && project.skills_required.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {project.skills_required.slice(0, 3).map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                        {project.skills_required.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{project.skills_required.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      Creado: {formatDate(project.created_at)}
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {getActionButtons(project).map((button, index) => (
                        <span key={index}>{button}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}