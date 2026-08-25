import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function discoverTablesAndData() {
  console.log("==================================================");
  console.log("🔍 INVESTIGAÇÃO DE TABELAS NO SUPABASE ATUAL");
  console.log("==================================================");

  // Lista de possíveis tabelas comuns em outros projetos que você possa ter criado
  const probeTables = [
    'app_admins', 'store_settings', 'orders', 'order_items', 'profiles',
    'users', 'deliveries', 'motoboys', 'motoboot', 'rides', 'products',
    'categories', 'clients', 'customers', 'appointments', 'services',
    'restaurants', 'stores', 'messages', 'settings', 'logs', 'pix_payments',
    'acai_orders', 'bolosedoces', 'lanches', 'cardapio'
  ];

  const foundTables: string[] = [];

  for (const table of probeTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      foundTables.push(table);
      console.log(`📌 Tabela encontrada: [${table}]`);
      if (data && data.length > 0) {
        console.log(`   Colunas:`, Object.keys(data[0]).join(', '));
        console.log(`   Amostra:`, JSON.stringify(data[0]));
      }
    }
  }

  console.log("\n==================================================");
  console.log("📋 REGISTROS EM APP_ADMINS & STORE_SETTINGS:");
  console.log("==================================================");
  
  const { data: admins } = await supabase.from('app_admins').select('*');
  console.log("Admins:", JSON.stringify(admins, null, 2));

  const { data: settings } = await supabase.from('store_settings').select('store_slug, menu_data');
  if (settings) {
    settings.forEach(s => {
      console.log(`Loja: ${s.store_slug} | Título: "${s.menu_data?.title}" | Descrição: "${s.menu_data?.description || ''}"`);
    });
  }
}

discoverTablesAndData();
