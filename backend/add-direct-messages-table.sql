-- Crear tabla para mensajes directos entre usuarios
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para mensajes directos
-- Los usuarios pueden ver mensajes donde son remitente o destinatario
CREATE POLICY "Users can view their direct messages" ON public.direct_messages
  FOR SELECT
  USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );

-- Los usuarios pueden insertar mensajes donde son el remitente
CREATE POLICY "Users can send direct messages" ON public.direct_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
  );

-- Los usuarios pueden actualizar mensajes donde son el destinatario (para marcar como leído)
CREATE POLICY "Users can mark messages as read" ON public.direct_messages
  FOR UPDATE
  USING (
    recipient_id = auth.uid()
  )
  WITH CHECK (
    recipient_id = auth.uid()
  );

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient_id ON public.direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON public.direct_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON public.direct_messages(sender_id, recipient_id, created_at);

-- Función para obtener conversaciones de un usuario
CREATE OR REPLACE FUNCTION get_user_conversations(user_id UUID)
RETURNS TABLE (
  other_user_id UUID,
  other_user_name TEXT,
  other_user_avatar TEXT,
  last_message_content TEXT,
  last_message_date TIMESTAMP WITH TIME ZONE,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH conversation_messages AS (
    SELECT 
      CASE 
        WHEN dm.sender_id = user_id THEN dm.recipient_id
        ELSE dm.sender_id
      END as other_user,
      dm.content,
      dm.created_at,
      dm.read_at,
      ROW_NUMBER() OVER (
        PARTITION BY 
          CASE 
            WHEN dm.sender_id = user_id THEN dm.recipient_id
            ELSE dm.sender_id
          END 
        ORDER BY dm.created_at DESC
      ) as rn
    FROM direct_messages dm
    WHERE dm.sender_id = user_id OR dm.recipient_id = user_id
  ),
  unread_counts AS (
    SELECT 
      dm.sender_id as other_user,
      COUNT(*) as unread_count
    FROM direct_messages dm
    WHERE dm.recipient_id = user_id AND dm.read_at IS NULL
    GROUP BY dm.sender_id
  )
  SELECT 
    cm.other_user,
    up.full_name,
    up.avatar_url,
    cm.content,
    cm.created_at,
    COALESCE(uc.unread_count, 0)
  FROM conversation_messages cm
  JOIN user_profiles up ON up.user_id = cm.other_user
  LEFT JOIN unread_counts uc ON uc.other_user = cm.other_user
  WHERE cm.rn = 1
  ORDER BY cm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para marcar mensajes como leídos
CREATE OR REPLACE FUNCTION mark_messages_as_read(sender_user_id UUID, recipient_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE direct_messages 
  SET read_at = NOW()
  WHERE sender_id = sender_user_id 
    AND recipient_id = recipient_user_id 
    AND read_at IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;