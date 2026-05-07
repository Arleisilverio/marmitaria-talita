-- SQL PARA CORREÇÃO DE RLS NA TABELA DE PEDIDOS (ORDERS)
-- Permite que os lojistas vejam apenas os pedidos de sua própria loja

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Enable read access for all" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.orders;
DROP POLICY IF EXISTS "Lojistas podem ver seus próprios pedidos" ON public.orders;
DROP POLICY IF EXISTS "Lojistas podem atualizar seus próprios pedidos" ON public.orders;
DROP POLICY IF EXISTS "Clientes podem inserir pedidos" ON public.orders;
DROP POLICY IF EXISTS "SuperAdmin acesso total orders" ON public.orders;

-- 1. Clientes (público ou autenticado) podem inserir pedidos
CREATE POLICY "Clientes podem inserir pedidos"
ON public.orders
FOR INSERT
TO public, authenticated
WITH CHECK (true);

-- 2. Lojistas e Super Admin podem VER os pedidos
CREATE POLICY "Lojistas podem ver seus próprios pedidos"
ON public.orders
FOR SELECT
TO authenticated
USING (
    (lower(auth.jwt() ->> 'email') = 'arleisilverio41@gmail.com')
    OR 
    EXISTS (
        SELECT 1 FROM public.app_admins aa 
        WHERE lower(aa.email) = lower(auth.jwt() ->> 'email')
        AND lower(aa.slug) = lower(orders.store_slug)
        AND aa.status = 'active'
    )
);

-- 3. Lojistas e Super Admin podem ATUALIZAR os pedidos (mudar status)
CREATE POLICY "Lojistas podem atualizar seus próprios pedidos"
ON public.orders
FOR UPDATE
TO authenticated
USING (
    (lower(auth.jwt() ->> 'email') = 'arleisilverio41@gmail.com')
    OR 
    EXISTS (
        SELECT 1 FROM public.app_admins aa 
        WHERE lower(aa.email) = lower(auth.jwt() ->> 'email')
        AND lower(aa.slug) = lower(orders.store_slug)
        AND aa.status = 'active'
    )
)
WITH CHECK (
    (lower(auth.jwt() ->> 'email') = 'arleisilverio41@gmail.com')
    OR 
    EXISTS (
        SELECT 1 FROM public.app_admins aa 
        WHERE lower(aa.email) = lower(auth.jwt() ->> 'email')
        AND lower(aa.slug) = lower(orders.store_slug)
        AND aa.status = 'active'
    )
);

-- 4. Super Admin tem acesso total (Delete, etc)
CREATE POLICY "SuperAdmin acesso total orders"
ON public.orders
FOR ALL
TO authenticated
USING (lower(auth.jwt() ->> 'email') = 'arleisilverio41@gmail.com');
