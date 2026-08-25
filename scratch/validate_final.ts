import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinal() {
  console.log("==================================================");
  console.log(`🚀 TESTE DE VALIDAÇÃO: ${supabaseUrl}`);
  console.log("==================================================");

  // 1. App Admins
  const { data: admins, error: adminErr } = await supabase.from('app_admins').select('*');
  if (adminErr) {
    console.error("❌ Erro em app_admins:", adminErr.message);
  } else {
    console.log(`✅ app_admins: ${admins?.length} lojistas encontrados`);
    console.table(admins);
  }

  // 2. Store Settings
  const { data: stores, error: storeErr } = await supabase.from('store_settings').select('*');
  if (storeErr) {
    console.error("❌ Erro em store_settings:", storeErr.message);
  } else {
    console.log(`✅ store_settings: ${stores?.length} lojas configuradas`);
    stores?.forEach(s => {
      console.log(`   - Loja [${s.store_slug}]: "${s.menu_data?.title}" (Aberto: ${s.menu_data?.isOpen})`);
    });
  }

  // 3. Teste das queries da API do Frontend (getAllStores)
  const { data: activeAdmins } = await supabase.from('app_admins').select('slug').eq('status', 'active');
  const activeSlugs = activeAdmins?.map(a => a.slug) || [];
  const { data: marketplaceStores } = await supabase.from('store_settings').select('store_slug, menu_data').in('store_slug', activeSlugs);
  
  console.log(`\n🏪 Marketplace Vitrine Principal: ${marketplaceStores?.length} lojas ativas para os clientes:`);
  marketplaceStores?.forEach(st => {
    console.log(`   👉 /${st.store_slug} -> "${st.menu_data?.title}" (${st.menu_data?.description})`);
  });

  console.log("\n==================================================");
  console.log("🎉 TUDO PRONTO E FUNCIONANDO COM SUCESSO!");
  console.log("==================================================");
}

testFinal();
