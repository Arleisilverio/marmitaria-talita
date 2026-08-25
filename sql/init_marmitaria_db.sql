-- ==============================================================================
-- SCHEMA COMPLETO E LIMPO: MARMITARIA TALITA & COMÉRCIOS DE VILA (SAAS MULTI-LOJAS)
-- Execute este script no SQL Editor do seu NOVO projeto Supabase dedicado.
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE ADMINISTRADORES / LOJISTAS (app_admins)
CREATE TABLE IF NOT EXISTS public.app_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    store_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE CONFIGURAÇÕES E CARDÁPIOS DAS LOJAS (store_settings)
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_slug TEXT UNIQUE NOT NULL,
    menu_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE PEDIDOS (orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_slug TEXT NOT NULL,
    user_id UUID,
    customer_name TEXT,
    customer_phone TEXT,
    delivery_address TEXT,
    payment_method TEXT,
    items_json JSONB DEFAULT '[]'::jsonb,
    items JSONB DEFAULT '[]'::jsonb,
    total_amount NUMERIC(10, 2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'pendente',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garantir colunas caso a tabela já existisse
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items_json JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 5. TABELA DE ITENS DO PEDIDO (order_items)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    name TEXT,
    size TEXT,
    meat TEXT,
    quantity INTEGER DEFAULT 1,
    price NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA DE PERFIS DE CLIENTE (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garantir colunas caso a tabela já existisse
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ==============================================================================
-- POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- REGRAS: app_admins
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "SuperAdmin all app_admins" ON public.app_admins;
CREATE POLICY "SuperAdmin all app_admins"
ON public.app_admins
FOR ALL
TO authenticated
USING (lower(auth.jwt() ->> 'email') = 'arleisilverio41@gmail.com');

DROP POLICY IF EXISTS "Public select active app_admins" ON public.app_admins;
CREATE POLICY "Public select active app_admins"
ON public.app_admins
FOR SELECT
TO public
USING (status = 'active' OR lower(auth.jwt() ->> 'email') = lower(email) OR lower(auth.jwt() ->> 'email') = 'arleisilverio41@gmail.com');

-- ------------------------------------------------------------------------------
-- REGRAS: store_settings
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read store_settings" ON public.store_settings;
CREATE POLICY "Public read store_settings"
ON public.store_settings
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "StoreAdmin and SuperAdmin insert store_settings" ON public.store_settings;
CREATE POLICY "StoreAdmin and SuperAdmin insert store_settings"
ON public.store_settings
FOR INSERT
TO authenticated
WITH CHECK (
    lower(auth.jwt() ->> 'email') = 'arleisilverio41@gmail.com'
    OR EXISTS (
        SELECT 1 FROM public.app_admins aa 
        WHERE lower(aa.email) = lower(auth.jwt() ->> 'email')
        AND lower(aa.slug) = lower(store_settings.store_slug)
        AND aa.status = 'active'
    )
);

DROP POLICY IF EXISTS "StoreAdmin and SuperAdmin update store_settings" ON public.store_settings;
CREATE POLICY "StoreAdmin and SuperAdmin update store_settings"
ON public.store_settings
FOR UPDATE
TO authenticated
USING (
    lower(auth.jwt() ->> 'email') = 'arleisilverio41@gmail.com'
    OR EXISTS (
        SELECT 1 FROM public.app_admins aa 
        WHERE lower(aa.email) = lower(auth.jwt() ->> 'email')
        AND lower(aa.slug) = lower(store_settings.store_slug)
        AND aa.status = 'active'
    )
)
WITH CHECK (
    lower(auth.jwt() ->> 'email') = 'arleisilverio41@gmail.com'
    OR EXISTS (
        SELECT 1 FROM public.app_admins aa 
        WHERE lower(aa.email) = lower(auth.jwt() ->> 'email')
        AND lower(aa.slug) = lower(store_settings.store_slug)
        AND aa.status = 'active'
    )
);

-- ------------------------------------------------------------------------------
-- REGRAS: orders & order_items
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow any insert orders" ON public.orders;
CREATE POLICY "Allow any insert orders"
ON public.orders
FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Select orders for lojista and superadmin" ON public.orders;
CREATE POLICY "Select orders for lojista and superadmin"
ON public.orders
FOR SELECT
TO authenticated
USING (
    lower(auth.jwt() ->> 'email') = 'arleisilverio41@gmail.com'
    OR (auth.uid() = user_id)
    OR EXISTS (
        SELECT 1 FROM public.app_admins aa
        WHERE lower(aa.email) = lower(auth.jwt() ->> 'email')
        AND lower(aa.slug) = lower(orders.store_slug)
    )
);

DROP POLICY IF EXISTS "Update orders for lojista and superadmin" ON public.orders;
CREATE POLICY "Update orders for lojista and superadmin"
ON public.orders
FOR UPDATE
TO authenticated
USING (
    lower(auth.jwt() ->> 'email') = 'arleisilverio41@gmail.com'
    OR EXISTS (
        SELECT 1 FROM public.app_admins aa
        WHERE lower(aa.email) = lower(auth.jwt() ->> 'email')
        AND lower(aa.slug) = lower(orders.store_slug)
    )
);

DROP POLICY IF EXISTS "Public insert order_items" ON public.order_items;
CREATE POLICY "Public insert order_items"
ON public.order_items
FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Select order_items authenticated" ON public.order_items;
CREATE POLICY "Select order_items authenticated"
ON public.order_items
FOR SELECT
TO authenticated
USING (true);

-- ------------------------------------------------------------------------------
-- REGRAS: profiles
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- REGRAS: order_messages (Chat do Pedido)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'store', 'system')),
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- ==============================================================================
-- CARGA INICIAL (SEED DATA) - LOJAS DO ECOSSISTEMA TALITA & VILA
-- ==============================================================================

-- 1. Administrador e Loja Principal: Marmitaria Talita
INSERT INTO public.app_admins (email, store_name, slug, status)
VALUES ('arleisilverio41@gmail.com', 'Marmitaria Talita', 'marmitaria-talita', 'active')
ON CONFLICT (slug) DO UPDATE SET store_name = EXCLUDED.store_name, status = 'active';

INSERT INTO public.store_settings (store_slug, menu_data, updated_at)
VALUES (
    'marmitaria-talita',
    '{
        "title": "Marmitaria Talita",
        "description": "Marmitas caseiras fresquinhas, feitas com carinho e o melhor tempero da vila.",
        "isOpen": true,
        "hasDelivery": true,
        "prepTime": 40,
        "deliveryFee": 5,
        "image": "",
        "prices": { "p": 16, "m": 20, "g": 25 },
        "meats": [
            { "name": "Bife Acebolado", "available": true },
            { "name": "Frango Grelhado", "available": true },
            { "name": "Costelinha de Porco", "available": true }
        ],
        "drinks": [
            { "name": "Coca-Cola 350ml", "price": 6, "available": true },
            { "name": "Guaraná Antarctica 350ml", "price": 5, "available": true },
            { "name": "Suco Natural de Laranja 500ml", "price": 7, "available": true }
        ],
        "slides": []
    }'::jsonb,
    NOW()
)
ON CONFLICT (store_slug) DO UPDATE SET menu_data = EXCLUDED.menu_data, updated_at = NOW();

