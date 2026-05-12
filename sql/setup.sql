-- 1. Garantir que o RLS está ativado
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas que podem estar conflitando
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_public" ON public.orders;
DROP POLICY IF EXISTS "order_items_insert_public" ON public.order_items;

-- 3. Criar política para INSERIR pedidos (Apenas usuários logados)
CREATE POLICY "auth_insert_orders" ON public.orders
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Criar política para INSERIR itens do pedido
CREATE POLICY "auth_insert_order_items" ON public.order_items
FOR INSERT TO authenticated
WITH CHECK (true);

-- 5. Criar política para VER os próprios pedidos
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "auth_select_orders" ON public.orders
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR (auth.jwt() ->> 'email' = 'arleisilverio41@gmail.com'));

-- 6. Garantir que o Admin (você) pode ver tudo
DROP POLICY IF EXISTS "Admin can view all orders" ON public.orders;
CREATE POLICY "admin_select_all" ON public.orders
FOR SELECT TO authenticated
USING (auth.jwt() ->> 'email' = 'arleisilverio41@gmail.com');
