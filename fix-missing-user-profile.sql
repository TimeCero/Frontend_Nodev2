-- Script corregido para crear el registro faltante en user_profiles
-- No existe tabla 'freelancers' - los freelancers están en user_profiles con user_type='freelancer'

-- Verificar si el usuario específico ya existe en user_profiles
SELECT 
  user_id,
  user_type,
  full_name,
  bio,
  skills,
  location,
  hourly_rate
FROM public.user_profiles 
WHERE user_id = '7f5ad001-cc80-4914-b7b2-7fba5caa4b02';

-- Si el usuario no existe, necesitamos crearlo manualmente
-- Basándome en los datos que vimos en las pruebas:
INSERT INTO public.user_profiles (
  user_id,
  user_type,
  full_name,
  bio,
  skills,
  location,
  hourly_rate,
  portfolio_url,
  availability_status,
  created_at,
  updated_at
)
SELECT 
  '7f5ad001-cc80-4914-b7b2-7fba5caa4b02'::UUID as user_id,
  'freelancer' as user_type,
  'asdad' as full_name,
  'asd' as bio,
  ARRAY['123'] as skills,
  'arequipa' as location,
  1.00 as hourly_rate,
  'https://www.facebook.com/' as portfolio_url,
  'available' as availability_status,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE user_id = '7f5ad001-cc80-4914-b7b2-7fba5caa4b02'
);

-- Verificar que se insertó correctamente
SELECT 
  user_id,
  user_type,
  full_name,
  bio,
  skills,
  location,
  hourly_rate,
  portfolio_url
FROM public.user_profiles 
WHERE user_id = '7f5ad001-cc80-4914-b7b2-7fba5caa4b02';

-- Mostrar resumen de freelancers en user_profiles
SELECT 
  'Total freelancers en user_profiles:' as descripcion,
  COUNT(*) as cantidad
FROM public.user_profiles
WHERE user_type = 'freelancer';

-- Mostrar todos los freelancers disponibles
SELECT 
  user_id,
  full_name,
  location,
  hourly_rate
FROM public.user_profiles
WHERE user_type = 'freelancer'
ORDER BY created_at DESC;