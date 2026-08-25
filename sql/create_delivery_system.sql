-- ==============================================================================
-- SISTEMA DE DELIVERY & GESTÃO DE MOTOBOYS POR LOJA
-- ==============================================================================

-- 1. Tabela de Motoboys por Estabelecimento (até 5 por loja)
CREATE TABLE IF NOT EXISTS public.store_couriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_slug TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    vehicle_plate TEXT,
    status TEXT NOT NULL DEFAULT 'available', -- 'available' (na fila), 'busy' (em entrega), 'offline'
    queue_joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deliveries_count INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para busca rápida e ordenação de fila por ordem de chegada (FIFO)
CREATE INDEX IF NOT EXISTS idx_store_couriers_slug ON public.store_couriers(store_slug);
CREATE INDEX IF NOT EXISTS idx_store_couriers_email ON public.store_couriers(email);
CREATE INDEX IF NOT EXISTS idx_store_couriers_queue ON public.store_couriers(store_slug, status, queue_joined_at);

-- 2. Campos de Entregador na Tabela Orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10, 2) DEFAULT 0.00;

-- 3. Tabela de Histórico Financeiro / Repasses de Entregas
CREATE TABLE IF NOT EXISTS public.courier_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID NOT NULL,
    order_id UUID NOT NULL,
    store_slug TEXT NOT NULL,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courier_payouts_courier ON public.courier_payouts(courier_id);
CREATE INDEX IF NOT EXISTS idx_courier_payouts_store ON public.courier_payouts(store_slug);

-- 4. Habilitar RLS e Permissões
ALTER TABLE public.store_couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select store_couriers" ON public.store_couriers;
DROP POLICY IF EXISTS "Public insert store_couriers" ON public.store_couriers;
DROP POLICY IF EXISTS "Public update store_couriers" ON public.store_couriers;
DROP POLICY IF EXISTS "Public delete store_couriers" ON public.store_couriers;

CREATE POLICY "Public select store_couriers" ON public.store_couriers FOR SELECT TO public USING (true);
CREATE POLICY "Public insert store_couriers" ON public.store_couriers FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update store_couriers" ON public.store_couriers FOR UPDATE TO public USING (true);
CREATE POLICY "Public delete store_couriers" ON public.store_couriers FOR DELETE TO public USING (true);

DROP POLICY IF EXISTS "Public select courier_payouts" ON public.courier_payouts;
DROP POLICY IF EXISTS "Public insert courier_payouts" ON public.courier_payouts;
DROP POLICY IF EXISTS "Public update courier_payouts" ON public.courier_payouts;

CREATE POLICY "Public select courier_payouts" ON public.courier_payouts FOR SELECT TO public USING (true);
CREATE POLICY "Public insert courier_payouts" ON public.courier_payouts FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update courier_payouts" ON public.courier_payouts FOR UPDATE TO public USING (true);

-- 5. Atualização de Status de Pedidos (Entrega e Finalização)
DROP POLICY IF EXISTS "Update orders for lojista and superadmin" ON public.orders;
DROP POLICY IF EXISTS "Allow update order status" ON public.orders;
CREATE POLICY "Allow update order status" ON public.orders FOR UPDATE TO public USING (true) WITH CHECK (true);

