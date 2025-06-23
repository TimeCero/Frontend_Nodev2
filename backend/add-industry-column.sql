-- Agregar columna de industria a la tabla user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS industry TEXT;

-- Crear índice para mejorar el rendimiento de búsquedas por industria
CREATE INDEX IF NOT EXISTS idx_user_profiles_industry ON public.user_profiles(industry);

-- Comentario sobre la columna
COMMENT ON COLUMN public.user_profiles.industry IS 'Industria o sector de la empresa del cliente';