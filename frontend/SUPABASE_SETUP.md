# Configuración de Supabase en el Frontend

## Instalación Completada

Se ha instalado y configurado Supabase en el frontend de la plataforma freelancer.

### Archivos Creados:

1. **`src/lib/supabase.js`** - Cliente de Supabase configurado
2. **`src/hooks/useSupabase.js`** - Hooks personalizados para usar Supabase
3. **`.env.local`** - Variables de entorno actualizadas

### Configuración de Variables de Entorno

Las siguientes variables están configuradas en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yxdkitxivnycjzbygpmu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Uso del Cliente Supabase

#### Importar el cliente:

```javascript
import { supabase } from '../lib/supabase'
```

#### Usar los hooks personalizados:

```javascript
import { useAuth, useUserProfile, useProjects } from '../hooks/useSupabase'

// En tu componente
const { user, loading } = useAuth()
const { profile, updateProfile } = useUserProfile(user?.id)
const { projects, refetch } = useProjects()
```

### Funcionalidades Disponibles

#### 1. Autenticación
- `useAuth()` - Hook para manejar el estado de autenticación
- `getCurrentUser()` - Función helper para obtener el usuario actual
- `signOut()` - Función helper para cerrar sesión

#### 2. Perfiles de Usuario
- `useUserProfile(userId)` - Hook para obtener y actualizar perfiles
- Incluye función `updateProfile()` para actualizaciones

#### 3. Proyectos
- `useProjects()` - Hook para obtener lista de proyectos
- Soporte para filtros (categoría, presupuesto)
- Incluye información del cliente

#### 4. Aplicaciones a Proyectos
- `useProjectApplications(projectId)` - Hook para manejar aplicaciones
- `submitApplication()` - Función para enviar aplicaciones

### Ejemplos de Uso

#### Obtener perfil del usuario:

```javascript
function ProfileComponent() {
  const { user } = useAuth()
  const { profile, loading, updateProfile } = useUserProfile(user?.id)

  if (loading) return <div>Cargando...</div>

  return (
    <div>
      <h1>{profile?.full_name}</h1>
      <p>{profile?.bio}</p>
      {/* Resto del componente */}
    </div>
  )
}
```

#### Listar proyectos:

```javascript
function ProjectsList() {
  const { projects, loading, refetch } = useProjects()

  if (loading) return <div>Cargando proyectos...</div>

  return (
    <div>
      {projects.map(project => (
        <div key={project.id}>
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <p>Presupuesto: ${project.budget}</p>
        </div>
      ))}
    </div>
  )
}
```

#### Aplicar a un proyecto:

```javascript
function ApplyToProject({ projectId }) {
  const { submitApplication } = useProjectApplications(projectId)
  const { user } = useAuth()

  const handleApply = async () => {
    const success = await submitApplication({
      project_id: projectId,
      freelancer_id: user.id,
      proposal: 'Mi propuesta...',
      proposed_rate: 50
    })

    if (success) {
      alert('Aplicación enviada exitosamente')
    }
  }

  return (
    <button onClick={handleApply}>
      Aplicar al Proyecto
    </button>
  )
}
```

### Operaciones Directas con Supabase

También puedes usar el cliente directamente para operaciones más específicas:

```javascript
import { supabase } from '../lib/supabase'

// Insertar datos
const { data, error } = await supabase
  .from('projects')
  .insert([{ title: 'Nuevo Proyecto', description: '...' }])

// Actualizar datos
const { data, error } = await supabase
  .from('user_profiles')
  .update({ bio: 'Nueva biografía' })
  .eq('user_id', userId)

// Eliminar datos
const { error } = await supabase
  .from('projects')
  .delete()
  .eq('id', projectId)

// Consultas complejas
const { data, error } = await supabase
  .from('projects')
  .select(`
    *,
    user_profiles!projects_client_id_fkey(
      full_name,
      company_name
    ),
    project_applications(
      count
    )
  `)
  .eq('status', 'open')
  .order('created_at', { ascending: false })
```

### Próximos Pasos

1. **Migrar componentes existentes** para usar los hooks de Supabase
2. **Implementar autenticación** usando Supabase Auth
3. **Optimizar consultas** usando las funcionalidades avanzadas de Supabase
4. **Implementar tiempo real** usando Supabase Realtime para notificaciones

### Notas Importantes

- Las variables de entorno con prefijo `NEXT_PUBLIC_` son accesibles en el cliente
- El cliente está configurado para usar las credenciales del archivo `.env.local`
- Los hooks incluyen manejo de errores y estados de carga
- Se recomienda usar los hooks personalizados para operaciones comunes