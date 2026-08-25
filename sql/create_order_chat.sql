-- ==============================================================================
-- CHAT DO PEDIDO (order_messages) & SUPORTE A CANCELAMENTO
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/eiqapzziyejicnhfsjdy/sql/new
-- ==============================================================================

-- 1. Criar tabela de mensagens do pedido
CREATE TABLE IF NOT EXISTS public.order_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'store', 'system')),
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar RLS e criar políticas
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select order_messages" ON public.order_messages;
DROP POLICY IF EXISTS "Public insert order_messages" ON public.order_messages;

CREATE POLICY "Public select order_messages" 
ON public.order_messages 
FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Public insert order_messages" 
ON public.order_messages 
FOR INSERT 
TO public 
WITH CHECK (true);

-- 3. Habilitar Realtime para order_messages e orders se disponível
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

NOTIFY pgrst, 'reload schema';
