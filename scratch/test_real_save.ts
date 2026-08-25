import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://eiqapzziyejicnhfsjdy.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpcWFwenppeWVqaWNuaGZzamR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEyODcyNiwiZXhwIjoyMDk0NzA0NzI2fQ.4YPASk7xWbMW1MduGftYxeabkmPtfyb4aGNCnaBmlpM";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testRealUserSave() {
  console.log("Buscando usuário autenticado no Auth para testar salvamento de perfil...");
  const { data: { users } } = await supabase.auth.admin.listUsers();
  
  if (!users || users.length === 0) {
    console.log("Nenhum usuário encontrado.");
    return;
  }

  const user = users[0];
  console.log(`Testando salvamento para usuário: ${user.email} (${user.id})`);

  const { data, error } = await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email,
    full_name: "Cliente Teste Oficial",
    phone: "(11) 98765-4321",
    address: "Rua da Vila, 100 - Bairro da Quebrada",
    avatar_url: "",
    updated_at: new Date().toISOString()
  }).select();

  if (error) {
    console.error("❌ ERRO:", error);
  } else {
    console.log("✅ SUCESSO TOTAL! Perfil salvo no Supabase com todos os campos:", data);
  }
}

testRealUserSave();
