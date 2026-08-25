-- ==============================================================================
-- CORREÇÃO DA TABELA ORDERS (Adicionar items_json, payment_method e permissões)
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/eiqapzziyejicnhfsjdy/sql/new
-- ==============================================================================

-- 1. Garantir todas as colunas necessárias na tabela orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items_json JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS store_slug TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- 2. Habilitar RLS e permissões para checkout de clientes
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow any insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Select orders for lojista and superadmin" ON public.orders;
DROP POLICY IF EXISTS "Update orders for lojista and superadmin" ON public.orders;

-- Permitir qualquer cliente (mesmo sem login ou logado) enviar pedido
CREATE POLICY "Allow any insert orders" 
ON public.orders 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Permitir leitura de pedidos para clientes e lojistas
CREATE POLICY "Select orders for lojista and superadmin" 
ON public.orders 
FOR SELECT 
TO public 
USING (true);

-- Permitir lojistas atualizarem o status (confirmar, enviar motoboy, etc.)
CREATE POLICY "Update orders for lojista and superadmin" 
ON public.orders 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 3. Atualizar cache de schema da API
NOTIFY pgrst, 'reload schema';
