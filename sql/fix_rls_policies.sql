-- Correção de RLS para a tabela store_settings
-- Aplicado em 2026-05-07

-- 1. Política para INSERT: Permite se o usuário for o Super Admin OU estiver listado em app_admins para este slug específico
DROP POLICY IF EXISTS "Allow store insertion" ON public.store_settings;
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

-- 2. Política para UPDATE: Mesma lógica do INSERT
DROP POLICY IF EXISTS "Allow store update" ON public.store_settings;
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

-- 3. Garantir que DELETE também seja coberto para o Super Admin
DROP POLICY IF EXISTS "Allow store delete for superadmin" ON public.store_settings;
CREATE POLICY "Allow store delete for superadmin"
ON public.store_settings
FOR DELETE
TO authenticated
USING (lower(auth.jwt() ->> 'email') = 'arleisilverio41@gmail.com');

-- 4. Acesso público de leitura
DROP POLICY IF EXISTS "Public read access" ON public.store_settings;
CREATE POLICY "Public read access"
ON public.store_settings
FOR SELECT
TO public
USING (true);
