import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltando variáveis de ambiente no .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log("==========================================");
  console.log(`🔍 AUDITORIA DO BANCO DE DADOS: ${supabaseUrl}`);
  console.log("==========================================");

  const tables = ['app_admins', 'store_settings', 'orders', 'order_items', 'profiles'];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: false })
        .limit(5);

      if (error) {
        console.log(`❌ Tabela [${table}]: ERRO - ${error.code} | ${error.message} (${error.details || ''})`);
      } else {
        console.log(`✅ Tabela [${table}]: OK - ${data?.length} registros retornados (amostra)`);
        if (data && data.length > 0) {
          console.log(`   Colunas detectadas:`, Object.keys(data[0]).join(', '));
          console.log(`   Amostra:`, JSON.stringify(data[0], null, 2).slice(0, 300) + '...');
        } else {
          console.log(`   Tabela vazia ou bloqueada por RLS para anon.`);
        }
      }
    } catch (e: any) {
      console.log(`💥 Exceção em [${table}]: ${e.message}`);
    }
    console.log("------------------------------------------");
  }

  // Verificar autenticação / config geral
  try {
    const { data: authConfig, error: authError } = await supabase.auth.getSession();
    console.log(`Auth Session Status:`, authError ? `Erro: ${authError.message}` : `Pronto (Sem sessão ativa anônima)`);
  } catch (e: any) {
    console.log(`Erro ao testar auth: ${e.message}`);
  }
}

checkDatabase();
