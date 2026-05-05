-- Cole e rode o seguinte código no "SQL Editor" dentro do Painel do Supabase:

-- 1. Adicionamos a coluna JSONB para salvar os itens do pedido com todos os detalhes legíveis
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items_json JSONB DEFAULT '[]'::jsonb;

-- 2. Damos permissão suprema para o Admin visualizar todos os pedidos do banco
CREATE POLICY "admin_all_orders" ON public.orders
FOR ALL TO authenticated
USING (auth.jwt() ->> 'email' = 'arleisilverio41@gmail.com');