-- 2. Loja de Doces: Talita Bolos & Doces
INSERT INTO public.app_admins (email, store_name, slug, status)
VALUES ('arleisilverio41@gmail.com', 'Talita Bolos & Doces', 'talita-bolos-doces', 'active')
ON CONFLICT (slug) DO UPDATE SET store_name = EXCLUDED.store_name, status = 'active';

INSERT INTO public.store_settings (store_slug, menu_data, updated_at)
VALUES (
    'talita-bolos-doces',
    '{
        "title": "Talita Bolos & Doces",
        "description": "Deliciosos bolos caseiros, fatias recheadas, tortas e doces artesanais feitos com carinho.",
        "isOpen": true,
        "hasDelivery": true,
        "prepTime": 30,
        "deliveryFee": 5,
        "image": "",
        "prices": { "p": 12, "m": 25, "g": 45 },
        "meats": [
            { "name": "Bolo de Cenoura com Chocolate", "available": true },
            { "name": "Bolo Red Velvet Especial", "available": true },
            { "name": "Torta de Limão", "available": true }
        ],
        "drinks": [
            { "name": "Café Gourmet Expresso", "price": 5, "available": true },
            { "name": "Cappuccino Cremoso", "price": 8, "available": true },
            { "name": "Água com Gás", "price": 4, "available": true }
        ],
        "slides": []
    }'::jsonb,
    NOW()
)
ON CONFLICT (store_slug) DO UPDATE SET menu_data = EXCLUDED.menu_data, updated_at = NOW();
