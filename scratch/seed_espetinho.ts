import { createClient } from '@supabase/supabase-js';
import { STORE_TEMPLATES } from '../src/lib/templates';

const SUPABASE_URL = "https://eiqapzziyejicnhfsjdy.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpcWFwenppeWVqaWNuaGZzamR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEyODcyNiwiZXhwIjoyMDk0NzA0NzI2fQ.4YPASk7xWbMW1MduGftYxeabkmPtfyb4aGNCnaBmlpM";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createEspetinhoStore() {
  console.log("Cadastrando Loja de Espetinhos com Service Role no Supabase...");

  const slug = "espetinho-da-quebrada";
  const storeName = "Espetinho da Quebrada";
  const email = "arleisilverio41@gmail.com";

  // 1. Cadastrar em app_admins
  const { error: adminErr } = await supabase.from('app_admins').upsert({
    email: email,
    store_name: storeName,
    slug: slug,
    status: 'active'
  }, { onConflict: 'slug' });

  if (adminErr) console.error("Erro admin:", adminErr);

  // 2. Cadastrar em store_settings com template completo
  const template = STORE_TEMPLATES['espetinho'];
  const { error: storeErr } = await supabase.from('store_settings').upsert({
    store_slug: slug,
    menu_data: {
      ...template.menu_data,
      title: storeName,
      isOpen: true
    },
    updated_at: new Date().toISOString()
  }, { onConflict: 'store_slug' });

  if (storeErr) console.error("Erro store:", storeErr);

  console.log("✅ Loja de Espetinho criada com sucesso no banco!");
}

createEspetinhoStore();
