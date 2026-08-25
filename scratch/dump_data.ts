import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function dumpOverview() {
  console.log("=== APP_ADMINS ===");
  const { data: admins } = await supabase.from('app_admins').select('*');
  console.table(admins);

  console.log("\n=== STORE_SETTINGS ===");
  const { data: settings } = await supabase.from('store_settings').select('store_slug, updated_at, menu_data');
  if (settings) {
    settings.forEach(s => {
      console.log(`- Slug: [${s.store_slug}], Atualizado em: ${s.updated_at}, Nome no cardápio: "${s.menu_data?.title || 'Sem título'}", Aberto: ${s.menu_data?.isOpen}`);
    });
  }
}

dumpOverview();
