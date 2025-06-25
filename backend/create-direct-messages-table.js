// Script para crear la tabla direct_messages en Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function createDirectMessagesTable() {
  console.log('🔧 Creando tabla direct_messages...');
  
  // Configurar cliente de Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables de entorno de Supabase no encontradas');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Configurada' : 'No encontrada');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Configurada' : 'No encontrada');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // SQL para crear la tabla direct_messages
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.direct_messages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        sender_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE NOT NULL,
        recipient_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE NOT NULL,
        content TEXT NOT NULL,
        read_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    console.log('📤 Ejecutando SQL para crear tabla...');
    const { data: createResult, error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });
    
    if (createError) {
      console.log('⚠️  Error al crear tabla (puede que ya exista):', createError.message);
    } else {
      console.log('✅ Tabla direct_messages creada exitosamente');
    }
    
    // Habilitar RLS
    const rlsSQL = `ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;`;
    
    console.log('🔒 Habilitando Row Level Security...');
    const { data: rlsResult, error: rlsError } = await supabase.rpc('exec_sql', {
      sql: rlsSQL
    });
    
    if (rlsError) {
      console.log('⚠️  Error al habilitar RLS:', rlsError.message);
    } else {
      console.log('✅ RLS habilitado');
    }
    
    // Crear políticas de seguridad
    const policiesSQL = `
      -- Política para ver mensajes
      CREATE POLICY IF NOT EXISTS "Users can view their direct messages" ON public.direct_messages
        FOR SELECT
        USING (
          sender_id = auth.uid() OR recipient_id = auth.uid()
        );
      
      -- Política para enviar mensajes
      CREATE POLICY IF NOT EXISTS "Users can send direct messages" ON public.direct_messages
        FOR INSERT
        WITH CHECK (
          sender_id = auth.uid()
        );
      
      -- Política para marcar como leído
      CREATE POLICY IF NOT EXISTS "Users can mark messages as read" ON public.direct_messages
        FOR UPDATE
        USING (
          recipient_id = auth.uid()
        )
        WITH CHECK (
          recipient_id = auth.uid()
        );
    `;
    
    console.log('🛡️  Creando políticas de seguridad...');
    const { data: policiesResult, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: policiesSQL
    });
    
    if (policiesError) {
      console.log('⚠️  Error al crear políticas:', policiesError.message);
    } else {
      console.log('✅ Políticas de seguridad creadas');
    }
    
    // Crear índices
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON public.direct_messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient_id ON public.direct_messages(recipient_id);
      CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON public.direct_messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON public.direct_messages(sender_id, recipient_id, created_at);
    `;
    
    console.log('📊 Creando índices...');
    const { data: indexesResult, error: indexesError } = await supabase.rpc('exec_sql', {
      sql: indexesSQL
    });
    
    if (indexesError) {
      console.log('⚠️  Error al crear índices:', indexesError.message);
    } else {
      console.log('✅ Índices creados');
    }
    
    // Verificar que la tabla existe
    console.log('🔍 Verificando que la tabla existe...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('direct_messages')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Error al verificar tabla:', tableError.message);
    } else {
      console.log('✅ Tabla direct_messages verificada y accesible');
    }
    
    console.log('\n🎉 Configuración de direct_messages completada');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar la función
createDirectMessagesTable().catch(console.error);