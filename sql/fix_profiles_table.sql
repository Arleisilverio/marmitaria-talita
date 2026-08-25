-- ==============================================================================
-- CORREÇÃO DA TABELA PROFILES (Adicionar colunas full_name, phone, address, avatar_url)
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/eiqapzziyejicnhfsjdy/sql/new
-- ==============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Políticas RLS para Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "User manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "User insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "User update own profile" ON public.profiles;

CREATE POLICY "Public read profiles" 
ON public.profiles 
FOR SELECT 
TO public 
USING (true);

CREATE POLICY "User insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

CREATE POLICY "User update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

NOTIFY pgrst, 'reload schema';
