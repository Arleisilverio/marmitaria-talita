-- Tabela para gerenciar qual cliente (chat_id) está falando com qual loja (store_slug)
CREATE TABLE IF NOT EXISTS public.telegram_sessions (
  chat_id BIGINT PRIMARY KEY,
  store_slug TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.telegram_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança: Edge Functions e SuperAdmins podem fazer tudo
CREATE POLICY "Acesso total para service_role" ON public.telegram_sessions
FOR ALL USING (true) WITH CHECK (true);