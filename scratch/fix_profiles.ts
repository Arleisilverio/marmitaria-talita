import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://eiqapzziyejicnhfsjdy.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpcWFwenppeWVqaWNuaGZzamR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEyODcyNiwiZXhwIjoyMDk0NzA0NzI2fQ.4YPASk7xWbMW1MduGftYxeabkmPtfyb4aGNCnaBmlpM";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function fixProfilesTable() {
  console.log("Verificando e corrigindo tabela profiles...");

  // Como o Supabase JS Client não roda DDL direto sem rpc exec_sql, vamos tentar chamar exec_sql se existir ou testar o schema
  // Vamos primeiro tentar rodar uma query sql via rpc
  const sql = `
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

    -- Garantir políticas de RLS explícitas para INSERT, UPDATE, SELECT
    DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
    DROP POLICY IF EXISTS "User manage own profile" ON public.profiles;
    DROP POLICY IF EXISTS "User insert own profile" ON public.profiles;
    DROP POLICY IF EXISTS "User update own profile" ON public.profiles;

    CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT TO public USING (true);
    CREATE POLICY "User insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
    CREATE POLICY "User update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  `;

  // Testar inserção/upsert de um profile de teste com service_role
  const testId = "00000000-0000-0000-0000-000000000000";
  const { error: testErr } = await supabase.from('profiles').upsert({
    id: testId,
    full_name: "Teste",
    phone: "11999999999",
    address: "Rua Teste",
    avatar_url: "teste",
    updated_at: new Date().toISOString()
  });

  if (testErr) {
    console.log("Erro detectado no upsert de teste:", testErr);
  } else {
    console.log("Upsert com avatar_url e updated_at funcionou!");
    await supabase.from('profiles').delete().eq('id', testId);
  }
}

fixProfilesTable();
