-- SQL DEFINITIVO PARA CORREÇÃO DE RLS E ESTRUTURA - MARMITARIA TALITA
-- Copie e cole este script no SQL Editor do Supabase (Projeto: kigindzghkbkwgzljrdz)

-- 1. Garantir valor padrão 'active' para novos administradores
ALTER TABLE public.app_admins 
ALTER COLUMN status SET DEFAULT 'active';

-- 2. Atualizar administradores existentes que estejam sem status
UPDATE public.app_admins 
SET status = 'active' 
WHERE status IS NULL;

-- 3. Garantir que a coluna slug seja única para permitir UPSERT correto
-- Se já houver um índice, o comando abaixo pode falhar, mas o 'upsert' precisa desse índice.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'store_settings_store_slug_key') THEN
        ALTER TABLE public.store_settings ADD CONSTRAINT store_settings_store_slug_key UNIQUE (store_slug);
    END IF;
END $$;

-- 4. LIMPEZA E RECRIAÇÃO DE POLÍTICAS DE RLS (MAIS ROBUSTAS)

-- Desabilitar e reabilitar RLS para garantir estado limpo
ALTER TABLE public.store_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas para evitar duplicidade
DROP POLICY IF EXISTS "Allow store insertion" ON public.store_settings;
DROP POLICY IF EXISTS "Allow store update" ON public.store_settings;
DROP POLICY IF EXISTS "Allow store delete for superadmin" ON public.store_settings;
DROP POLICY IF EXISTS "Public read access" ON public.store_settings;
DROP POLICY IF EXISTS "StoreAdmin insert their own settings" ON public.store_settings;
DROP POLICY IF EXISTS "StoreAdmin update their own settings" ON public.store_settings;
DROP POLICY IF EXISTS "SuperAdmin can do everything" ON public.store_settings;

-- POLÍTICA 1: LEITURA PÚBLICA (Qualquer um pode ver o cardápio)
CREATE POLICY "Public read access"
ON public.store_settings
FOR SELECT
TO public
USING (true);

-- POLÍTICA 2: INSERÇÃO (Super Admin OU Admin da Loja Ativo)
CREATE POLICY "Allow store insertion"
ON public.store_settings
FOR INSERT
TO authenticated
WITH CHECK (
    (lower(auth.jwt() ->> 'email') = 'arleisilverio41@gmail.com')
    OR 
    EXISTS (
        SELECT 1 FROM public.app_admins aa 
        WHERE lower(aa.email) = lower(auth.jwt() ->> 'email')
        AND lower(aa.slug) = lower(store_settings.store_slug)
        AND aa.status = 'active'
    )
);

-- POLÍTICA 3: ATUALIZAÇÃO (Super Admin OU Admin da Loja Ativo)
CREATE POLICY "Allow store update"
ON public.store_settings
FOR UPDATE
TO authenticated
USING (
    (lower(auth.jwt() ->> 'email') = 'arleisilverio41@gmail.com')
    OR 
    EXISTS (
        SELECT 1 FROM public.app_admins aa 
        WHERE lower(aa.email) = lower(auth.jwt() ->> 'email')
        AND lower(aa.slug) = lower(store_settings.store_slug)
        AND aa.status = 'active'
    )
)
WITH CHECK (
    (lower(auth.jwt() ->> 'email') = 'arleisilverio41@gmail.com')
    OR 
    EXISTS (
        SELECT 1 FROM public.app_admins aa 
        WHERE lower(aa.email) = lower(auth.jwt() ->> 'email')
        AND lower(aa.slug) = lower(store_settings.store_slug)
        AND aa.status = 'active'
    )
);

-- POLÍTICA 4: EXCLUSÃO (Apenas Super Admin)
CREATE POLICY "Allow store delete for superadmin"
ON public.store_settings
FOR DELETE
TO authenticated
USING (lower(auth.jwt() ->> 'email') = 'arleisilverio41@gmail.com');

-- 5. REVISAR POLÍTICAS DA TABELA app_admins TAMBÉM
ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view their own record" ON public.app_admins;
CREATE POLICY "Admins can view their own record"
ON public.app_admins
FOR SELECT
TO authenticated
USING (
    (lower(auth.jwt() ->> 'email') = 'arleisilverio41@gmail.com')
    OR 
    (lower(email) = lower(auth.jwt() ->> 'email'))
);

DROP POLICY IF EXISTS "SuperAdmin full access" ON public.app_admins;
CREATE POLICY "SuperAdmin full access"
ON public.app_admins
FOR ALL
TO authenticated
USING (lower(auth.jwt() ->> 'email') = 'arleisilverio41@gmail.com');
