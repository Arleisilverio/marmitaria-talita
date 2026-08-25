import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltando variáveis de ambiente no .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log(`Testando conexão com: ${supabaseUrl}`);
  
  // 1. Tentar ler app_admins
  const { data: admins, error: adminError } = await supabase
    .from('app_admins')
    .select('*');

  if (adminError) {
    console.error("Erro ao ler app_admins:", adminError.message);
  } else {
    console.log(`Encontrados ${admins?.length || 0} admins.`);
    console.table(admins);
  }

  // 2. Tentar ler store_settings
  const { data: settings, error: settingsError } = await supabase
    .from('store_settings')
    .select('*');

  if (settingsError) {
    console.error("Erro ao ler store_settings:", settingsError.message);
  } else {
    console.log(`Encontradas ${settings?.length || 0} configurações de loja.`);
    console.table(settings);
  }
}

test();
